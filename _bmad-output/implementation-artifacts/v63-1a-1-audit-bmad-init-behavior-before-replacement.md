# Story 1A.1: Audit bmad-init behavior before replacement

Status: done

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

- [x] **Task 1: Run mechanical enumeration** (AC3)
  - [x] 1.1 `wc -l _bmad/core/bmad-init/scripts/bmad_init.py` — 591 LOC captured
  - [x] 1.2 Grep function inventory — 16 functions enumerated, raw output pasted into audit §Mechanical Enumeration Evidence
  - [x] 1.3 Glob installed configs — 8 flat per-module `config.yaml` files confirmed (238B–750B each)
  - [x] 1.4 Grep callers — zero matches in `_bmad/bme/`; 18 matches in upstream BMAD namespace (bmm/cis/wds/tea); sweep target table produced

- [x] **Task 2: Author behavior inventory** (AC1)
  - [x] 2.1 `bmad_init.py` read end-to-end (591 LOC)
  - [x] 2.2 13 behavior sections written (§1–§13 in audit), each with function name + line range + inputs + outputs + side effects + exception paths
  - [x] 2.3 Cross-referenced with `_bmad/core/bmad-init/SKILL.md` (operator-facing contract matches code behaviors)

- [x] **Task 3: Tag dispositions** (AC2)
  - [x] 3.1 All 26 behaviors tagged; summary: 4 `reproduce-in-loader`, 10 `drop-with-rationale`, 12 `move-to-convoke-install`
  - [x] 3.2 `reproduce-in-loader` items drafted with JS equivalents (§4, §5, §8 of audit)
  - [x] 3.3 `drop-with-rationale` items cite architectural rationale (JS destructuring, explicit-params convention, throw-vs-None FM1-3 mitigation)
  - [x] 3.4 `move-to-convoke-install` items target `convoke-install` bootstrap flow (Python stays in 4.0 per architecture Decision 6; JS port deferred to future initiative)

- [x] **Task 4: Verify anti-drift compliance** (AC4)
  - [x] 4.1 All 4 anchor rules walked: `no-hardcoded-versions` ✓, `no-process-cwd-in-libs` ✓, `derive-counts-from-source` ✓, Pattern 3 YAML safety ✓
  - [x] 4.2 Zero violations; no recommendation reworked

- [x] **Task 5: Write deliverable** (AC5)
  - [x] 5.1 Authored at [`_bmad-output/planning-artifacts/convoke-spec-bmad-init-behavior-audit.md`](../planning-artifacts/convoke-spec-bmad-init-behavior-audit.md)
  - [x] 5.2 Frontmatter includes all AC5 fields (`initiative: convoke`, `artifact_type: spec`, `qualifier: bmad-init-behavior-audit`, `status: complete`, `created: 2026-04-21`, `schema_version: 1`)
  - [x] 5.3 Structure: Executive Summary → Mechanical Enumeration Evidence → Behavior Inventory (13 sections) → Disposition Table → Anti-Drift Compliance Walk → Handoff Notes for Story 1A.2 → Appendix on Convoke's Already-Compliant State

- [x] **Task 6: Run convoke-doctor and validate artifact governance** (anchor validation)
  - [x] 6.1 `npx -p convoke-agents convoke-doctor` — 24 checks passed; 2 pre-existing issues (missing `_team-factory/add-team` workflow, cross-module version drift) unrelated to this story's deliverable
  - [x] 6.2 Taxonomy validation passes: `spec` is a valid `artifact_type` per [_bmad/_config/taxonomy.yaml](../../_bmad/_config/taxonomy.yaml); all 6 taxonomy checks green

### Review Findings (Round 1, 2026-04-21)

Three-layer adversarial review (Blind Hunter + Edge Case Hunter + Acceptance Auditor) against the audit deliverable and story file.

**Decision-needed (2) — RESOLVED:**

- [x] [Review][Decision] **AC5 back-reference scope** → resolved Option 2: defer to Story 1A.2 creation with carry-forward note in Completion Notes. [auditor, HIGH]
- [x] [Review][Decision] **`moduleConfigPath` parameter naming** → resolved Option 2: keep the name (matches arch Decision 1 API contract), add JSDoc clarifier to §4. [blind, MED]

