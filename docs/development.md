# Development Guide

Architecture overview, agent development patterns, and contribution guidelines for Convoke.

---

## Architecture

### Agent Architecture Framework (v1.1.0)

All agents follow a standard pattern:

- **XML-based agent structure** — Agent definition in markdown code blocks
- **Config-driven personalization** — `user_name`, `communication_language`, `output_folder`
- **Step-file workflow pattern** — Just-in-time sequential loading (steps are only loaded when reached)
- **Menu-driven interaction** — Numeric, text, and fuzzy command matching
- **Artifact generation** — Template-based professional output

See: [Agent Architecture Framework](../_bmad-output/_archive/exploratory/generic-agent-integration-framework.md)

### Update System (v1.4.0+)

Key modules in `scripts/update/lib/`:

| Module | Responsibility |
|--------|---------------|
| `utils.js` | `getPackageVersion()`, `compareVersions()`, `findProjectRoot()` |
| `refresh-installation.js` | Shared refresh (agents, workflows, config, guides) |
| `migration-runner.js` | Orchestration (deltas → refresh → validate) |
| `config-merger.js` | `mergeConfig()` with structural defaults for fresh installs |
| `validator.js` | Validates all 7 agents, 22 workflows, config, manifest |

Migrations live in `scripts/update/migrations/registry.js` (append-only).

### Architecture Rules

- **Never** hardcode version strings — use `getPackageVersion()` from `package.json`
- **Never** use `process.cwd()` directly — use `findProjectRoot()` or accept `projectRoot` param
- Migration files contain **only delta logic** — `refreshInstallation()` handles file copying
- Registry entries have **no `toVersion`** — target is always the current package version
- All filesystem functions accept a `projectRoot` parameter for testability

---

## Building a New Agent

1. **Clone an existing agent as a template:**

   ```bash
   cp _bmad/bme/_vortex/agents/contextualization-expert.md \
      _bmad/bme/_vortex/agents/your-agent.md
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
   - Follow Emma's test plan structure (39 scenarios)
   - Execute P0 tests (18 critical scenarios minimum)
   - Target: 100% P0 pass rate

### Agent File Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Agent file | Role-based with dashes | `discovery-empathy-expert.md` |
| Frontmatter name | Spaces, lowercase | `"discovery empathy expert"` |
| Display name | First name | `name="Isla"` |
| User guide | Uppercase first name | `ISLA-USER-GUIDE.md` |

See: [Emma Reference Implementation](../_bmad-output/_archive/exploratory/emma-reference-implementation-complete.md)

---

## Project Structure

```
Convoke/
├── _bmad/bme/_vortex/
│   ├── agents/              # Agent definition files (7)
│   ├── workflows/           # 22 workflows, each with steps/ + template
│   │   └── _deprecated/     # Old workflows preserved here
│   └── config.yaml          # Submodule configuration
├── _bmad-output/
│   └── vortex-artifacts/    # Generated artifacts + user guides
├── scripts/
│   ├── install/             # Installer scripts
│   └── update/
│       ├── lib/             # Update system modules
│       └── migrations/      # Migration registry + delta files
├── tests/
│   ├── unit/                # 208 unit tests
│   └── integration/         # 60 integration tests
├── docs/                    # Documentation (you're here)
├── package.json             # v2.0.0
├── CHANGELOG.md             # Version history
└── UPDATE-GUIDE.md          # Migration documentation
```

---

## Contributing

### Areas of Contribution

**Agents and Workflows:**
- Workflow improvements and template enhancements for all 7 agents
- New workflow variants and specialized templates

**Testing:**
- P0 test suites for Isla, Mila, Liam, Noah, and Max
- Edge case and performance testing
- Expanding coverage for known gaps (see [Testing](testing.md#known-coverage-gaps))

**Documentation:**
- Tutorials and video walkthroughs
- Translation/internationalization

**Integration:**
- IDE plugins
- Third-party tool integrations

### Development Commands

```bash
npm test                 # Unit tests
npm run test:integration # Integration tests
npm run test:all         # All tests
npm run test:coverage    # Coverage with thresholds
npm run lint             # ESLint
```

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
