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

`bmad_init.py` is a **591-line multi-command script** that conflates two concerns v6.3 separates: **loading** already-written configs and **bootstrapping** missing configs. By line-range counting (load-path: `cmd_load` 232–272 + helpers 147–169 = ~65 LOC; bootstrap-path: `cmd_check` 279–338 + `cmd_resolve_defaults` 345–396 + `cmd_write` 403–520 + `_write_config_file` 523–530 = ~175 LOC), roughly **27% load / 73% bootstrap** — the rest is infrastructure (imports, CLI plumbing, project-root detection). The replacement `config-loader.js` owns only the load path. Most bmad_init behaviors drop from the loader with rationale or move to `convoke-install`.

**Key reframe from mechanical enumeration:** the "v6.3 migration sweep" surface is **18 upstream BMAD `SKILL.md` files** matching the `"Load config via bmad-init skill"` pattern (not ~25 as the PRD estimated). Convoke's own **12 bme agents** — Vortex × 7 + Gyre × 4 + Team Factory × 1 — **already direct-load** their module `config.yaml` at activation and contain zero references to `bmad-init`. They are v6.3-compliant today. Sweep count is **18 current** (pending Epic 1B removal of Bob/Quinn/Barry, which would bring the net to 15).

**Disposition summary — counted directly from the Disposition Table below:** the 13 numbered behavior groups (§1–§13) decompose into **56 B-sub-behaviors** (B1.1–B13). After tagging each sub-behavior, the canonical aggregate is **9 `reproduce-in-loader` / 16 `drop-with-rationale` / 31 `move-to-convoke-install`** (2 of the 9 reproduce-in-loader behaviors are *modified* from Python semantics — B4.1 silent-None→throw and B8.3 missing-config→throw). Plus one architectural addition (WR8 deprecation fallback, tagged `add-in-loader` and not counted in the 56 since it's new, not ported). §14 provides a **cross-cutting view** of error-handling behaviors E14.1–E14.6; each E-entry explicitly cross-references one or more already-counted B-entries (e.g., E14.1 ≡ B3.1 + B4.1) and does NOT add to the tally.

The loader body is projected at **~40 LOC** versus bmad_init's 591 — a ~15× reduction tracking the v6.3 "content, not software" insight. (Story spec's "Reference implementation hints" §Dev Notes estimated ~50 LOC; revised down to ~40 after seeing how little load-path code survives from bmad_init.)

---

## Mechanical Enumeration Evidence (AC3)

Per project-context.md `mechanical-research-enumeration` rule, all enumeration derives from grep/glob/wc/find output, not eyeballing. The four commands the story AC3 names are run verbatim below:

```text
$ wc -l _bmad/core/bmad-init/scripts/bmad_init.py
     591 _bmad/core/bmad-init/scripts/bmad_init.py

$ grep -n '^def \|^    def ' _bmad/core/bmad-init/scripts/bmad_init.py
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
# 16 top-level functions + 1 nested helper prefixed `_write_config_file`.
# The `^    def` alternative in the pattern caught no nested methods — bmad_init.py
# has no classes, so no nested `def` inside class bodies.

$ find _bmad -name config.yaml -type f | sort
_bmad/_memory/config.yaml
_bmad/bmb/config.yaml
_bmad/bme/_artifacts/config.yaml
_bmad/bme/_enhance/config.yaml
_bmad/bme/_gyre/config.yaml
_bmad/bme/_team-factory/config.yaml
_bmad/bme/_vortex/config.yaml
_bmad/bme/config.yaml
_bmad/bmm/config.yaml
_bmad/cis/config.yaml
_bmad/core/config.yaml
_bmad/tea/config.yaml
_bmad/wds/config.yaml
# 13 config.yaml files total (supersedes earlier shallow `ls _bmad/*/config.yaml` count of 8;
# the shallow glob missed 5 nested Convoke-bme submodule configs: _artifacts, _enhance,
# _gyre, _team-factory, _vortex). All files are flat YAML with core vars merged in;
# `_bmad/_memory/config.yaml` is an internal-scope dir (leading underscore) but structurally
# identical and readable by the loader if a caller asks for it.

$ grep -l 'Load config via bmad-init' _bmad/**/*.md | wc -l
18
# Sweep surface: 18 SKILL.md files matching the exact activation pattern, all in
# upstream BMAD namespace (bmm, cis, wds, tea). Separately, one additional file
# (_bmad/bmm/1-analysis/bmad-product-brief/SKILL.md) mentions bmad-init but does
# NOT match the "Load config via bmad-init skill" activation pattern — tracked as
# a candidate for Story 1A.3 precise-pattern re-audit, not counted in the 18.

