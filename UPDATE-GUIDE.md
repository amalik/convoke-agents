# Update Guide

How to update your Convoke installation to the latest version.

- **Package:** `convoke-agents`
- **Version:** 3.0.0
- **Last Updated:** 2026-03-25

---

## Quick Update

```bash
# Update the package
npm install convoke-agents@latest

# Preview changes (dry run)
npx -p convoke-agents convoke-update --dry-run

# Apply the update
npx -p convoke-agents convoke-update
```

Your data is backed up automatically before any changes.

---

## Update Commands

### `convoke-update`

Main update command — applies migrations and refreshes your installation.

| Flag | Description |
|------|-------------|
| `--dry-run` | Preview changes without applying |
| `--yes` or `-y` | Skip confirmation prompt |
| `--verbose` or `-v` | Show detailed output |

```bash
npx -p convoke-agents convoke-update --dry-run     # Preview
npx -p convoke-agents convoke-update               # Apply with confirmation
npx -p convoke-agents convoke-update --yes          # Apply without confirmation
```

### `convoke-version`

Show current version, latest available version, and migration history.

```bash
npx -p convoke-agents convoke-version
```

### `convoke-doctor`

Run diagnostics on your installation. Checks project root, config validity, agent files, workflows, output directory permissions, migration lock status, and version consistency — with actionable fix suggestions.

```bash
npx -p convoke-agents convoke-doctor
```

> **Why `-p convoke-agents`?** The CLI commands (`convoke-update`, `convoke-doctor`, etc.) are binaries inside the `convoke-agents` package. Without `-p convoke-agents`, npx tries to find a standalone package with that name, which doesn't exist.

---

## Migration Paths

### From v2.4.x to v3.0.0

**Breaking changes:** Team Factory extension workflows (add-agent, add-skill) are new capabilities that change the module API surface.

What happens:
- **Team Factory extensions** — Add Agent and Add Skill workflows with appender modules (registry, config, CSV)
- **Multi-team docs-audit** — Audit tool now validates against all registered teams (Vortex + Gyre), not just Vortex
- **Extension validator** — New validation for factory-generated agent and skill extensions

### From v2.3.x to v2.4.0

**Breaking changes:** None

What happens:
- **Gyre team installed** — 4 new agents (Scout, Atlas, Lens, Coach), 7 workflows, 4 contract schemas (GC1-GC4), 4 user guides
- **Team Factory** — guided workflow for creating new BMAD-compliant teams (`/bmad-team-factory`)
- **Skill Validator** — new `validateSkill()` quality gate for factory-generated skills
- Gyre skill wrappers added to `.claude/skills/`
- Agent manifest updated with 4 new entries

If you previously had only Vortex installed, Gyre files are added alongside — nothing in `_bmad/bme/_vortex/` changes.

### From v2.0.x to v3.0.0

**Breaking changes:** None

What happens:
- Enhance module added (Skills architecture, initiatives-backlog)
- Gyre team added (4 agents, 7 workflows)
- Agent activation migrated from `.claude/commands/` to `.claude/skills/` (v2.2.0)
- Legacy command files automatically cleaned up

### From v1.7.x to v3.0.0

**Breaking changes:**
- Product renamed: `bmad-enhanced` → `convoke-agents` (npm package name)
- CLI commands renamed: `bmad-*` → `convoke-*`

What happens:
- All CLI commands use `convoke-` prefix
- `_bmad/` directory preserved (BMAD Method compatibility)
- All 11 agents installed (7 Vortex + 4 Gyre)

### From v1.0.x to v3.0.0

**Breaking changes:**
- Workflow renamed: `empathy-map` → `lean-persona` (for Emma)
- Agent roles updated: `empathy-mapper` → `contextualization-expert`, `wireframe-designer` → `lean-experiments-specialist`
- Module renamed: `_designos` → `_vortex`
- Product renamed: `bmad-enhanced` → `convoke-agents`
- CLI commands renamed: `bmad-*` → `convoke-*`

What happens:
- Old workflows preserved in `_bmad/bme/_vortex/workflows/_deprecated/`
- Full migration chain applied: file renames, config updates, new agents, new modules
- All 11 agents + Enhance module installed

```bash
npm install convoke-agents@latest
npx -p convoke-agents convoke-update --dry-run  # Preview
npx -p convoke-agents convoke-update            # Apply
```

---

## Data Safety

### Automatic Backups

