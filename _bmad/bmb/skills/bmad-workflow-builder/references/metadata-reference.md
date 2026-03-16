# Manifest Reference

Every BMad skill has a `bmad-manifest.json` at its root. This is the unified format for agents, workflows, and simple skills.

## File Location

```
{skillname}/
├── SKILL.md              # name, description, workflow content
├── bmad-manifest.json    # Capabilities, module integration
└── ...
```

## SKILL.md Frontmatter (Minimal)

```yaml
---
name: bmad-{modulecode}-{skillname}
description: [5-8 word summary]. [Use when user says 'X' or 'Y'.]
---
```

## bmad-manifest.json

**NOTE:** Do NOT include `$schema` in generated manifests. The schema is used by validation tooling only — it is not part of the delivered skill.

```json
{
  "module-code": "bmb",
  "replaces-skill": "bmad-original-skill",
  "has-memory": true,
  "capabilities": [
    {
      "name": "build",
      "menu-code": "BP",
      "description": "Builds skills through conversational discovery. Outputs to skill folder.",
      "supports-headless": true,
      "prompt": "build-process.md",
      "phase-name": "design",
      "after": ["create-requirements"],
      "before": ["quality-optimize"],
      "is-required": true,
      "output-location": "{bmad_builder_output_folder}"
    },
    {
      "name": "validate",
      "menu-code": "VL",
      "description": "Runs validation checks and produces quality report.",
      "supports-headless": true
    }
  ]
}
```

## Field Reference

### Top-Level Fields

| Field | Type | Required | Purpose |
|-------|------|----------|---------|
| `module-code` | string | If module | Short code for namespacing (e.g., `bmb`, `cis`) |
| `replaces-skill` | string | No | Registered skill name this replaces. Inherits metadata during bmad-init. |
| `persona` | string | Agents only | Succinct distillation of the agent's essence. **Presence = this is an agent.** |
| `has-memory` | boolean | No | Whether state persists across sessions via sidecar memory |

### Capability Fields

| Field | Type | Required | Purpose |
|-------|------|----------|---------|
| `name` | string | Yes | Kebab-case identifier |
| `menu-code` | string | Yes | 2-3 uppercase letter shortcut for menus |
| `description` | string | Yes | What it does and when to suggest it |
| `supports-autonomous` | boolean | No | Can run without user interaction |
| `prompt` | string | No | Relative path to prompt file (internal capability) |
| `skill-name` | string | No | Registered name of external skill (external capability) |
| `phase-name` | string | No | Module phase this belongs to |
| `after` | array | No | Skill names that should run before this capability |
| `before` | array | No | Skill names this capability should run before |
| `is-required` | boolean | No | If true, skills in `before` are blocked until this completes |
| `output-location` | string | No | Where output goes (may use config variables) |

### Three Capability Flavors

1. **Has `prompt`** — internal capability routed to a prompt file
2. **Has `skill-name`** — delegates to another registered skill
3. **Has neither** — SKILL.md handles it directly

### The `replaces-skill` Field

When set, the skill inherits metadata from the replaced skill during `bmad-init`. Explicit fields in the new manifest override inherited values.

## Agent vs Workflow vs Skill

No type field needed — inferred from content:
- **Has `persona`** → agent
- **No `persona`** → workflow or skill (distinction is complexity, not manifest structure)

## Config Loading

All module skills MUST use the `bmad-init` skill at startup.

See `references/complex-workflow-patterns.md` for the config loading pattern.

## Path Construction Rules — CRITICAL

Only use `{project-root}` for `_bmad` paths.

**Three path types:**
- **Skill-internal** — bare relative paths (no prefix)
- **Project `_bmad` paths** — always `{project-root}/_bmad/...`
- **Config variables** — used directly, already contain `{project-root}` in their resolved values

**Correct:**
```
references/reference.md                # Skill-internal (bare relative)
stage-one.md                          # Skill-internal (prompt at root)
{project-root}/_bmad/planning/prd.md  # Project _bmad path
{planning_artifacts}/prd.md           # Config var (already has full path)
```

**Never use:**
```
../../other-skill/file.md              # Cross-skill relative path breaks with reorganization
{project-root}/{config_var}/output.md # Double-prefix
./references/reference.md              # Relative prefix breaks context changes
```