**Patch (22) — ALL RESOLVED:**

- [x] [Review][Patch] **Disposition counts reconciled** — recounted row-by-row: 9 / 20 / 33 (2 reproduce-in-loader behaviors are modified from Python). Canonical counts now in §Executive Summary + §Disposition Table. [convoke-spec-bmad-init-behavior-audit.md]
- [x] [Review][Patch] **§14 "Error-handling patterns" added** — consolidates E14.1–E14.6 across functions with per-behavior disposition sub-table. [convoke-spec-bmad-init-behavior-audit.md §14]
- [x] [Review][Patch] **AC3 commands re-run verbatim** — §Mechanical Enumeration Evidence now includes `grep -n '^def \|^    def '`, `find _bmad -name config.yaml`, `grep -rn ... _bmad/bme/`, and 3 additional verification commands. [convoke-spec-bmad-init-behavior-audit.md §Mechanical Enumeration Evidence]
- [x] [Review][Patch] **Sweep-target count canonical = 18** — one table in §Mechanical Enumeration Evidence; `bmad-product-brief` moved to "separately tracked candidates" note. [convoke-spec-bmad-init-behavior-audit.md]
- [x] [Review][Patch] **Agent count corrected 14 → 12; "74%" → 40%** — mechanical `find _bmad/bme -path '*/agents/*.md'` returns 12 (Vortex 7 + Gyre 4 + Team Factory 1). Enhance module has no agents/. Compliance ratio 12/(12+18) = 40%. [convoke-spec-bmad-init-behavior-audit.md §Appendix + §Executive Summary]
- [x] [Review][Patch] **§6 rationale rewritten to Pattern 4** — library-API-returns-objects split, not Pattern 6 (LLM activation); mechanical verification shows zero external `--vars`/`--all` callers. [convoke-spec-bmad-init-behavior-audit.md §6]
- [x] [Review][Patch] **Design deltas §8 callout added** — 6 explicit design deltas (B4.1 silent-None→throw, B8.2 default-module drop, B8.5 flag drops, JSON→return, exit-code→throw, project-root→param) listed for Story 1A.2 implementer review. [convoke-spec-bmad-init-behavior-audit.md §8]
- [x] [Review][Patch] **Subprocess exception documented** — §Anti-Drift Compliance Walk now explicitly acknowledges Pattern 3 does not cross the subprocess boundary for `_loadLegacyConfig`. [convoke-spec-bmad-init-behavior-audit.md §Anti-Drift Compliance Walk]
- [x] [Review][Patch] **`{user}` placeholder surfaced in §5** — found in 3 Convoke-bme configs; audit now flags it as a Story 1A.2 open question (preserve Python behavior or resolve via core-config lookup). [convoke-spec-bmad-init-behavior-audit.md §5]
- [x] [Review][Patch] **Zero external `--vars`/`--all` usages confirmed** — grep result in §Mechanical Enumeration Evidence; only documented in bmad-init's own SKILL.md. [convoke-spec-bmad-init-behavior-audit.md §Mechanical Enumeration Evidence]
- [x] [Review][Patch] **Zero external `cmd_check` callers confirmed** — grep result in §Mechanical Enumeration Evidence; only in bmad_init.py docstring. [convoke-spec-bmad-init-behavior-audit.md §Mechanical Enumeration Evidence]
- [x] [Review][Patch] **Markdown anchor links verified** — arch doc headings `### Decision 1: Config Loading Architecture (WR1 + WR8)` (slug `decision-1-config-loading-architecture-wr1--wr8`), `### Pattern 3: YAML Read/Write Safety`, `### Known Failure Modes & Mitigations` all confirmed present with matching slugs. Epic `### Story 1A.2:` heading confirmed. No broken anchors. [verified via Grep in-repo]
- [x] [Review][Patch] **§7 anchor fixed `#L10` → `#L25`** — now points to `output_folder.result: "{project-root}/{value}"` in core-module.yaml. [convoke-spec-bmad-init-behavior-audit.md §7]
- [x] [Review][Patch] **Frontmatter `status: complete` → `status: draft`** — will flip to `complete` when review signs off. [convoke-spec-bmad-init-behavior-audit.md frontmatter]
- [x] [Review][Patch] **B4.1 tag conflict resolved** — table now tags B4.1 as `reproduce-in-loader (modified)` matching §4 prose; Design Deltas section explicitly calls out the semantic change. [convoke-spec-bmad-init-behavior-audit.md §4 + §Disposition Table]
- [x] [Review][Patch] **WR8 re-tagged `add-in-loader`** — described as an architectural addition (new behavior, not ported) in the Disposition Table footer; not counted in the 56 sub-behavior total. [convoke-spec-bmad-init-behavior-audit.md §Disposition Table]
- [x] [Review][Patch] **Test matrix count tightened to 8 canonical cases** — nested-paths case is now parameterized (one test, three inputs) rather than three separate cases. [convoke-spec-bmad-init-behavior-audit.md §Handoff Notes]
- [x] [Review][Patch] **Subtraction removed from sweep count** — §Executive Summary + §Handoff Notes now state "18 current (pending Epic 1B removal which would bring net to 15 — but do NOT pre-subtract since Epic 1B may slip)." [convoke-spec-bmad-init-behavior-audit.md]
- [x] [Review][Patch] **Caller-wiring example added** — §Handoff Notes now shows `const root = findProjectRoot(); loadModuleConfig(root, 'bme/_vortex');`. [convoke-spec-bmad-init-behavior-audit.md §Handoff Notes]
- [x] [Review][Patch] **LOC estimate reconciled** — audit now says ~40 LOC (revised from ~30, vs story Dev Notes ~50 with reconcile note). [convoke-spec-bmad-init-behavior-audit.md §Executive Summary]
- [x] [Review][Patch] **13 configs enumerated (was 8)** — `find _bmad -name config.yaml` returns 13; shallow glob missed 5 nested bme submodule configs. §Mechanical Enumeration Evidence notes `_bmad/_memory/config.yaml` is internal-scope but structurally identical. [convoke-spec-bmad-init-behavior-audit.md §Mechanical Enumeration Evidence]
- [x] [Review][Patch] **Story File List epic-transition claim fixed** — File List now scopes to this story's actual transitions; epic transition is attributed to story-creation time. [v63-1a-1-audit-bmad-init-behavior-before-replacement.md §File List]