$ grep -rn 'bmad-init\|bmad_init' _bmad/bme/
# (zero hits — Convoke's bme namespace has no bmad-init references; all bme agents
# already direct-load their module config.yaml at activation)

$ find _bmad/bme -path '*/agents/*.md' -type f | sort
_bmad/bme/_gyre/agents/model-curator.md
_bmad/bme/_gyre/agents/readiness-analyst.md
_bmad/bme/_gyre/agents/review-coach.md
_bmad/bme/_gyre/agents/stack-detective.md
_bmad/bme/_team-factory/agents/team-factory.md
_bmad/bme/_vortex/agents/contextualization-expert.md
_bmad/bme/_vortex/agents/discovery-empathy-expert.md
_bmad/bme/_vortex/agents/hypothesis-engineer.md
_bmad/bme/_vortex/agents/lean-experiments-specialist.md
_bmad/bme/_vortex/agents/learning-decision-expert.md
_bmad/bme/_vortex/agents/production-intelligence-specialist.md
_bmad/bme/_vortex/agents/research-convergence-specialist.md
# 12 Convoke-owned bme agents — Vortex × 7, Gyre × 4, Team Factory × 1.
# Note: `_enhance` module exists but has no agents/ subdirectory (skills/workflows only);
# an earlier draft of this audit over-counted 14 by assuming "Enhance × 2."

$ grep -rn '\{[a-z][a-z_-]*\}' _bmad/**/config.yaml
# Placeholders found in installed configs:
# - {project-root} — in 13/13 files (output paths)
# - {user} — in 3 files (_bmad/bme/_vortex, _bmad/bme/_team-factory, _bmad/bme/_gyre),
#   stored as `user_name: "{user}"` — appears to be a Convoke-bme convention for
#   cross-module user_name indirection. Story 1A.2 must verify the loader's handling.
# No other placeholder patterns detected.

$ grep -rn -- '--vars\|--all\|bmad_init\.py load --module\|bmad-init.*load --module' _bmad/ --include='*.md'
_bmad/core/bmad-init/SKILL.md:4:argument-hint: "[--module=module_code] [--vars=var1:default1,var2] ..."
_bmad/core/bmad-init/SKILL.md:23:- To load all vars, include `--all`
_bmad/core/bmad-init/SKILL.md:24:- To request specific variables with defaults, use `--vars var1:default1,var2`
# Only the bmad-init SKILL.md itself documents `--vars`/`--all` flags. No external
# callers in the 18 sweep-target SKILL.md files use them. Confirms the loader can
# safely drop parse_var_specs + --all flag without breaking any consumer.

$ grep -rn 'bmad_init\.py check\|bmad-init check' . --include='*.md' --include='*.py'
_bmad/core/bmad-init/scripts/bmad_init.py:25:  python bmad_init.py check --project-root /path
_bmad/core/bmad-init/scripts/bmad_init.py:26:  python bmad_init.py check --module bmb --skill-path /path/to/skill --project-root /path
# Only the bmad_init.py docstring references `check`. No skill or script invokes
# `cmd_check` externally. Moving check semantics into convoke-install is safe.
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

Total: **19 rows** — split into **18 canonical sweep targets** (matching the `"Load config via bmad-init skill"` pattern exactly) + **1 separately-tracked candidate** (`bmad-product-brief`, which mentions `bmad-init` but does NOT match the canonical activation pattern). Story 1A.3 starts from the canonical 18 and verifies the candidate separately via a more precise pattern (`grep -l '^1\. \*\*Load config via bmad-init'`). **Do NOT pre-subtract Epic 1B removals** (Quinn, Bob, Barry) — Epic 1B may slip; 1A.3 inventory ships with the 18 current and Story 1A.4 reconciles post-Epic-1B.

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

