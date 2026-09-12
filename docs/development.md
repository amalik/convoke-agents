# Development Guide

Architecture overview, agent development patterns, and contribution guidelines for Convoke.

---

## Architecture

### Agent Architecture Framework (v1.1.0)

> The version tracks the framework specification linked below, which declares `version: 1.1.0` in its frontmatter — not the package, which is at a different version entirely.

All agents follow a standard pattern:

- **Agent structure is mid-migration** — most agent files still carry the v5 XML blocks (`<agent>` / ```` ```xml ````). The converted Vortex agents — Emma, Wade and Mila — carry none and are plain outcome-based markdown. Source of truth: the agent files under `_bmad/bme/**/agents/`; `_bmad/bme/_config/name-registry.csv` records the per-agent state
- **Config-driven personalization** — `user_name`, `communication_language`, `output_folder`
- **Step-file workflow pattern** — Just-in-time sequential loading (steps are only loaded when reached)
- **Menu-driven interaction** — Numeric, text, and fuzzy command matching
- **Artifact generation** — Template-based professional output

See: [Agent Architecture Framework](../_bmad-output/_archive/exploratory/generic-agent-integration-framework.md)

### Update System

Key modules in `scripts/update/lib/`:

| Module | Responsibility |
|--------|---------------|
| `utils.js` | `getPackageVersion()`, `compareVersions()`, `findProjectRoot()` |
| `refresh-installation.js` | Shared refresh (agents, workflows, config, guides) |
| `migration-runner.js` | Orchestration (deltas → refresh → validate) |
| `config-merger.js` | `mergeConfig()` with structural defaults for fresh installs |
| `validator.js` | Validates all agents (7 Vortex + 4 Gyre), workflows, config, manifest, skills |

Migrations live in `scripts/update/migrations/registry.js` (append-only).

### Architecture Rules

- **Never** hardcode version strings — use `getPackageVersion()` from `package.json`
- **Never** use `process.cwd()` directly — use `findProjectRoot()` or accept `projectRoot` param
- Migration files contain **only delta logic** — `refreshInstallation()` handles file copying
- Registry entries have **no `toVersion`** — target is always the current package version
- All filesystem functions accept a `projectRoot` parameter for testability

---

## Building New Agents and Teams

### Manual Agent Creation

1. **Clone an existing agent as a template:**

   ```bash
   cp _bmad/bme/_vortex/agents/contextualization-expert/SKILL.md \
      _bmad/bme/_vortex/agents/your-agent/SKILL.md
   ```

2. **Customize the agent definition:**
   - Update persona (role, identity, communication style, principles)
   - Define menu options (workflows, chat, validate)
   - Create workflow step files in `_bmad/bme/_vortex/workflows/your-workflow/steps/`
   - Add output templates

3. **Register in manifest:**

   ```csv
   "your-agent","YourName","Your Title","icon","role","identity",...
   ```

4. **Test thoroughly:**
   - Follow the structure of the existing agent verification test designs
   - Execute the P0 suite — it is the authority on what must pass
   - Target: 100% P0 pass rate

### Team Factory (Recommended)

Use `/bmad-agent-bme-team-factory` for a guided workflow that handles the full creation process — composition pattern selection, agent scope definition, contract design, artifact generation, and integration wiring. The factory produces output that passes the same validation as native teams (Vortex, Gyre).

Two capabilities are available today — **Create Team** (a new team from scratch) and **Validate Team** (end-to-end validation of an existing team). Both are derived from the two rows in `_bmad/bme/_team-factory/module-help.csv`, which is what the module declares it offers.

**Add Agent** and **Add Skill** are planned for Phase 3 and do not ship yet — `_bmad/bme/_team-factory/workflows/` contains `add-team/` only. Asked for either, the factory says so and routes you to the Architecture Reference (`[AR]` on its menu), to BMB (Bond) for generating individual agent or workflow files, and to manual integration wiring against the reference checklist.

### Agent File Naming Conventions

Agent files are laid out differently by team, and both layouts are current — the Vortex
directory form is what the clone recipe above copies.

| Element | Convention | Example |
|---------|-----------|---------|
| Agent file (Vortex) | Directory named for the role; the agent lives in `SKILL.md` inside it | `_bmad/bme/_vortex/agents/discovery-empathy-expert/SKILL.md` |
| Agent file (Gyre) | Flat file named for the role | `_bmad/bme/_gyre/agents/stack-detective.md` |
| Frontmatter name | Three forms, by team and conversion state | `bmad-bme-agent-emma` (converted Vortex) · `discovery-empathy-expert` (unconverted Vortex) · `"stack detective"` (Gyre and Loom, quoted and spaced) |
| Display name | The `name="…"` attribute, in v5 agents only — usually a first name, but not always | `name="Isla"`, `name="Loom Master"` · converted agents have no such attribute and carry the name as a heading |
| User guide | Uppercase first name | `ISLA-USER-GUIDE.md` |

Both rows above vary by team and by conversion state; the agent files under `_bmad/bme/**/agents/` are the source of truth, and `_bmad/bme/_config/name-registry.csv` records which agents are converted.

See: [Emma Reference Implementation](../_bmad-output/_archive/exploratory/emma-reference-implementation-complete.md)

---

## Project Structure

**This is shape, not an inventory.** Every node below shows representative children, never all of
them — `ls` the directory for the full set. Nothing here needs editing when a directory is added,
renamed or removed, which is the property that keeps it true.

```
Convoke/
├── _bmad/bme/               # one directory per team or skill module, e.g.
│   ├── _vortex/             # Team: Product Discovery (7 agents, 22 workflows)
│   ├── _gyre/               # Team: Production Readiness (4 agents, 7 workflows)
│   └── …                    # plus _enhance, _team-factory, covenant, _config and others
├── _bmad-output/            # generated artifacts, one directory per producer, e.g.
│   ├── vortex-artifacts/
│   └── …                    # plus planning-artifacts, implementation-artifacts and others
├── scripts/                 # CLI entry points at the top level, e.g.
│   ├── install-*-agents.js  # per-team installers
│   ├── convoke-doctor.js
│   └── update/              # the update system: lib/ modules, migrations/ registry + deltas
├── tests/                   # one directory per tier, e.g.
│   ├── unit/
│   ├── p0/                  # P0 gate tests (release quality)
│   └── …                    # plus integration, audit, lib and others
├── docs/                    # Documentation (you're here)
└── package.json             # convoke-agents — see CHANGELOG.md and UPDATE-GUIDE.md alongside
```

The agent and workflow counts above are derived from `scripts/update/lib/agent-registry.js` and are
checked by `npm run docs:audit`, which fails if they drift. They are the only figures in this tree
that any tool can contradict — everything else is illustrative.

---

## Contributing

Contribution areas, the CI gates, the binding rules in `project-context.md`, and how changes land are in
[CONTRIBUTING.md](../CONTRIBUTING.md) — the single normative source. This guide covers architecture only.

---

## Architecture Principles

1. **Domain Specialization** — Each agent brings deep expertise in a specific domain rather than generic capabilities
2. **Standard Interface, Diverse Expertise** — All agents use the same framework for consistency, but each has unique workflows and knowledge
3. **Research-Driven Design** — Workflows based on proven frameworks (Jobs-to-be-Done, Lean Startup, Build-Measure-Learn)
4. **Test-First Development** — 100% P0 test coverage required before operational approval
5. **Documentation as First-Class Citizen** — User guides required for each agent
6. **Clear Error Messages** — Users should never be confused about what went wrong or how to fix it

---

[Back to README](../README.md) | [Agents](agents.md) | [Testing](testing.md) | [FAQ](faq.md)
