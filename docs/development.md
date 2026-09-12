# Development Guide

Architecture overview, agent development patterns, and contribution guidelines for Convoke.

---

## Architecture

### Agent Architecture Framework (v1.1.0)

> This version marks the framework specification linked below, which declares `version: 1.1.0` in its own frontmatter.

All agents follow a standard pattern:

- **Agent structure is mid-migration** — most agent files still carry the v5 XML blocks (`<agent>` / ```` ```xml ````). The converted Vortex agents — Emma, Wade and Mila — carry none and are plain outcome-based markdown. Source of truth: the agent files under `_bmad/bme/**/agents/`; `_bmad/bme/_config/name-registry.csv` records the per-agent state
- **Config-driven personalization** — `user_name`, `communication_language`, `output_folder`
- **Step-file workflow pattern** — Just-in-time sequential loading (steps are only loaded when reached)
- **Menu-driven interaction** — Numeric, text, and fuzzy command matching
- **Artifact generation** — Template-based professional output

See: [Agent Architecture Framework](../_bmad-output/_archive/exploratory/generic-agent-integration-framework.md)

### Update System (v1.4.0+)

> This version marks the update system's own generation, not the package's. `CHANGELOG.md` is where it is recorded — search it for `1.4.0` rather than trusting a heading named here, which is how the previous two attempts got it wrong.

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

Agent files are laid out two ways, and both are in use. **The directory form is canonical for new teams** —
it is what Vortex uses for all seven of its agents, and it gives each agent a place for the `references/`
files several of them already carry. The flat form is what Gyre and Loom use; existing agents are not being
migrated, so both forms stay current. The clone recipe above copies the canonical one.

Layout is independent of the v6.3 conversion state: all seven Vortex agents use the directory form whether or
not they have been converted.

> ⚠ **The tooling does not produce the canonical form yet.** The Team Factory generates
> `_bmad/bme/_{team}/agents/{agent_id}.md`, and `refresh-installation.js`'s generic module loader expects that
> flat path — the directory form is currently a Vortex-specific branch. **A team built by the factory today
> gets the flat form**, and building one by hand in the canonical form would produce a skill wrapper pointing
> at a file the installer will not find. Closing that gap is filed as `T147`. Until it lands, treat "canonical"
> as the target for new teams, not as what the generator emits.

| Element | Convention | Example |
|---------|-----------|---------|
| Agent file — **canonical for new teams** | Directory named for the role; the agent lives in `SKILL.md` inside it, with room for a `references/` subdirectory beside it | `_bmad/bme/_vortex/agents/discovery-empathy-expert/SKILL.md` |
| Agent file — flat form | A single file named for the role. Used by Gyre and Loom; **not** the form to copy for a new team | `_bmad/bme/_gyre/agents/stack-detective.md` |
| Frontmatter name | Three forms, by team and conversion state | `bmad-bme-agent-emma` (converted Vortex) · `discovery-empathy-expert` (unconverted Vortex) · `"stack detective"` (Gyre and Loom, quoted and spaced) |
| Display name | The `name="…"` attribute, in v5 agents only — usually a first name, but not always | `name="Isla"`, `name="Loom Master"` · converted agents have no such attribute and carry the name as a heading |
| User guide | Uppercase first name, where one exists | `ISLA-USER-GUIDE.md`. Vortex and Gyre agents have one; `team-factory` does not |

The last three rows above vary by team and by conversion state; the agent files under `_bmad/bme/**/agents/` are the source of truth, and `_bmad/bme/_config/name-registry.csv` records which agents are converted.

See: [Emma Reference Implementation](../_bmad-output/_archive/exploratory/emma-reference-implementation-complete.md)

---

## Project Structure

**This is shape, not an inventory.** Every node below shows representative children, never all of them —
`ls` the directory for the full set. **Adding** a directory never falsifies it, which is the property that
matters for growth. Renaming or removing any node named below would, and that is the cost of naming exemplars
at all.

```
Convoke/                     # representative children only, like every node below
├── _bmad/bme/               # one directory per team or skill module, e.g.
│   ├── _vortex/             # Team: Product Discovery (7 agents, 22 workflows)
│   ├── _gyre/               # Team: Production Readiness (4 agents, 7 workflows)
│   └── …                    # plus _enhance, _team-factory, covenant, _config and others
├── _bmad-output/            # generated artifacts, one directory per producer, e.g.
│   ├── vortex-artifacts/
│   └── …                    # plus planning-artifacts, implementation-artifacts and others
├── scripts/                 # CLI entry points, some here and some in subdirectories, e.g.
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

The agent and workflow counts above come from `scripts/update/lib/agent-registry.js`. `npm run docs:audit`
checks them, but **only that each number is one the registry knows** — it holds a single set of valid counts
for all teams, so it catches a number that belongs to no team, and would **not** catch Gyre's counts being swapped for Vortex's.
They are still the only figures here any tool can contradict at all; everything else is illustrative.

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