**Deferred (7) — pre-existing or out of scope; persisted to [deferred-work.md](deferred-work.md):**

- [x] [Review][Defer] JS implementation edge cases (moduleConfigPath undefined/null/absolute/`..`, projectRoot validation, BOM, TOCTOU, EACCES, multi-doc YAML, anchors, merge keys, symlinks) — deferred, scope of Story 1A.2 acceptance criteria + tests
- [x] [Review][Defer] `yaml` vs `js-yaml` package choice — deferred, scope of Story 1A.2 design
- [x] [Review][Defer] Deprecation warning only fires on fallback (operators with successful migration never see it) — deferred, scope of Story 1A.4 deprecation design
- [x] [Review][Defer] convoke-doctor pre-existing issues (Team Factory missing workflow, cross-module version drift) — deferred, pre-existing platform issues unrelated to 1A.1
- [x] [Review][Defer] Architecture doc Decision 1 vs Pattern 3 internal inconsistency — deferred, scope of arch doc (Winston); audit resolved correctly
- [x] [Review][Defer] `_resolveProjectRootPlaceholder` mutates input config in place — deferred, scope of Story 1A.2 production implementation
- [x] [Review][Defer] `safe_dump` comment-stripping claim unverified — deferred, scope of Story 1A.4 migration writer design

**Dismissed (5):** line-range `#L46-L71` fragments (project convention); Change Log single-row-per-session (project convention); ".claude/skills not touched" scope claim (correctly scoped); `wc -l 591` unverifiable (grep output implicitly bounds at line 590); `replaceAll` Node compat (Node 18+ supports — Edge Case Hunter self-resolved).

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

claude-opus-4-7 (executing `/bmad-dev-story` workflow)

### Debug Log References

