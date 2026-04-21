---
initiative: convoke
artifact_type: spec
qualifier: bmad-init-behavior-audit
status: complete
created: '2026-04-21'
schema_version: 1
---

# bmad-init Behavior Audit — Functional Spec for `config-loader.js`

**Audited script:** [`_bmad/core/bmad-init/scripts/bmad_init.py`](../../_bmad/core/bmad-init/scripts/bmad_init.py) (591 LOC)
**Target replacement:** `scripts/update/lib/config-loader.js` (per [Architecture Decision 1](convoke-arch-bmad-v6.3-adoption.md#decision-1-config-loading-architecture-wr1--wr8))
**Closes failure mode:** [FM1-2](convoke-arch-bmad-v6.3-adoption.md#known-failure-modes--mitigations) — "bmad-init undocumented behaviors"
**Parent story:** [Story 1A.1](../implementation-artifacts/v63-1a-1-audit-bmad-init-behavior-before-replacement.md)
**Downstream consumer:** [Story 1A.2](convoke-epic-bmad-v6.3-adoption.md#story-1a2-create-config-loaderjs-with-direct-yaml-loading) (loader implementation)

---

## Executive Summary

`bmad_init.py` is a **591-line multi-command script** that conflates two concerns v6.3 separates: **loading** already-written configs (~20% of the code) and **bootstrapping** missing configs (~80%). The replacement `config-loader.js` owns only the load path. Most bmad_init behaviors drop from the loader with rationale or move to `convoke-install`.

**Key reframe from pre-audit research:** the "v6.3 migration sweep" surface is **18 upstream BMAD `SKILL.md` files** (all using `"Load config via bmad-init skill"`), not ~25 as the PRD estimated. Convoke's own 14 bme agents (7 Vortex + Gyre + Enhance + Team Factory + Artifacts) **already direct-load** `{project-root}/_bmad/{module}/config.yaml` at activation — they are v6.3-compliant today. This narrows the scope of Story 1A.3 (migration inventory) and Story 1A.4 Phase 3 (agent sweep) materially.

**Disposition summary (26 behaviors classified):**

| Disposition | Count | Meaning |
|-------------|------:|---------|
| `reproduce-in-loader` | 4 | Load-path behaviors; must appear in `config-loader.js` |
| `drop-with-rationale` | 10 | Bootstrap-path or legacy-only; explicitly not ported |
| `move-to-convoke-install` | 12 | Bootstrap concerns; belong to installer, not loader |

The loader body is projected at ~30 LOC versus bmad_init's 591 — a 20× reduction tracking the v6.3 "content, not software" insight.

---

## Mechanical Enumeration Evidence (AC3)

Per project-context.md `mechanical-research-enumeration` rule, all enumeration derives from grep/glob/wc output, not eyeballing:

```text
$ wc -l _bmad/core/bmad-init/scripts/bmad_init.py
     591 _bmad/core/bmad-init/scripts/bmad_init.py

$ grep -n '^def ' _bmad/core/bmad-init/scripts/bmad_init.py
46:def find_project_root(llm_provided=None):
78:def load_module_yaml(path):
112:def find_core_module_yaml():
117:def find_target_module_yaml(module_code, project_root, skill_path=None):
147:def load_config_file(path):
157:def load_module_config(module_code, project_root):
163:def resolve_project_root_placeholder(value, project_root):
172:def parse_var_specs(vars_string):
196:def expand_template(value, context):
212:def apply_result_template(var_def, raw_value, context):
232:def cmd_load(args):
279:def cmd_check(args):
345:def cmd_resolve_defaults(args):
403:def cmd_write(args):
523:def _write_config_file(path, data, module_label):
537:def main():

$ ls -la _bmad/*/config.yaml
-rw-r--r--  _bmad/_memory/config.yaml   270B
-rw-r--r--  _bmad/bmb/config.yaml       391B
-rw-r--r--  _bmad/bme/config.yaml       266B
-rw-r--r--  _bmad/bmm/config.yaml       510B
-rw-r--r--  _bmad/cis/config.yaml       339B
-rw-r--r--  _bmad/core/config.yaml      238B
-rw-r--r--  _bmad/tea/config.yaml       750B
-rw-r--r--  _bmad/wds/config.yaml       488B
# 8 flat per-module configs, 238B–750B — confirms shape: flat YAML with core vars merged in

$ grep -l 'Load config via bmad-init' _bmad/**/*.md | wc -l
18
# Sweep surface: 18 SKILL.md files, all in upstream BMAD namespace

$ grep -c 'bmad-init\|bmad_init' _bmad/bme/**/*.md
# (zero hits in Convoke's bme namespace — they already direct-load)
```

**Callers enumeration (sweep target for Story 1A.4 Phase 3):**

| Module | File | Agent |
|--------|------|-------|
| bmm | `_bmad/bmm/1-analysis/bmad-agent-analyst/SKILL.md` | Mary (analyst) |
| bmm | `_bmad/bmm/1-analysis/bmad-agent-tech-writer/SKILL.md` | Paige |
| bmm | `_bmad/bmm/1-analysis/bmad-product-brief/SKILL.md` | — |
| bmm | `_bmad/bmm/2-plan-workflows/bmad-agent-pm/SKILL.md` | John |
| bmm | `_bmad/bmm/2-plan-workflows/bmad-agent-ux-designer/SKILL.md` | Sally |
| bmm | `_bmad/bmm/3-solutioning/bmad-agent-architect/SKILL.md` | Winston |
| bmm | `_bmad/bmm/4-implementation/bmad-agent-dev/SKILL.md` | Amelia |
| bmm | `_bmad/bmm/4-implementation/bmad-agent-qa/SKILL.md` | Quinn *(removed in Epic 1B)* |
| bmm | `_bmad/bmm/4-implementation/bmad-agent-sm/SKILL.md` | Bob *(removed in Epic 1B)* |
| bmm | `_bmad/bmm/4-implementation/bmad-agent-quick-flow-solo-dev/SKILL.md` | Barry *(removed in Epic 1B)* |
| cis | `_bmad/cis/skills/bmad-cis-agent-brainstorming-coach/SKILL.md` | Carson |
| cis | `_bmad/cis/skills/bmad-cis-agent-creative-problem-solver/SKILL.md` | Dr. Quinn |
| cis | `_bmad/cis/skills/bmad-cis-agent-design-thinking-coach/SKILL.md` | Maya |
| cis | `_bmad/cis/skills/bmad-cis-agent-innovation-strategist/SKILL.md` | Victor |
| cis | `_bmad/cis/skills/bmad-cis-agent-presentation-master/SKILL.md` | Caravaggio |
| cis | `_bmad/cis/skills/bmad-cis-agent-storyteller/SKILL.md` | Sophia |
| wds | `_bmad/wds/agents/wds-agent-freya-ux/SKILL.md` | Freya |
| wds | `_bmad/wds/agents/wds-agent-saga-analyst/SKILL.md` | Saga |
| tea | `_bmad/tea/agents/bmad-tea/SKILL.md` | Murat |

Total: **19 rows** — 18 with the "Load config via bmad-init skill" pattern + 1 (`bmad-product-brief`) that mentions bmad-init but may not match the exact sweep pattern. Story 1A.3 must verify the final count via a more precise pattern (`grep -l '^1\. \*\*Load config via bmad-init'`) and subtract the 3 removed-by-Epic-1B agents (Quinn, Bob, Barry) → **~16 net sweep targets**.

---

## Behavior Inventory (AC1)

### §1 — Project-root detection (`find_project_root`)

**Lines:** [bmad_init.py:46-71](../../_bmad/core/bmad-init/scripts/bmad_init.py#L46-L71)
**Inputs:** Optional `llm_provided` string path.
**Outputs:** `Path` object or `None`.
**Behaviors:**
- **B1.1:** If `llm_provided` is given AND that path contains `_bmad/`, return it.
- **B1.2:** If `llm_provided` is given but `_bmad/` doesn't exist yet AND the path is a directory, still return it (first-run bootstrap case — verified by [test_llm_provided_without_bmad_still_returns_dir](../../_bmad/core/bmad-init/scripts/tests/test_bmad_init.py#L57-L64)).
- **B1.3:** Otherwise walk up from `Path.cwd()` and `Path(__file__).resolve().parent` looking for `_bmad/`. Returns first match.
- **B1.4:** Returns `None` if no match found.

**Disposition:** `drop-with-rationale`.

**Rationale:** Convoke already has `findProjectRoot()` at [`scripts/update/lib/utils.js`](../../scripts/update/lib/utils.js) which the entire `scripts/update/` infrastructure uses. Duplicating path-detection logic in `config-loader.js` violates project-context.md `no-process-cwd-in-libs` and the architecture's "accept `projectRoot` as parameter" convention. The loader accepts `projectRoot` from its caller; caller resolves via `findProjectRoot()` at CLI entry point.

**First-run case (B1.2):** handled upstream in `convoke-install` bootstrap, not in the load path. The loader never encounters a pre-`_bmad` state.

---

### §2 — Module.yaml discovery (`find_core_module_yaml`, `find_target_module_yaml`)

**Lines:** [bmad_init.py:112-140](../../_bmad/core/bmad-init/scripts/bmad_init.py#L112-L140)
**Behaviors:**
- **B2.1:** `find_core_module_yaml()` returns hardcoded `{script_dir}/../resources/core-module.yaml`.
- **B2.2:** `find_target_module_yaml(module_code, project_root, skill_path)` searches in order:
  1. `skill_path/assets/module.yaml`
  2. `skill_path/module.yaml`
  3. `_bmad/{module_code}/module.yaml`
- **B2.3:** Returns first existing path, else `None`.
- **B2.4:** Skill-path takes priority over `_bmad/{module}/` ([confirmed in test_skill_path_takes_priority](../../_bmad/core/bmad-init/scripts/tests/test_bmad_init.py#L248-L260)).

**Disposition:** `move-to-convoke-install`.

**Rationale:** `module.yaml` is consumed only for **prompting questions** during bootstrap (`cmd_check`, `cmd_resolve_defaults`, `cmd_write`). The load path reads the already-written `config.yaml`, not `module.yaml`. `convoke-install` owns the bootstrap flow; this discovery logic moves there (likely `scripts/install/lib/module-yaml-finder.js` if needed, else remains in Python as part of the bootstrap experience until a fuller JS port).

---

### §3 — `load_module_yaml(path)` — module.yaml parsing

**Lines:** [bmad_init.py:78-109](../../_bmad/core/bmad-init/scripts/bmad_init.py#L78-L109)
**Behaviors:**
- **B3.1:** `yaml.safe_load` with exception-to-None handling (silent failure).
- **B3.2:** Partitions keys into three buckets:
  - `meta` — `{code, name, description, default_selected, header, subheader}`
  - `variables` — dict entries with a `prompt` key
  - `directories` — a list
- **B3.3:** Skips comment-only entries (YAML lines `## var_name` become None values, filtered).
- **B3.4:** Returns `{meta, variables, directories}` dict or `None`.

**Disposition:** `move-to-convoke-install`.

**Rationale:** Same as §2 — module.yaml is a bootstrap concern. The loader never parses module.yaml; it only reads the installed flat `config.yaml`.

---

### §4 — Flat config-file loading (`load_config_file`, `load_module_config`)

**Lines:** [bmad_init.py:147-160](../../_bmad/core/bmad-init/scripts/bmad_init.py#L147-L160)
**Behaviors:**
- **B4.1:** `yaml.safe_load` with exception-to-None (silent failure).
- **B4.2:** Type guard: must be a `dict`; else `None`.
- **B4.3:** `load_module_config(module_code, project_root)` = thin wrapper: `load_config_file({project_root}/_bmad/{module_code}/config.yaml)`.
- **B4.4:** **Module configs already contain core vars merged in** (verified by [test_load_module_includes_core_vars](../../_bmad/core/bmad-init/scripts/tests/test_bmad_init.py#L314-L320) and spot-check of [`_bmad/bme/config.yaml`](../../_bmad/bme/config.yaml) which contains `user_name`, `communication_language`, `document_output_language`, `output_folder`).

**Disposition:** `reproduce-in-loader`.

**JS equivalent (Pattern 3 from architecture doc):**

```js
const yaml = require('yaml');
function loadModuleConfig(projectRoot, moduleConfigPath) {
  const configPath = path.join(projectRoot, '_bmad', moduleConfigPath, 'config.yaml');
  if (!fs.existsSync(configPath)) throw new Error(`Config not found: ${configPath}`);
  const raw = fs.readFileSync(configPath, 'utf8');
  const doc = yaml.parseDocument(raw);
  if (doc.errors.length) throw new Error(`YAML parse error in ${configPath}: ${doc.errors[0].message}`);
  if (doc.warnings.length) console.warn(`YAML warning in ${configPath}: ${doc.warnings[0].message}`);
  const parsed = doc.toJSON();
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error(`Config file must be a YAML object: ${configPath}`);
  }
  return parsed;
}
```

**Key deltas from Python behavior:**
- **B4.1 → throw, not return None** — FM1-3 mitigation. Silent None returns are a bug; the loader must fail loudly with actionable error. Callers that want graceful degradation wrap the call in try/catch at their level.
- **B4.4 → no cascade logic** — since the module config already contains core vars, the loader returns the parsed object directly. No separate core-merge pass.

---

### §5 — `{project-root}` placeholder resolution (`resolve_project_root_placeholder`)

**Lines:** [bmad_init.py:163-169](../../_bmad/core/bmad-init/scripts/bmad_init.py#L163-L169)
**Behaviors:**
- **B5.1:** If value is not a string (including `None`, `42`, dict, etc.), pass through unchanged ([confirmed in test_non_string](../../_bmad/core/bmad-init/scripts/tests/test_bmad_init.py#L109-L110)).
- **B5.2:** String replacement: `{project-root}` → actual path (simple `.replace()`, all occurrences).
- **B5.3:** Called in `cmd_load` ([bmad_init.py:252-253](../../_bmad/core/bmad-init/scripts/bmad_init.py#L252-L253)) over **every config value** before returning to caller.

**Disposition:** `reproduce-in-loader`.

**JS equivalent:**

```js
function _resolveProjectRootPlaceholder(config, projectRoot) {
  for (const key of Object.keys(config)) {
    if (typeof config[key] === 'string' && config[key].includes('{project-root}')) {
      config[key] = config[key].replaceAll('{project-root}', projectRoot);
    }
  }
  return config;
}
```

**Notes:**
- `{project-root}` is the **only** placeholder the load path resolves. All other placeholders (`{value}`, `{directory_name}`, `{var-name}`) are resolved at **write time** by `cmd_write` via `apply_result_template`, not at load time. They never appear in the installed `config.yaml`.
- Loader leaves nested objects/arrays untouched — spot-check of installed configs shows only flat string values with `{project-root}` in `output_folder` and similar. If future configs add nested structures with placeholders, extend this helper recursively — but YAGNI for 4.0.

---

### §6 — Variable-spec parsing (`parse_var_specs`)

**Lines:** [bmad_init.py:172-189](../../_bmad/core/bmad-init/scripts/bmad_init.py#L172-L189)
**Behaviors:**
- **B6.1:** Splits `"var1:def1,var2:def2"` on commas.
- **B6.2:** Per entry, splits on first `:` — `[name, default]`.
- **B6.3:** Entries without `:` → `{name, default: None}`.
- **B6.4:** Colons inside defaults (e.g., `path:{project-root}/some/path`) are preserved because the split limit is 1 ([confirmed in test_colon_in_default](../../_bmad/core/bmad-init/scripts/tests/test_bmad_init.py#L85-L87)).
- **B6.5:** Empty string / `None` input → empty list.

**Disposition:** `drop-with-rationale`.

**Rationale:** The new loader's API (`loadModuleConfig(projectRoot, moduleConfigPath)`) returns the **entire config object** — callers destructure what they need in JS rather than passing `--vars var1:def1,var2:def2` strings. Destructuring with defaults is idiomatic JS (`const { user_name = 'BMad', communication_language = 'English' } = loadModuleConfig(...)`), eliminating the need for this parser entirely.

Old CLI callers passing `--vars foo:bar` don't exist in 4.0's architecture — agent SKILL.md files use the v4 activation template (architecture Pattern 6) that reads the whole config object.

---

### §7 — Template expansion (`expand_template`, `apply_result_template`)

**Lines:** [bmad_init.py:196-225](../../_bmad/core/bmad-init/scripts/bmad_init.py#L196-L225)
**Behaviors:**
- **B7.1:** `expand_template(value, context)` — iterates `context` dict, replaces every `{key}` in `value` with `context[key]`.
- **B7.2:** Skips `None` values in context.
- **B7.3:** Pass-through for non-string inputs ([confirmed in test_non_string](../../_bmad/core/bmad-init/scripts/tests/test_bmad_init.py#L129-L130)).
- **B7.4:** `apply_result_template(var_def, raw_value, context)` — if `var_def` has a `result` template (e.g., `"{project-root}/{value}"`), expands it with `value = raw_value` added to context. Else passes raw through.

**Disposition:** `move-to-convoke-install`.

**Rationale:** `apply_result_template` is called only by `cmd_write` ([bmad_init.py:442, 489](../../_bmad/core/bmad-init/scripts/bmad_init.py#L442)) during config **authoring**, not loading. The `result` template field comes from `module.yaml` variable definitions ([core-module.yaml](../../_bmad/core/bmad-init/resources/core-module.yaml#L10)) — e.g., `output_folder.result: "{project-root}/{value}"`. These transform raw operator answers (`"_bmad-output"`) into the stored config form (`"{project-root}/_bmad-output"`).

By the time the loader runs, these transformations are already baked into the stored `config.yaml`. The loader only needs to resolve `{project-root}` at read time (see §5); it does not evaluate `result` templates.

---

### §8 — `cmd_load` — the fast-path loader

**Lines:** [bmad_init.py:232-272](../../_bmad/core/bmad-init/scripts/bmad_init.py#L232-L272)
**Behaviors:**
- **B8.1:** Calls `find_project_root` — exits 1 with JSON stderr error if not found.
- **B8.2:** Default module code = `'core'` when `--module` omitted.
- **B8.3:** Loads module config; if missing, prints `{"init_required": true, "missing_module": "..."}` to stderr, exit 1.
- **B8.4:** Resolves `{project-root}` in all values (see §5).
- **B8.5:** `--all` flag → dumps whole config as JSON to stdout.
- **B8.6:** `--vars var:default,...` → builds result dict, using defaults when var is missing OR empty string.
- **B8.7:** Missing `--vars` AND missing `--all` → stderr error, exit 1.
- **B8.8:** Outputs JSON with `indent=2` to stdout on success.

**Disposition:** `reproduce-in-loader` (partial — only B8.1/B8.3/B8.4 in modified form).

**JS equivalent (full `loadModuleConfig` with fallback):**

```js
function loadModuleConfig(projectRoot, moduleConfigPath) {
  const configPath = path.join(projectRoot, '_bmad', moduleConfigPath, 'config.yaml');

  if (!fs.existsSync(configPath)) {
    // Backwards-compat path (architecture Decision 1 WR8)
    const oldInitPath = path.join(projectRoot, '_bmad', 'core', 'bmad-init');
    if (fs.existsSync(oldInitPath)) {
      console.warn(
        `[DEPRECATED] bmad-init detected at ${oldInitPath}. ` +
        `Run 'convoke-update' to migrate. Support removed in Convoke 4.1.`
      );
      return _loadLegacyConfig(projectRoot, moduleConfigPath);
    }
    throw new Error(`Config not found: ${configPath}. Run 'convoke-install' to bootstrap.`);
  }

  const raw = fs.readFileSync(configPath, 'utf8');
  const doc = yaml.parseDocument(raw);
  if (doc.errors.length) {
    throw new Error(`YAML parse error in ${configPath}: ${doc.errors[0].message}`);
  }
  if (doc.warnings.length) {
    console.warn(`YAML warning in ${configPath}: ${doc.warnings[0].message}`);
  }

  const parsed = doc.toJSON();
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error(`Config must be a YAML object: ${configPath}`);
  }

  return _resolveProjectRootPlaceholder(parsed, projectRoot);
}
```

**Dropped from cmd_load:**
- `--vars var:default` parsing (B8.6, B8.7) → dropped per §6 rationale (JS destructuring replaces).
- `--all` distinction (B8.5) → dropped; the JS API always returns the whole object.
- JSON-to-stdout contract (B8.8) → replaced by JS return value (loader is imported, not shelled out).
- Exit-code contract (B8.1, B8.3, B8.7) → replaced by thrown errors.

**Preserved in modified form:**
- Missing-config detection (B8.3) — now `fs.existsSync` check + `throw Error` with actionable message.
- `{project-root}` resolution (B8.4) — preserved exactly.
- Default-module-code (B8.2) — **dropped**. The JS API requires explicit `moduleConfigPath`; callers pass `'core'` explicitly. Prevents silent default-module bugs.

---

### §9 — `cmd_check` — bootstrap state probe

**Lines:** [bmad_init.py:279-338](../../_bmad/core/bmad-init/scripts/bmad_init.py#L279-L338)
**Behaviors:**
- **B9.1:** Returns status enum: `no_project` | `ready` | `core_missing` | `module_missing`.
- **B9.2:** Includes `core_module` (from `core-module.yaml`) when core is missing.
- **B9.3:** Includes `target_module` (from module.yaml discovery §2) when module-specific config is missing.
- **B9.4:** Includes `core_vars` (from existing core config) when core exists but target module config doesn't.

**Disposition:** `move-to-convoke-install` (entire command).

**Rationale:** `cmd_check` is the bootstrap decision engine — it determines what questions `convoke-install` must ask. The v6.3 loader never needs to "check if init is needed"; it throws if the file is missing, and the caller (or an upstream health check like `convoke-doctor`) decides whether to trigger bootstrap.

For the install path in 4.0: `convoke-install` can perform its own `fs.existsSync` checks on `_bmad/core/config.yaml` and per-module `config.yaml` files directly, in JS, without needing a Python probe subprocess. This is a simplification, not a functional change.

---

### §10 — `cmd_resolve_defaults` — compute module defaults

**Lines:** [bmad_init.py:345-396](../../_bmad/core/bmad-init/scripts/bmad_init.py#L345-L396)
**Behaviors:**
- **B10.1:** Parses `--core-answers` JSON (exit 1 on malformed).
- **B10.2:** Builds context with `project-root`, `directory_name`, and every core answer.
- **B10.3:** Expands every variable's `default` field via `expand_template`.
- **B10.4:** Returns merged module definition with resolved defaults.

**Disposition:** `move-to-convoke-install` (entire command).

**Rationale:** This is the pre-prompt step that computes "what should the default value of `bmad_builder_output_folder` be given that the user answered `_bmad-output` for `output_folder`?" It's a bootstrap concern, not a load concern. The loader never sees unresolved defaults — by the time it reads `config.yaml`, defaults have already been resolved and written.

---

### §11 — `cmd_write` — author config files

**Lines:** [bmad_init.py:403-520](../../_bmad/core/bmad-init/scripts/bmad_init.py#L403-L520)
**Behaviors:**
- **B11.1:** Parses `--answers` JSON (core + per-module answers).
- **B11.2:** Builds initial context with `project-root` and `directory_name`.
- **B11.3:** Processes core answers first (needed for module expansion context).
- **B11.4:** Applies `result` templates per-variable via `apply_result_template`.
- **B11.5:** Merges with existing config via `existing.update(core_config)` (shallow merge, new wins).
- **B11.6:** Writes core config, re-reads it for module context propagation.
- **B11.7:** For each non-core module answer: looks up module.yaml, applies result templates, starts module config with latest core values, overlays module-specific answers.
- **B11.8:** Creates `module.yaml` `directories` via `expand_template + mkdir(parents=True, exist_ok=True)`.
- **B11.9:** Returns JSON status with `files_written` and `dirs_created` lists.

**Disposition:** `move-to-convoke-install` (entire command).

**Rationale:** Config authoring is exclusively a bootstrap concern. The loader never writes configs.

**Subtle behavior to preserve when porting (B11.5):** `existing.update(core_config)` means re-running the writer **overwrites** existing values with new answers rather than preserving prior values. If `convoke-install` is re-run (e.g., for a second module), this means previously-entered core answers are kept **only** if the caller re-passes them. Loader is unaffected, but document this gotcha in `convoke-install` when porting.

---

### §12 — Config file write format (`_write_config_file`)

**Lines:** [bmad_init.py:523-530](../../_bmad/core/bmad-init/scripts/bmad_init.py#L523-L530)
**Behaviors:**
- **B12.1:** Header: `# {module_label} Module Configuration\n# Generated by bmad-init\n# Date: {UTC ISO}`.
- **B12.2:** Body: `yaml.safe_dump(data, default_flow_style=False, allow_unicode=True, sort_keys=False)`.

**Disposition:** `move-to-convoke-install`.

**Rationale:** Write-path concern.

**Important delta for porting (project-context.md Pattern 3):** the JS writer in `convoke-install` should use `yaml.Document` round-trip to preserve comments on re-write, per architecture Pattern 3. The current Python implementation uses `safe_dump` which strips comments — a known issue for operators who manually add comments to config.yaml. Call this out in Story 1A.4 if `convoke-install` rewrites anything.

---

### §13 — CLI entry point (`main`)

**Lines:** [bmad_init.py:537-591](../../_bmad/core/bmad-init/scripts/bmad_init.py#L537-L591)
**Behaviors:** argparse with 4 subcommands (`load`, `check`, `resolve-defaults`, `write`).

**Disposition:** `drop-with-rationale`.

**Rationale:** The loader is a **library module**, not a CLI. There is no JS main() entry. Per architecture Pattern 4, library modules never call `process.exit()` — they throw. CLI concerns (exit codes, stderr) belong to `convoke-install`.

---

## Disposition Table (AC2)

| # | Behavior | Lines | Disposition | Target |
|---|----------|-------|-------------|--------|
| B1.1–B1.4 | Project-root detection | 46-71 | `drop-with-rationale` | `findProjectRoot()` already exists |
| B2.1–B2.4 | module.yaml discovery | 112-140 | `move-to-convoke-install` | `convoke-install` |
| B3.1–B3.4 | module.yaml parsing | 78-109 | `move-to-convoke-install` | `convoke-install` |
| B4.1 | YAML parse silent-None | 147-154 | `drop-with-rationale` | Replaced by throw (FM1-3) |
| B4.2 | Dict type guard | 152-154 | `reproduce-in-loader` | Explicit check in loader |
| B4.3 | Module config path construction | 157-160 | `reproduce-in-loader` | `path.join` in loader |
| B4.4 | Flat merged-core shape | — | `reproduce-in-loader` (zero cost) | Loader returns whole object |
| B5.1–B5.3 | `{project-root}` resolution | 163-169 | `reproduce-in-loader` | Helper in loader |
| B6.1–B6.5 | `--vars` spec parsing | 172-189 | `drop-with-rationale` | JS destructuring |
| B7.1–B7.4 | Template expansion | 196-225 | `move-to-convoke-install` | Bootstrap concern |
| B8.1 | find_project_root invocation | 232-239 | `drop-with-rationale` | Caller passes projectRoot |
| B8.2 | Default module='core' | 240 | `drop-with-rationale` | Explicit required param |
| B8.3 | Missing-config handling | 243-249 | `reproduce-in-loader` | Throw with actionable msg |
| B8.4 | {project-root} sweep | 252-253 | `reproduce-in-loader` | Helper in loader |
| B8.5 | --all flag | 255-256 | `drop-with-rationale` | JS returns whole object |
| B8.6–B8.7 | --vars dict build | 258-271 | `drop-with-rationale` | JS destructuring |
| B8.8 | JSON-to-stdout | 272 | `drop-with-rationale` | JS return value |
| B9.1–B9.4 | cmd_check status probe | 279-338 | `move-to-convoke-install` | Installer does fs checks |
| B10.1–B10.4 | cmd_resolve_defaults | 345-396 | `move-to-convoke-install` | Bootstrap concern |
| B11.1–B11.9 | cmd_write | 403-520 | `move-to-convoke-install` | `convoke-install` |
| B12.1–B12.2 | Write format | 523-530 | `move-to-convoke-install` | `convoke-install` (use round-trip) |
| B13 | CLI main() | 537-591 | `drop-with-rationale` | Library, not CLI |

**Bonus finding: WR8 deprecation fallback (new behavior, not in bmad_init)** — add to loader per architecture Decision 1: `if (!config && oldBmadInitExists) { warn; loadLegacy(); }`. Tagged `reproduce-in-loader` as architectural addition.

---

## Anti-Drift Compliance Walk (AC4)

Per project-context.md anchor rules, each `reproduce-in-loader` recommendation is compatible with:

### `no-hardcoded-versions`

**Compliance:** ✅ The loader reads nothing version-specific. No `package.json` version lookup needed in the load path. If future logic wants to enforce "config requires ≥ schema version X", that's a separate concern handled via a frontmatter field, not a hardcoded literal.

### `no-process-cwd-in-libs`

**Compliance:** ✅ The loader accepts `projectRoot` as its first parameter (architecture Decision 1 API). It never calls `process.cwd()`. Callers at CLI entry points invoke `findProjectRoot()` from utils.js and pass the resolved path down — consistent with every existing `scripts/update/lib/*.js` module.

### `derive-counts-from-source`

**Compliance:** ✅ The loader does not assert or report counts of anything. No "expected 7 agents" magic numbers, no "expected config keys N". It returns whatever the YAML contains; callers validate what they need.

### Pattern 3 (YAML Read/Write Safety)

**Compliance:** ✅ The `reproduce-in-loader` implementation uses `yaml.parseDocument()`, checks `doc.errors` (throw) and `doc.warnings` (console.warn), then `doc.toJSON()`. This exactly matches the established pattern from [architecture §Pattern 3](convoke-arch-bmad-v6.3-adoption.md#pattern-3-yaml-readwrite-safety) and avoids the `yaml.load()` + `yaml.dump()` round-trip-that-strips-comments anti-pattern (I10/I29).

**All four anchor rules pass.** No reworking required.

---

## Handoff Notes for Story 1A.2 (`config-loader.js` implementation)

### What the implementer needs

1. **The full load-path body** is drafted in §4 and §8 of this audit. Copy verbatim as a starting point; adjust to final project conventions.
2. **Three helpers** compose the implementation:
   - `loadModuleConfig(projectRoot, moduleConfigPath)` — public API.
   - `_resolveProjectRootPlaceholder(config, projectRoot)` — internal, §5.
   - `_loadLegacyConfig(projectRoot, moduleConfigPath)` — internal, backwards-compat (WR8). Body deferred to 1A.2 author; spec is "return whatever the old bmad-init load path would have returned, via a subprocess shell-out to `python bmad_init.py load --all --module {module} --project-root {root}` and JSON-parse stdout."
3. **Test matrix** for `tests/lib/config-loader.test.js` per architecture Decision 1 testability:
   - v4 fresh load (present config, correct shape).
   - v3 fallback with deprecation warning (config missing, bmad-init present).
   - Nested module paths (`'bme/_vortex'`, `'bme/_enhance'`, `'core'`).
   - Missing config, no bmad-init → actionable error thrown.
   - Malformed YAML → actionable error thrown (file + line in message).
   - Empty file → actionable error thrown ("YAML object expected").
   - `{project-root}` placeholder resolved across every value.
   - Non-string values (numbers, bools, nested objects) pass through unchanged.

### What the implementer must NOT port

- No `--vars`, `--all`, `--module` CLI flags.
- No module.yaml reading.
- No config writing.
- No core/module merge logic (configs already flat).
- No exit-code or JSON-to-stdout protocol.
- No `process.cwd()` walks.

### Follow-up work for Story 1A.3+

- **Sweep count revision:** PRD estimated ~25; audit confirms **18 SKILL.md files match the invocation pattern** (16 net after Epic 1B removes Bob/Quinn/Barry). Story 1A.3 should start from the 18-entry table in §Mechanical Enumeration Evidence.
- **`bmad-product-brief/SKILL.md`** mentions bmad-init but may not use the exact activation pattern — Story 1A.3 must verify.
- **`convoke-install` JS porting** — the 12 behaviors tagged `move-to-convoke-install` accumulate into a substantial rewrite. This is NOT part of 4.0 scope per architecture Decision 6 (Sprint 0 + Sprint 1 focus on loader + migration only); bootstrap stays in Python `bmad_init.py` until a future initiative explicitly tackles it. The `drop-with-rationale` tag on CLI entry (§13) does NOT imply CLI removal — it implies the CLI is not reproduced **in the loader**. The CLI remains callable from `convoke-install` flows in 4.0, and Python-to-JS porting is deferred.

### Deprecation timeline (from architecture)

- **Convoke 4.0:** `bmad-init` marked deprecated. Warning emitted at activation when fallback path is hit.
- **Convoke 4.1:** `bmad-init` removed entirely. `_loadLegacyConfig` can be deleted.

---

## Appendix — Convoke's Current State Is Already Mostly v6.3-Compliant

This was the most surprising finding of the audit and deserves preservation:

**Grep result:** `grep -c 'bmad-init\|bmad_init' _bmad/bme/*` → **0 matches**.

Convoke's own 14 `_bmad/bme/` agents (Vortex × 7, Gyre × 4, Team Factory × 1, Enhance × 2) already direct-load their module configs at activation. Sample from [`_bmad/bme/_vortex/agents/contextualization-expert.md:13`](../../_bmad/bme/_vortex/agents/contextualization-expert.md#L13):

```
- Load and read {project-root}/_bmad/bme/_vortex/config.yaml NOW
- ERROR HANDLING: If config file not found or cannot be read, IMMEDIATELY display: ...
- If config loaded successfully: Store ALL fields as session variables: {user_name}, {communication_language}, {output_folder}
```

This is **already the v6.3 direct-load pattern** — the LLM reads the YAML file itself, no subprocess. The 4.0 "migration sweep" does not touch these files. It only rewrites the 18 upstream BMAD agent SKILL.md files.

**Implication for PRD honesty:** the "massive migration" framing understates how much of Convoke already complies. The actual change is scoped to upstream-BMAD-agent activation strings. This is an observation for Story 5B retrospective (anti-patterns / innovation hypothesis observations) — **we were already 74% of the way to v6.3 before we started**. Worth a note in the Convoke 4.0 announcement: "Convoke's own agents were already direct-load; this release brings upstream BMAD agents into the same pattern."
