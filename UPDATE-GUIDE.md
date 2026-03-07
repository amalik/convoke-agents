# Update Guide

How to update your Convoke installation to the latest version.

---

## Quick Update

```bash
# Update the package
npm install convoke@latest

# Preview changes (dry run)
npx convoke-update --dry-run

# Apply the update
npx convoke-update
```

Your data is backed up automatically before any changes.

---

## Update Commands

### `npx convoke-update`

Main update command — applies migrations and refreshes your installation.

| Flag | Description |
|------|-------------|
| `--dry-run` | Preview changes without applying |
| `--yes` or `-y` | Skip confirmation prompt |
| `--verbose` or `-v` | Show detailed output |

```bash
npx convoke-update --dry-run     # Preview
npx convoke-update               # Apply with confirmation
npx convoke-update --yes         # Apply without confirmation
```

### `npx convoke-version`

Show current version, latest available version, and migration history.

```bash
npx convoke-version
```

### `npx convoke-doctor`

Run diagnostics on your installation. Checks project root, config validity, agent files, workflows, output directory permissions, migration lock status, and version consistency — with actionable fix suggestions.

```bash
npx convoke-doctor
```

---

## Migration Paths

### From v1.4.x to v1.5.x

**Breaking changes:** None

What happens:
- Isla (Discovery & Empathy Expert) and Max (Learning & Decision Expert) agents added
- 6 new workflows installed (empathy-map resurrected for Isla)
- Installer updated to `convoke-install-vortex`
- Legacy installers (`install-emma`, `install-wade`) show deprecation warnings

### From v1.3.x to v1.5.x

**Breaking changes:** None

What happens:
- Architecture refactor (internal — no user-facing changes)
- Agent files and workflows refreshed
- Isla + Max agents added with 6 new workflows

### From v1.0.x to v1.6.x

**Breaking changes:**
- Workflow renamed: `empathy-map` → `lean-persona` (for Emma)
- Agent roles updated: `empathy-mapper` → `contextualization-expert`, `wireframe-designer` → `lean-experiments-specialist`
- Module renamed: `_designos` → `_vortex`

What happens:
- Old workflows preserved in `_bmad/bme/_vortex/workflows/_deprecated/`
- All 22 Vortex workflows installed
- Config structure updated (preferences preserved)
- 7 agents installed (Emma, Isla, Mila, Liam, Wade, Noah, Max)

```bash
npm install convoke@latest
npx convoke-update --dry-run  # Preview
npx convoke-update            # Apply
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
- User preferences (name, language settings)
- Custom configuration values

### What Gets Updated

- Agent definition files
- Workflow files (steps, templates, validation)
- Vortex config.yaml (with preference preservation — user-added agents and workflows are kept after core entries)
- User guides

---

## Forward Compatibility

### Your Artifacts Survive Updates

All user-generated content in `_bmad-output/` (planning artifacts, implementation artifacts, vortex artifacts) works with updated agents **without regeneration**. When you update from v1.5.x to v1.6.x, your existing artifacts remain valid inputs to both original and new agents.

Artifacts created with earlier agents (Emma, Isla, Wade, Max) were not designed specifically for the newer agents (Mila, Liam, Noah), but the handoff contracts are backward-compatible by design. A product vision created with v1.5.x works as input to Mila after updating to v1.6.x — the required fields are present.

### What Is Backward-Compatible

- **Artifact content** — Everything in `_bmad-output/` (planning artifacts, implementation artifacts, vortex artifacts)
- **Handoff contract fields** — The fields agents produce and consume (HC1-HC5 schemas) are stable across versions
- **Workflow outputs** — Templates and generated documents maintain their structure

### What Is Managed by the Update System

These change between versions but are handled automatically by `npx convoke-update`:

- **Agent definition files** — Persona, menu, and instruction content in `_bmad/bme/_vortex/agents/`
- **Workflow step files** — Step content, templates, and validation in `_bmad/bme/_vortex/workflows/`
- **Internal file structure** — The layout of `_bmad/bme/` may change between versions
- **User guides** — Updated guides are installed in `_bmad/bme/_vortex/guides/`

You do not need to manually update these — the update system replaces them while preserving your preferences and artifacts.

---

## Troubleshooting

### "Migration already in progress"

A previous migration may have crashed. Remove the lock file:

```bash
rm _bmad-output/.migration-lock
npx convoke-update
```

Or run `npx convoke-doctor` to diagnose — it detects stale locks.

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

npx caches package binaries. If you installed at an older version, `npx convoke-update` may keep running the cached script instead of the latest. Force-fetch the latest:

```bash
npx -p convoke@latest convoke-update
```

This tells npx to download `convoke@latest` first, then run the `convoke-update` bin from it.

### "Installation appears corrupted"

Reinstall from scratch (preserves user data):

```bash
npx convoke-install-vortex
```

### Check migration logs

```bash
ls -la _bmad-output/.logs/
cat _bmad-output/.logs/migration-*.log | tail -100
```

---

## Getting Help

If you encounter issues:

1. Run `npx convoke-doctor` for diagnostics
2. Check migration logs in `_bmad-output/.logs/`
3. Restore from backup in `_bmad-output/.backups/`
4. [Report an issue](https://github.com/amalik/convoke/issues) — include your version (`npx convoke-version`) and error message

---

[Back to README](README.md) | [Installation Guide](INSTALLATION.md) | [Changelog](CHANGELOG.md)