Every update creates a backup before making changes:

- **Location:** `_bmad-output/.backups/backup-{version}-{timestamp}/`
- **Includes:** config.yaml, agents, workflows, agent-manifest.csv
- **Retention:** Last 5 backups kept automatically
- **Rollback:** Automatic if migration fails

### What's Never Touched

- All user-generated files in `_bmad-output/`
- Gyre analysis artifacts in `.gyre/` (stack-profile, capabilities, findings, feedback)
- User preferences (name, language settings)
- Custom configuration values
- Coach amendments and feedback in `.gyre/feedback.yaml`

### What Gets Updated

- Agent definition files (Vortex and Gyre)
- Workflow files (steps, templates, validation)
- Config files (with preference preservation — user-added entries are kept)
- User guides
- Claude Code skill wrappers in `.claude/skills/`
- Agent manifest in `_bmad/_config/`

---

## Forward Compatibility

### Your Artifacts Survive Updates

All user-generated content works with updated agents **without regeneration**:

- **Vortex artifacts** in `_bmad-output/vortex-artifacts/` — personas, hypotheses, learning cards, etc.
- **Gyre artifacts** in `.gyre/` — stack profiles, capabilities manifests, findings reports, feedback logs

Handoff contracts (HC1-HC5 for Vortex, GC1-GC4 for Gyre) are backward-compatible by design. Artifacts created with older agent versions remain valid inputs after updating.

### What Is Backward-Compatible

- **Artifact content** — Everything in `_bmad-output/` and `.gyre/`
- **Handoff contract fields** — The fields agents produce and consume are stable across versions
- **Workflow outputs** — Templates and generated documents maintain their structure
- **Coach amendments** — Model customizations in `.gyre/capabilities.yaml` and `.gyre/feedback.yaml` persist through updates and regeneration

### What Is Managed by the Update System

These change between versions but are handled automatically by `convoke-update`:

- **Agent definition files** — Persona, menu, and instruction content in `_bmad/bme/_vortex/agents/` and `_bmad/bme/_gyre/agents/`
- **Workflow step files** — Step content, templates, and validation
- **Skill wrappers** — Claude Code skill files in `.claude/skills/`
- **Internal file structure** — The layout of `_bmad/bme/` may change between versions
- **User guides** — Updated guides are installed in each team's `guides/` directory

You do not need to manually update these — the update system replaces them while preserving your preferences and artifacts.

---

## Troubleshooting

### "Migration already in progress"

A previous migration may have crashed. Remove the lock file:

```bash
rm _bmad-output/.migration-lock
npx -p convoke-agents convoke-update
```

Or run `npx -p convoke-agents convoke-doctor` to diagnose — it detects stale locks.

### Update fails and won't rollback

Restore from backup manually:

```bash
# Find your backup
ls -la _bmad-output/.backups/

# Restore (replace {backup-dir} with actual directory name)
cp -r _bmad-output/.backups/{backup-dir}/config.yaml _bmad/bme/_vortex/
cp -r _bmad-output/.backups/{backup-dir}/agents _bmad/bme/_vortex/
cp -r _bmad-output/.backups/{backup-dir}/workflows _bmad/bme/_vortex/
```

### "Already up to date" but version is outdated

npx caches package binaries. If you installed at an older version, `convoke-update` may keep running the cached script instead of the latest. Force-fetch the latest:

```bash
npx -p convoke-agents@latest convoke-update
```

This tells npx to download `convoke-agents@latest` first, then run the `convoke-update` bin from it.

### "Installation appears corrupted"

Reinstall from scratch (preserves user data):

```bash
npx -p convoke-agents convoke-install          # Everything
npx -p convoke-agents convoke-install-vortex   # Vortex only
npx -p convoke-agents convoke-install-gyre     # Gyre only
```

### Check migration logs

```bash
ls -la _bmad-output/.logs/
cat _bmad-output/.logs/migration-*.log | tail -100
```

---

## Getting Help

If you encounter issues:

1. Run `npx -p convoke-agents convoke-doctor` for diagnostics
2. Check migration logs in `_bmad-output/.logs/`
3. Restore from backup in `_bmad-output/.backups/`
4. [Report an issue](https://github.com/amalik/convoke-agents/issues) — include your version (`npx -p convoke-agents convoke-version`) and error message

---

[Back to README](README.md) | [Installation Guide](INSTALLATION.md) | [Changelog](CHANGELOG.md)