**Disposition:** `reproduce-in-loader` (B4.1 behavior is *modified* — see key deltas below; tagged `reproduce-in-loader` with an explicit "modified to throw" callout in the Disposition Table).

**JS equivalent (Pattern 3 from architecture doc):**

```js
const yaml = require('yaml');
/**
 * Load and parse a module's flat config.yaml.
 * @param {string} projectRoot - Absolute path to the Convoke project root.
 * @param {string} moduleConfigPath - Module subdirectory under `_bmad/` (e.g.,
 *   `'bme/_vortex'`, `'bme/_enhance'`, `'core'`). Despite the parameter name
 *   retained from architecture Decision 1, this is a directory path, not a
 *   path to the config.yaml file itself. Kept as-named to match the arch doc
 *   API contract; rename deferred to a future arch-doc revision.
 * @returns {object} Plain JS object with keys from the YAML config.
 * @throws {Error} If config file is missing, malformed, or not a YAML object.
 */
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
- **B4.1 → throw, not return None** — FM1-3 mitigation. Silent None returns are a bug; the loader must fail loudly with actionable error. Callers that want graceful degradation wrap the call in try/catch at their level. *This is a semantic change, not a pure reproduction — the Disposition Table below reflects this as `reproduce-in-loader (modified)`.*
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
- `{project-root}` is the **primary** placeholder the load path resolves in current installed configs. The write-time placeholders (`{value}`, `{directory_name}`) from `apply_result_template` are resolved at `cmd_write` time and never appear in the installed `config.yaml`.
- **However, mechanical enumeration (§Mechanical Enumeration Evidence) surfaced `{user}` as an un-resolved placeholder in 3 Convoke-bme configs** (`_bmad/bme/_vortex/config.yaml:40`, `_bmad/bme/_team-factory/config.yaml:10`, `_bmad/bme/_gyre/config.yaml:22`, each stored as `user_name: "{user}"`). This appears to be a Convoke-bme convention for cross-module `user_name` indirection (child module reads `user_name` from `_bmad/core/config.yaml`), and the current Python `cmd_load` does NOT resolve it — callers (LLM agents reading the config) handle it themselves. **Audit decision:** the loader preserves current Python behavior and leaves `{user}` unresolved at load time. Rationale: backwards compatibility (no existing caller expects loader-side `{user}` resolution); the `_resolveProjectRootPlaceholder` helper is project-root-specific by design; any `{user}` resolution is a Convoke-bme activation convention and belongs to the agent, not the loader. Story 1A.2 should document this convention in the loader's JSDoc as a non-goal. (Scope note: this audit enumerates `{user}` occurrences in installed `config.yaml` files only; occurrences in JS writers, workflow step templates, or other bmad-bme source files are out of scope for the loader's read-path concerns.)
- Loader iterates top-level keys only. Spot-check of all 13 installed configs shows only flat string values contain `{project-root}`. If future configs add nested structures with placeholders, extend this helper recursively — but out-of-scope for 4.0. An explicit assertion that rejects unexpected nested placeholder strings would be a defensive hardening (optional, Story 1A.2 design choice).

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

**Rationale:** The split here follows architecture Pattern 4 ("library modules return result objects; CLI modules format them"): `loadModuleConfig` is a library function that returns the whole parsed config object. JS consumers of the loader (migration-runner, validator, convoke-doctor, and install-time wiring) destructure what they need — `const { user_name = 'BMad', communication_language = 'English' } = loadModuleConfig(projectRoot, 'bme/_vortex');` — without needing a `--vars var1:def1,var2:def2` parser.

Mechanical verification (§Mechanical Enumeration Evidence) confirms the `--vars` and `--all` flags are documented only in `_bmad/core/bmad-init/SKILL.md` itself — no external skill or script invokes `bmad_init.py load` with `--vars` or `--all`. Dropping the parser is safe; no caller breaks.

(Separately, agent SKILL.md files use v4 activation templates — architecture Pattern 6 — that instruct the *LLM* to read the YAML file directly. That's a parallel pattern, not a direct consumer of `loadModuleConfig`; both patterns return the whole config object, so they're compatible.)

---

### §7 — Template expansion (`expand_template`, `apply_result_template`)

**Lines:** [bmad_init.py:196-225](../../_bmad/core/bmad-init/scripts/bmad_init.py#L196-L225)
**Behaviors:**
- **B7.1:** `expand_template(value, context)` — iterates `context` dict, replaces every `{key}` in `value` with `context[key]`.
- **B7.2:** Skips `None` values in context.
- **B7.3:** Pass-through for non-string inputs ([confirmed in test_non_string](../../_bmad/core/bmad-init/scripts/tests/test_bmad_init.py#L129-L130)).
- **B7.4:** `apply_result_template(var_def, raw_value, context)` — if `var_def` has a `result` template (e.g., `"{project-root}/{value}"`), expands it with `value = raw_value` added to context. Else passes raw through.

**Disposition:** `move-to-convoke-install`.

**Rationale:** `apply_result_template` is called only by `cmd_write` ([bmad_init.py:442, 489](../../_bmad/core/bmad-init/scripts/bmad_init.py#L442)) during config **authoring**, not loading. The `result` template field comes from `module.yaml` variable definitions ([core-module.yaml line 25](../../_bmad/core/bmad-init/resources/core-module.yaml#L25)) — e.g., `output_folder.result: "{project-root}/{value}"`. These transform raw operator answers (`"_bmad-output"`) into the stored config form (`"{project-root}/_bmad-output"`).

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

### ⚠️ Design deltas from bmad_init (explicit for Story 1A.2 implementer)

These are behaviors that the drafted loader **intentionally departs from** `bmad_init.py`. Split into two categories:

**Design decisions requiring review** — real choices the implementer should consciously confirm (or challenge) before coding:

1. **B4.1 silent-None → throw actionable error.** Python returns `None` on YAML parse exception (line 148-154 of bmad_init.py). Loader must throw with file path + line number in the message. Rationale: FM1-3 mitigation; loud failure over silent degradation. *If Story 1A.2 discovers a caller that genuinely needs silent-None fallback, escalate — a wrapper function may be needed.*
2. **B8.2 default module='core' → explicit required parameter.** Python `cmd_load` defaults to `module='core'` when `--module` omitted (line 240). Loader requires explicit `moduleConfigPath` with no default. Rationale: prevents silent bugs where caller forgets to specify the module and gets core config instead. *If a real use case needs the default, escalate before coding — this was decided unilaterally in this audit.*
3. **B1 project-root detection → caller's responsibility.** Python walks filesystem looking for `_bmad/`; loader accepts `projectRoot` as required parameter. Rationale: `no-process-cwd-in-libs` rule + existing `findProjectRoot()` utility in `scripts/update/lib/utils.js`. *This is firm; deviating would violate a project-context.md rule.*

**Language-port mechanics** — automatic consequences of moving from Python CLI to JS library under Pattern 4. Not negotiable; noted for completeness:

4. **Output protocol: JSON-to-stdout → JS return value.** Imported library, not subprocess. Pattern 4 mandate.
5. **Error signaling: exit-code → thrown errors.** Pattern 4 forbids `process.exit()` in library modules.
6. **Flag distinction B8.5 `--all` vs `--vars` → always return whole object.** Pattern 4 — library returns data, caller picks fields.

All six deltas are defended in the Anti-Drift Compliance Walk. Items 1–3 are decision points; 4–6 are mechanics — if Story 1A.2 finds either category conflicts with a real constraint, propose a spec amendment before writing code.

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

**Rationale:** The loader is a **library module**, not a CLI. There is no JS main() entry. Per architecture Pattern 4, library modules never call `process.exit()` — they throw. CLI concerns (exit codes, stderr) belong to `convoke-install`. Note: the `drop-with-rationale` tag on CLI entry means it's not reproduced *in the loader* — the existing Python CLI remains callable during 4.0 (bootstrap still runs Python per architecture Decision 6 scope); it's dropped from the *loader's* scope, not from the codebase.

---

### §14 — Error-handling patterns (consolidated cross-function view)

Per AC1 category 12, this section consolidates error-handling behavior scattered across earlier sections into a unified cross-function view.

**Behaviors observed:**
- **E14.1 — Silent `None` on YAML parse exception** ([bmad_init.py:149-154](../../_bmad/core/bmad-init/scripts/bmad_init.py#L149-L154)). `load_config_file` and `load_module_yaml` wrap `yaml.safe_load` in bare `try/except Exception:` returning `None`. No log, no stderr message, no propagation. (Also B3.1, B4.1.)
- **E14.2 — JSON-to-stderr error + exit 1 for CLI errors.** `cmd_load`, `cmd_check`, `cmd_resolve_defaults`, `cmd_write` each emit `print(json.dumps({'error': ...}), file=sys.stderr); sys.exit(1)` for their failure paths ([bmad_init.py:236-238](../../_bmad/core/bmad-init/scripts/bmad_init.py#L236-L238), [246-249](../../_bmad/core/bmad-init/scripts/bmad_init.py#L246-L249), [259-261](../../_bmad/core/bmad-init/scripts/bmad_init.py#L259-L261), [348-356](../../_bmad/core/bmad-init/scripts/bmad_init.py#L348-L356), [405-412](../../_bmad/core/bmad-init/scripts/bmad_init.py#L405-L412), [417-421](../../_bmad/core/bmad-init/scripts/bmad_init.py#L417-L421)). Structured JSON error shape: `{"error": "..."}` or `{"init_required": true, "missing_module": "..."}`.
- **E14.3 — `argparse` SystemExit on missing/invalid CLI args.** `main()` prints help + `sys.exit(1)` when `args.command is None` or handler dispatch fails ([bmad_init.py:572-587](../../_bmad/core/bmad-init/scripts/bmad_init.py#L572-L587)).
- **E14.4 — No exception handler around `yaml.safe_dump`.** `_write_config_file` writes the config with no try/except ([bmad_init.py:523-530](../../_bmad/core/bmad-init/scripts/bmad_init.py#L523-L530)) — a disk-full or permission-denied error would propagate as an unhandled Python exception, visible to CLI but not formatted as JSON.
- **E14.5 — `find_project_root` returns `None` (not exception) for unresolvable project.** Callers check for `None` and emit their own JSON error. Distributed error handling, not centralized.
- **E14.6 — Template expansion silently skips `None` values in context** ([bmad_init.py:206-207](../../_bmad/core/bmad-init/scripts/bmad_init.py#L206-L207)). `apply_result_template`/`expand_template` skip keys whose values are `None`. A bootstrapping bug where a core answer is `None` (instead of absent) produces a still-expanded partial string, not an error — surprising for the operator.

**Disposition (all error-handling behaviors):** mixed — see per-row table below.

| Behavior | Disposition | Rationale |
|----------|-------------|-----------|
| E14.1 Silent None | `drop-with-rationale` (FM1-3) | Loader throws actionable errors instead. |
| E14.2 JSON-to-stderr + exit | `drop-with-rationale` | Loader is library; callers format output. |
| E14.3 argparse SystemExit | `drop-with-rationale` | No CLI in loader. |
| E14.4 No write exception handler | `move-to-convoke-install` | Write path belongs to installer; installer should add Pattern 4 error handling. |
| E14.5 None-as-fail-signal from project-root | `drop-with-rationale` | Caller uses `findProjectRoot()` (utils.js); its contract is `throw` on failure, not `null` return. |
| E14.6 Silent None skip in templates | `move-to-convoke-install` | Templates resolve at write time; installer decides whether partial-template should warn. |

**No error-handling behaviors are `reproduce-in-loader`** — the loader replaces all of them with Pattern 4 `throw` semantics and actionable error messages.

---

## Disposition Table (AC2)

Behavior groups B1–B13 decompose into 56 sub-behaviors (B1.1 through B13, inclusive). The table below tags by sub-behavior group (collapsed where all sub-behaviors in a group share a disposition); expanded when a group has mixed dispositions (B4, B8).

| # | Behavior | Lines | Disposition | Target |
|---|----------|-------|-------------|--------|
| B1.1–B1.4 (4) | Project-root detection | 46-71 | `drop-with-rationale` | `findProjectRoot()` in `scripts/update/lib/utils.js` already exists |
| B2.1–B2.4 (4) | module.yaml discovery | 112-140 | `move-to-convoke-install` | `convoke-install` |
| B3.1–B3.4 (4) | module.yaml parsing | 78-109 | `move-to-convoke-install` | `convoke-install` |
| B4.1 (1) | YAML parse silent-None | 147-154 | `reproduce-in-loader` (modified) | Loader throws actionable error instead; see §4 and §Design deltas |
| B4.2 (1) | Dict type guard | 152-154 | `reproduce-in-loader` | Explicit `typeof !== 'object'` check |
| B4.3 (1) | Module config path construction | 157-160 | `reproduce-in-loader` | `path.join(projectRoot, '_bmad', moduleConfigPath, 'config.yaml')` |
| B4.4 (1) | Flat merged-core shape | — | `reproduce-in-loader` (zero cost) | Loader returns whole object |
| B5.1–B5.3 (3) | `{project-root}` resolution | 163-169 | `reproduce-in-loader` | `_resolveProjectRootPlaceholder` helper |
| B6.1–B6.5 (5) | `--vars` spec parsing | 172-189 | `drop-with-rationale` | JS destructuring (Pattern 4) |
| B7.1–B7.4 (4) | Template expansion | 196-225 | `move-to-convoke-install` | Bootstrap concern |
| B8.1 (1) | find_project_root invocation | 232-239 | `drop-with-rationale` | Caller passes `projectRoot` |
| B8.2 (1) | Default module='core' | 240 | `drop-with-rationale` (design delta — see §8) | Explicit required param prevents silent default-module bugs |
| B8.3 (1) | Missing-config handling | 243-249 | `reproduce-in-loader` (modified) | Throw with actionable `"Run 'convoke-install' to bootstrap"` message |
| B8.4 (1) | `{project-root}` sweep | 252-253 | `reproduce-in-loader` | Helper in loader |
| B8.5 (1) | --all flag | 255-256 | `drop-with-rationale` | JS returns whole object |
| B8.6–B8.7 (2) | --vars dict build | 258-271 | `drop-with-rationale` | JS destructuring |
| B8.8 (1) | JSON-to-stdout | 272 | `drop-with-rationale` | JS return value |
| B9.1–B9.4 (4) | cmd_check status probe | 279-338 | `move-to-convoke-install` | Installer does `fs.existsSync` checks |
| B10.1–B10.4 (4) | cmd_resolve_defaults | 345-396 | `move-to-convoke-install` | Bootstrap concern |
| B11.1–B11.9 (9) | cmd_write | 403-520 | `move-to-convoke-install` | `convoke-install` |
| B12.1–B12.2 (2) | Write format | 523-530 | `move-to-convoke-install` | `convoke-install` (use round-trip to preserve operator comments) |
| B13 (1) | CLI main() | 537-591 | `drop-with-rationale` | Library, not CLI |
| E14.1–E14.6 | Error-handling patterns (cross-cutting view) | see §14 | cross-references to B-rows; not counted | §14 is a view across B-row behaviors, not new sub-behaviors |

**Sub-behavior tally (canonical):** rows B1–B13 by count = 4+4+4+4+3+5+4+8+4+4+9+2+1 = **56 B-sub-behaviors**. §14's E14.1–E14.6 are a **cross-cutting view** — each E-entry cross-references already-counted B-entries (see §14 E-row prose where it says "Also B3.1, B4.1", etc.). E-entries do NOT add to the total or the per-disposition counts.

**Disposition counts (canonical, row-by-row — B-rows only):**

- `reproduce-in-loader`: B4.1 (modified), B4.2, B4.3, B4.4, B5.1, B5.2, B5.3, B8.3 (modified), B8.4 = **9 sub-behaviors** (2 of which are modified from Python semantics)
- `drop-with-rationale`: B1.1, B1.2, B1.3, B1.4, B6.1, B6.2, B6.3, B6.4, B6.5, B8.1, B8.2, B8.5, B8.6, B8.7, B8.8, B13 = **16 sub-behaviors**
- `move-to-convoke-install`: B2.1, B2.2, B2.3, B2.4, B3.1, B3.2, B3.3, B3.4, B7.1, B7.2, B7.3, B7.4, B9.1, B9.2, B9.3, B9.4, B10.1, B10.2, B10.3, B10.4, B11.1, B11.2, B11.3, B11.4, B11.5, B11.6, B11.7, B11.8, B11.9, B12.1, B12.2 = **31 sub-behaviors**

**Check:** 9 + 16 + 31 = **56** ✓ (matches the row count).

**Rounded summary cited in Executive Summary:** 9 / 16 / 31. Previous drafts cited "4 / 10 / 12" (behavior-group rounding) and then briefly "9 / 20 / 33" (incorrectly added E-view rows to B-row counts — E entries cross-reference B entries). The canonical count is 9 / 16 / 31, derived row-by-row above.

**Architectural addition (WR8 deprecation fallback)** — not in bmad_init.py. Per architecture Decision 1: if config missing but `_bmad/core/bmad-init/` exists → emit deprecation warning + shell out to Python loader. This is a *new* loader behavior, not a port of bmad_init's behavior. Tagged separately as **`add-in-loader`** in prose (not in the table above, since it has no B-number — it's an architectural addition).

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

**Explicit subprocess exception for `_loadLegacyConfig`:** the WR8 backwards-compatibility fallback (§Handoff Notes, item 2) uses `child_process.spawnSync('python', ['bmad_init.py', 'load', '--all', ...])` to delegate to the Python loader. The subprocess consumes Python's `yaml.safe_load` output, not JS's `yaml.parseDocument`, so it does not itself apply Pattern 3. This is an acknowledged exception: the legacy path preserves whatever semantics the Python reader always had, for the one-minor-version backwards-compat window (4.0→4.1). Pattern 3 applies to all native JS reads in the loader; Pattern 3 does NOT cross the subprocess boundary. Story 1A.2's implementer should document this in the loader's JSDoc for `_loadLegacyConfig`.

**All four anchor rules pass.** One acknowledged exception for the subprocess fallback.

---

## Handoff Notes for Story 1A.2 (`config-loader.js` implementation)

### What the implementer needs

1. **The full load-path body** is drafted in §4 and §8 of this audit. Copy verbatim as a starting point; adjust to final project conventions.
2. **Integration wiring** at the CLI entry point:
   ```js
   const { findProjectRoot } = require('../lib/utils');
   const { loadModuleConfig } = require('../lib/config-loader');
   const root = findProjectRoot();  // throws if no _bmad/ found
   const vortexConfig = loadModuleConfig(root, 'bme/_vortex');
   ```
   The loader never calls `findProjectRoot()` itself (respects `no-process-cwd-in-libs`).
3. **Three helpers** compose the implementation:
   - `loadModuleConfig(projectRoot, moduleConfigPath)` — public API.
   - `_resolveProjectRootPlaceholder(config, projectRoot)` — internal, §5.
   - `_loadLegacyConfig(projectRoot, moduleConfigPath)` — internal, backwards-compat (WR8). Body deferred to 1A.2 author; spec is "return whatever the old bmad-init load path would have returned, via a subprocess shell-out to `python bmad_init.py load --all --module {module} --project-root {root}` and JSON-parse stdout." See §Anti-Drift Compliance Walk for the acknowledged Pattern 3 subprocess exception.
4. **Test matrix (8 canonical cases)** for `tests/lib/config-loader.test.js` per architecture Decision 1 testability:
   1. v4 fresh load — present config, returns correct shape.
   2. v3 fallback with deprecation warning — config missing, bmad-init directory present, legacy path invoked.
   3. Nested module path handling — single parameterized test covers `'bme/_vortex'`, `'bme/_enhance'`, `'core'` as table-driven cases (one test, three inputs).
   4. Missing config, no bmad-init → actionable error thrown.
   5. Malformed YAML → actionable error thrown (file + line in message).
   6. Empty file → actionable error thrown ("YAML object expected").
   7. `{project-root}` placeholder resolved across every top-level value.
   8. Non-string values (numbers, bools, nested objects) pass through unchanged.

### What the implementer must NOT port

- No `--vars`, `--all`, `--module` CLI flags.
- No module.yaml reading.
- No config writing.
- No core/module merge logic (configs already flat).
- No exit-code or JSON-to-stdout protocol.
- No `process.cwd()` walks.

### Follow-up work for Story 1A.3+

- **Sweep count:** PRD estimated ~25; mechanical enumeration confirms **18 SKILL.md files match the invocation pattern** (current count; pending Epic 1B removal of Bob/Quinn/Barry, which would bring the net to 15 — but do NOT pre-subtract in Story 1A.3 inventory, since Epic 1B may slip. Start from the 18-entry table in §Mechanical Enumeration Evidence.)
- **Separately:** `_bmad/bmm/1-analysis/bmad-product-brief/SKILL.md` mentions `bmad-init` but does NOT match the exact `"Load config via bmad-init skill"` activation pattern. Story 1A.3 must verify whether it needs inclusion in the sweep; track as a candidate outside the canonical 18.
- **`convoke-install` JS porting** — the 33 sub-behaviors tagged `move-to-convoke-install` (B2, B3, B7, B9, B10, B11, B12, E14.4, E14.6) accumulate into a substantial rewrite. This is NOT part of 4.0 scope per architecture Decision 6 (Sprint 0 + Sprint 1 focus on loader + migration only); bootstrap stays in Python `bmad_init.py` until a future initiative explicitly tackles it. The `drop-with-rationale` tag on CLI entry (§13) does NOT imply CLI removal — it implies the CLI is not reproduced **in the loader**. The CLI remains callable from `convoke-install` flows in 4.0.

### Deprecation timeline (from architecture)

- **Convoke 4.0:** `bmad-init` marked deprecated. Warning emitted at activation when fallback path is hit.
- **Convoke 4.1:** `bmad-init` removed entirely. `_loadLegacyConfig` can be deleted.

---

## Appendix — Convoke's Current State Is Already Mostly v6.3-Compliant

This was the most surprising finding of the audit and deserves preservation:

**Grep result (recursive, `-rn`):** `grep -rn 'bmad-init\|bmad_init' _bmad/bme/` → **0 matches**.

**Find result:** `find _bmad/bme -path '*/agents/*.md'` → **12 agent files** (Vortex × 7, Gyre × 4, Team Factory × 1). The `_bmad/bme/_enhance/` module exists but has no `agents/` subdirectory — `_enhance` ships skills + workflows, no standalone agents.

All 12 bme agents already direct-load their module configs at activation. Sample from [`_bmad/bme/_vortex/agents/contextualization-expert.md:13`](../../_bmad/bme/_vortex/agents/contextualization-expert.md#L13):

```
- Load and read {project-root}/_bmad/bme/_vortex/config.yaml NOW
- ERROR HANDLING: If config file not found or cannot be read, IMMEDIATELY display: ...
- If config loaded successfully: Store ALL fields as session variables: {user_name}, {communication_language}, {output_folder}
```

This is **already the v6.3 direct-load pattern** — the LLM reads the YAML file itself, no subprocess. The 4.0 "migration sweep" does not touch these files. It only rewrites the 18 upstream BMAD agent SKILL.md files.

**Compliance ratio (mechanical):**
- Convoke-owned agents already compliant: **12** (all bme agents direct-load; zero bmad-init references)
- Upstream-BMAD agents requiring migration: **18**
- Total in-scope for activation pattern: **30**
- Convoke already v6.3-compliant: **12 / 30 = 40%**

Earlier drafts of this audit cited "74% compliant," derived from `14 / (14 + 18)` — both the numerator (14 bme agents) and the framing were incorrect. The 40% figure is the one backed by mechanical enumeration. A 40%-already-compliant baseline is still notable and worth observing in Story 5B retrospective as context for the innovation hypothesis about Convoke's v6.3 convention adoption.

**Implication for Convoke 4.0 announcement:** "Convoke's own agents were already direct-load; this release brings upstream BMAD agents into the same pattern." The framing is genuine — the migration is scoped to upstream-BMAD SKILL.md rewrites, not a cross-tree sweep.
