# Update Guide

How to update your Convoke installation to the latest version.

- **Package:** [`convoke-agents`](https://www.npmjs.com/package/convoke-agents)

> **This guide tracks `main`, not the release you have installed.** Behaviour described here may
> not be in your copy. [CHANGELOG.md](CHANGELOG.md)'s `[Unreleased]` section lists what has not
> shipped yet. Do not read a published release's own copy of this guide as authoritative either —
> every release from 3.2.0 to 4.0.3 shipped a guide that was wrong about its own behaviour, most
> visibly by listing custom configuration values as never touched while the installer replaced
> them. Treat a specific claim as something to check against your installation, not a guarantee.

---

## Quick Update

> **The `@latest` is mandatory, not stylistic.** If `convoke-agents` is already a recorded dependency — which it is for anyone updating rather than installing fresh — `npm install convoke-agents` respects the semver range in your `package.json` and **will not cross a major version boundary**. A project on 2.x stays on 2.x, a project on 3.x stays on 3.x, and the update appears to succeed while changing nothing. Always name the tag explicitly when moving between majors.

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

> ⚠ **These sections record what each release ADDED, not what you get today.** Upgrading from an old
> version lands you on the current release, and some capabilities listed below have since been withdrawn.
> The **Team Factory** is the one that matters here: it was un-shipped on 2026-09-29 as internal
> scaffolding, so the `/bmad-agent-bme-team-factory` command and everything under
> `_bmad/bme/_team-factory/` named in the v2.4.0 and v3.0.0 paths below will **not** arrive in your project.
> Derive what does arrive rather than reading it off this list:
> `node -e "console.log(require('convoke-agents/package.json').files.join('\n'))"`.


### From v2.4.x to v3.0.0

**Breaking changes:** The Team Factory appender modules (registry, config, CSV) are new capabilities that change the module API surface. The `add-agent` and `add-skill` workflows they were built for are planned for Phase 3 and did **not** ship — see below.

What happens:
- **Team Factory appender modules** — registry, config and CSV appenders (`_bmad/bme/_team-factory/lib/writers/`). The Add Agent and Add Skill workflows these were built for are planned for Phase 3 and did not ship in this release
- **Multi-team docs-audit** — Audit tool now validates against all registered teams (Vortex + Gyre), not just Vortex
- **Extension validator** — `validateSkillExtension()` and `buildSkillExtensionManifest()` (`_bmad/bme/_team-factory/lib/`). Like the appenders above, these shipped; the Add Agent and Add Skill workflows that would produce the extensions they validate did not

### From v2.3.x to v2.4.0

**Breaking changes:** None

What happens:
- **Gyre team installed** — 4 new agents (Scout, Atlas, Lens, Coach), 7 workflows, 4 contract schemas (GC1-GC4), 4 user guides
- **Team Factory** — guided workflow for creating new BMAD-compliant teams (`/bmad-agent-bme-team-factory`)
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
- **Includes:** the whole of `_bmad/bme/` — every module, agent, workflow, contract, example and
  guide the installer owns — plus `_bmad/_config/agent-manifest.csv`. It is stored path-mirrored as
  `tree/_bmad/bme/`. The whole tree is copied rather than a list of paths because the installer
  removes and replaces directories from many separate places — `grep -cE 'fs\.remove(Sync)?\('
  scripts/update/lib/refresh-installation.js` returns 14 — and three successive attempts to
  enumerate the ones that matter each missed one. Your Vortex user guides additionally get a sibling `.bak` from
  `convoke-update`.
- **NOT included:** `.claude/skills/`. A refresh regenerates those wrappers from the agent registry
  and deletes the directories first, so operator files placed there are destroyed and there is no
  copy — measured 2026-10-03. That directory is gitignored build output, not a place to keep work;
  if you have customised a generated wrapper, keep the source of your change elsewhere.
- **Also not included, but safe:** `_bmad-output/` apart from the backups themselves, and the shared
  files under `_bmad/_config/` other than `agent-manifest.csv`. A refresh writes `skill-manifest.csv`,
  `taxonomy.yaml`, `bmm-dependencies.csv` and the `agents/` customization directory, but appends or
  creates rather than replacing: a marker line added to each survived an update, measured
  2026-10-03. (`workflow-manifest.csv` is listed in some older notes; a Convoke-only install does
  not have one and a refresh does not create it.) One exception — a `skill-manifest.csv` that is present but unusable
  is renamed to `.corrupt-<version>` and reseeded, so it is preserved rather than appended to.
- **Retention:** Last 5 backups kept automatically
- **Rollback:** Automatic **only if the update fails.** A successful refresh still replaces most of
  `_bmad/bme/` — measured, 82 of its 103 directories lost a planted file, the surviving 21 being
  module roots and a few directories the installer only copies into — and nothing restores them for
  you. Use the manual recipe below.

### What's Never Touched

- All user-generated files in `_bmad-output/`
- Gyre analysis artifacts in `.gyre/` (stack-profile, capabilities, findings, feedback)
- User preferences (name, language settings) in the **Vortex** and **Gyre** configs
- Custom values in the **Vortex** and **Gyre** `config.yaml` — but **not** in `_enhance`,
  `_artifacts` or `_portability`, which are rewritten from the package template on every refresh.
  They are backed up by an update, not preserved — see Automatic Backups above — and an install
  takes no backup at all.
- Your own files anywhere under `_bmad/bme/` are **not** in this list either — a refresh replaces
  them. They are now backed up, so they are recoverable (see Automatic Backups), but they are not
  preserved in place. Files under `.claude/skills/` are neither preserved nor backed up.
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

### Restoring from a backup by hand

Needed in two cases: an update that failed without rolling back, and an update that **succeeded** —
automatic rollback runs only on failure, so a module directory replaced by a successful refresh is
yours to restore.

```bash
# Find your backup
ls -la _bmad-output/.backups/

# Restore (replace {backup-dir} with actual directory name)
cp -r _bmad-output/.backups/{backup-dir}/config.yaml _bmad/bme/_vortex/
cp -r _bmad-output/.backups/{backup-dir}/agents _bmad/bme/_vortex/
cp -r _bmad-output/.backups/{backup-dir}/workflows _bmad/bme/_vortex/

# Everything the installer owns is stored under tree/. Restore the part you need, e.g.
cp -r _bmad-output/.backups/{backup-dir}/tree/_bmad/bme/_artifacts _bmad/bme/
cp -r _bmad-output/.backups/{backup-dir}/tree/_bmad/bme/_vortex/contracts _bmad/bme/_vortex/

# WARNING: that copies config.yaml too, setting the module's version back to the release you
# updated FROM. convoke-doctor then reports a version inconsistency and tells you to run
# convoke-update, and that refresh replaces the directory again — destroying what you restored.
# Measured 2026-10-03. Prefer copying only the files you added:
#
#   cp _bmad-output/.backups/{backup-dir}/tree/_bmad/bme/_artifacts/MY-FILE.md _bmad/bme/_artifacts/
#
# If you do copy the whole directory, reset the version afterwards to the installed release
# (npx -p convoke-agents convoke-version prints it) by editing version: in the module's config.
```

### "Already up to date" but version is outdated

npx caches package binaries. If you installed at an older version, `convoke-update` may keep running the cached script instead of the latest. Force-fetch the latest:

```bash
npx -p convoke-agents@latest convoke-update
```

This tells npx to download `convoke-agents@latest` first, then run the `convoke-update` bin from it.

### "refusing to overwrite ... config.yaml"

From 4.0.3 the **Vortex and Gyre** `config.yaml` files were never replaced when they could not be read,
and the other module configs were not checked at all. **That was fixed on `main`, after 4.0.3**: the installer now refuses on
an unreadable config for **every** module whose `config.yaml` it writes, rather than for a hardcoded pair.
Derive the current set rather than trusting this sentence:

```bash
node -e "console.log(require('./scripts/update/lib/refresh-installation.js').guardedModuleNames().join(', '))"
```

Two caveats, both open and both narrower than the old defect:

- **The refusal half only.** `_enhance`, `_artifacts` and `_portability` configs are still rewritten from
  the package template on every run, because `mergeConfig` carries profiles for `_vortex` and `_gyre`
  alone. A readable config there is not preserved; see Automatic Backups.
- **The set is exactly what the installer writes.** On `main`, after 4.0.3: the five modules are
  named in the source, which is what this section's own command prints. Before that fix the set was
  derived from the package tree's directories, so in a clone `_team-factory` — un-shipped
  but still tracked in git — remained in it, and a project carrying an orphaned damaged
  `_team-factory/config.yaml` could have every install and update refused by a message naming a module
  the package no longer contains. That can no longer happen. A named list is deliberate: an
  intermediate fix read `package.json` `files[]` and was withdrawn before release, because several
  npm-legal spellings of the same entry left npm shipping a module while the parser dropped it,
  turning the guard off. **Retiring the orphan directory itself is still open and unscheduled**, which this did not do: a
  `convoke-doctor` version-consistency failure naming `_team-factory` persists until it lands.

Where you see this message depends on the command and on which file is
damaged; the table below has every case, because they differ:

```
config-merger: refusing to overwrite /path/to/project/_bmad/bme/_gyre/config.yaml: it is not valid YAML (Map keys must be unique at line 3, column 1:). Fix or remove the file, then re-run.
```

It arrives as a single line naming the absolute path. It takes one of three forms, and only the
first two tell you where to look:

- `it is not valid YAML (<parser message>)` — a duplicate key, a tab used as indentation, more
  than one document. A tab elsewhere — trailing a value, between a key and its value, inside a
  quoted string — is valid YAML and is not refused. The
  parenthesis carries the parser's own first line of error, with a line and column.
- `it is not a YAML mapping.` — the file holds a list, or a bare string, number or boolean. There is
  no parser error and no location, because nothing failed to parse: the file is valid YAML of the
  wrong shape. Replace it rather than hunting for an error.

- `it cannot be read (<OS error>)` — the file cannot be opened at all: an unreadable file gives
  `it cannot be read (EACCES: permission denied, open '<path>')`, and a directory sitting where the
  config should be gives `it cannot be read (EISDIR: illegal operation on a directory, read)`. Both
  carry the path through the `refusing to overwrite <path>:` prefix. Earlier releases let the raw
  errno escape instead, and `EISDIR` carries no path of its own, so the message named no file.
  For an unreadable file, fix the permissions. For a directory, remove it and then run an
  **install** — the steps below are the repair, because removing it leaves no config at that path.

> **One case still gives you the bare errno with no path: `convoke-update` against a damaged
> **Vortex** config.** Version detection reads that file before the refusal can run, catches every
> error, and prints `Warning: Could not read config.yaml: <OS error>` — then offers a migration
> plan from a guessed version. `EISDIR` names no file of its own, so if you see that warning with
> no path, check `_bmad/bme/_vortex/config.yaml` first. Decline the plan and repair the file. This
> is the `convoke-update` + Vortex gap described below, and it reaches the `EACCES`/`EISDIR` cases too.

This protects your settings — before 4.0.3, a single duplicate key silently replaced the whole
file with defaults. Wherever the message appears, the file it names is left byte-identical, and no agent,
workflow, guide or config file has been replaced.

The refusal is not the first thing an install does, though, and which writes precede it depends on the
command:

- `convoke-install` and `convoke-install-vortex` run five steps and refuse at `[4/5]`. Step `[2/5]` has
  already run: it copies the deprecated `wireframe` workflow into
  `_bmad/bme/_vortex/workflows/_deprecated/`, and **deletes** `_bmad/bme/_designos` and `_bmad/_designos`
  if either exists (leftovers from the pre-Vortex layout). A file planted under `_designos` did not survive
  a run that went on to refuse — if you keep anything of your own there, move it before you install.
- `convoke-install-gyre` runs four steps and refuses at `[3/4]`. It has no archive or cleanup step, and
  touches neither `wireframe` nor `_designos`.

**Which command shows it, and when** (each line below was run against a real installation):

| What you run | Which config is damaged | What happens |
|---|---|---|
| `convoke-install` or `convoke-install-vortex` | either | Refuses with the message above at `[4/5]`, exit 1. The file is left byte-identical — but step `[2/5]` has already run, as above |
| `convoke-install-gyre` | either | Refuses with the message above at `[3/4]`, exit 1. The file is left byte-identical, and nothing has been archived or deleted |
| `convoke-update` | Gyre, and a refresh is due | Refuses with the message above, exit 1 |
| `convoke-update` | Gyre, nothing else out of step | `✓ Already up to date!`, exit 0 — the damaged file is not noticed |
| `convoke-update` | **Vortex** | **No refusal.** Version detection cannot read the file, falls back to inspecting the directory layout, and reports an old version: `1.1.0` where `workflows/_deprecated/` exists, `1.0.0` on a project installed with `convoke-install-gyre` alone, which never creates it. You are offered a plan from there up to the package's version, listing two or three breaking changes. If you accept it, migration 3 of 7 (`1.5.x-to-1.6.0`) fails on the same parse error and the run is rolled back from its backup — exit 1, your config byte-identical |
| any install command, or `convoke-update` when a refresh is due | `_enhance`, `_artifacts`, `_portability` | Refuses, exit 1, file byte-identical. Which step, and what has already run by then, differs per command: see the four rows above for the installers, and note that `convoke-update` refuses inside `[2/3] Refreshing installation files`, then restores from its backup and reports `✓ Installation restored from backup`. A **readable** config there is a different matter: it is still replaced by the package template on every run, damaged or not, so operator values are lost. Verified by re-install — a planted `my_custom_key` was gone from all three, where `_vortex` and `_gyre` kept it, because `configMerger.mergeConfig` carries profiles for those two alone. A readable config there is still replaced. An update backs it up first; an install does not. With nothing out of step, `convoke-update` prints `✓ Already up to date!` and never reaches them |

The `convoke-update` + **Vortex** row is a known defect: the refusal exists and runs,
but version detection reads the Vortex config first and swallows the error before the refusal can be
reached. Until it is fixed, treat a `Could not read config.yaml` warning followed by a surprisingly old
`From:` version — `1.1.0` or `1.0.0`, neither of which you installed — as this case, decline the plan, and
repair the file as below. The row above it carried that same defect for `_enhance`, `_artifacts` and
`_portability` until that was fixed; they are checked now, and an unreadable one refuses like Gyre's. What
remains for those three is that a *readable* config is still overwritten from the package template on
every run. The guard stopped covering the module that no longer ships on 2026-10-01, on `main`.

**Reinstalling will not clear this, and that is deliberate** — `convoke-install` runs the same
check. Repair the file itself:

1. Open the file named in the message and fix it. The most common cause is a second `user_name:`
   line added below the seeded `user_name: '{user}'`. **Delete the seeded `'{user}'` line and keep
   your own** — deleting yours instead leaves you on the placeholder, which is the state this
   release exists to fix. Where the message reported no location (`it is not a YAML mapping`), go to
   step 2 instead.
2. If you would rather start over on that file, delete it.
3. Run an **install**, not an update:

   ```bash
   npx -p convoke-agents convoke-install
   ```

   `convoke-install`, `convoke-install-vortex` and `convoke-install-gyre` each rewrite **both**
   configs, so any one of them restores a deleted or replaced file with the right contents for its
   own module, and keeps every value you had set in the file that was not damaged.

> **`convoke-update` will not do this, and it will not tell you so.** On an installation that is
> otherwise current it stops at `✓ Already up to date!` and exits **0** without reaching the code
> that writes the configs — so a config you deleted at step 2 stays deleted, and the command reports
> success. All four Gyre agents read `_bmad/bme/_gyre/config.yaml` when they start, so a missing one
> leaves them unable to start with nothing on screen to explain why. Always finish with an install.

Both the Vortex and the Gyre `config.yaml` are checked, so a damaged *Gyre* config also blocks
`convoke-install-vortex`. Fix whichever file the message names.

### "Installation appears corrupted"

Reinstall from scratch (preserves user data):

```bash
npx -p convoke-agents convoke-install          # Everything
npx -p convoke-agents convoke-install-vortex   # Vortex only
npx -p convoke-agents convoke-install-gyre     # Gyre only
```

If this reports `refusing to overwrite ... config.yaml`, see the section above — the reinstall is
being blocked on purpose, and repairing that one file is what unblocks it.

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