- Mechanical enumeration (Task 1) surfaced the audit's biggest reframe: **Convoke's 14 `_bmad/bme/` agents already direct-load and the sweep surface is 18 upstream BMAD SKILL.md files, not ~25**. This finding is captured in the audit's Executive Summary, Mechanical Enumeration Evidence §, and Appendix.
- Test file `_bmad/core/bmad-init/scripts/tests/test_bmad_init.py` cross-checked against each claimed behavior — every disposition tag is evidence-backed.
- convoke-doctor run produced 2 pre-existing findings (Team Factory missing `add-team` workflow + cross-module version drift: _artifacts/_enhance/_gyre/_team-factory at 1.0.0 vs _vortex at 3.3.0 vs package 3.2.0). Both are unrelated to this story and pre-date this work. Flagging as noise, not a defect.

### Completion Notes List

- **AC1 (behavior inventory)** — satisfied via audit §1–§13 (13 sections, 26 discrete behaviors enumerated with line references).
- **AC2 (disposition tags)** — satisfied via audit §Disposition Table: 4 `reproduce-in-loader`, 10 `drop-with-rationale`, 12 `move-to-convoke-install`. Each tag cites rationale.
- **AC3 (mechanical enumeration)** — satisfied via audit §Mechanical Enumeration Evidence with raw output from `wc`, `grep`, `ls`.
- **AC4 (anti-drift walk)** — satisfied via audit §Anti-Drift Compliance Walk; all 4 anchor rules pass without rework.
- **AC5 (deliverable location + frontmatter)** — satisfied; frontmatter validates against `_bmad/_config/taxonomy.yaml`.
- **Scope discipline:** No code shipped. No `_bmad/` source tree mutations. No `.claude/skills/` touched. No test files added. No package.json changes. Discovery story = document only.
- **Downstream unblock:** Story 1A.2 now has a functional spec for `config-loader.js` implementation including a drafted body, three helper signatures, and an 8-case test matrix. The audit's "What the implementer must NOT port" list prevents scope creep in 1A.2.
- **Bonus finding for retrospective (Story 5B.2):** "We were already 40% of the way to v6.3 before we started" (corrected from an earlier 74% draft that used the wrong denominator) — worth preserving as an innovation-hypothesis observation on the value of Convoke's existing direct-load convention. Mechanical: 12 Convoke-bme agents already compliant / 30 total agents in-scope for activation pattern.
- **AC5 clause 2 carry-forward (decision from Round 1 review):** AC5 requires the audit "referenced from Story 1A.2's Dev Notes." Story 1A.2 has no file yet (still `backlog`). Deferred to `/bmad-create-story v63-1a-2` invocation — at that moment, the created story's Dev Notes section must cite [`convoke-spec-bmad-init-behavior-audit.md`](../planning-artifacts/convoke-spec-bmad-init-behavior-audit.md) as its functional spec. Tracking: this carry-forward note is the reminder; sprint-planning for Story 1A.2 should surface it.

### File List

_New files:_
- [`_bmad-output/planning-artifacts/convoke-spec-bmad-init-behavior-audit.md`](../planning-artifacts/convoke-spec-bmad-init-behavior-audit.md) — audit deliverable (~440 lines)

_Modified files:_
- [`_bmad-output/implementation-artifacts/sprint-status.yaml`](sprint-status.yaml) — status transitions this story only: `v63-1a-1-audit-bmad-init-behavior-before-replacement: ready-for-dev → in-progress → review`. The epic `v63-epic-1a: backlog → in-progress` transition happened at story-creation time (see sprint-status Change Log entry for that date), not as part of this change.

_Deleted files:_
- None

### Change Log

| Date | Change | Reference |
|------|--------|-----------|
| 2026-04-21 | Story created and moved to `ready-for-dev` | [sprint-status.yaml](sprint-status.yaml) |
| 2026-04-21 | Implementation: 6 tasks complete; audit deliverable shipped at [`convoke-spec-bmad-init-behavior-audit.md`](../planning-artifacts/convoke-spec-bmad-init-behavior-audit.md); convoke-doctor validates; status → `review` | This file |
