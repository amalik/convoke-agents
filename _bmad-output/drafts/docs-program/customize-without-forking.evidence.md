# Evidence: "Customize Convoke without forking"

Companion to `customize-without-forking.md`. Every command that appears on the page is listed in §3 with the log label of the run that proves it succeeded. Raw logs were kept in the scratchpad and are **not** part of the repo.

## 0. Environment and conventions

| Item | Value |
|---|---|
| Date | 2026-09-14 23:50 → 2026-09-15 00:12 (local) |
| Published version check | `npm view convoke-agents dist-tags --json` (cwd: repo root) → `{"rc": "4.0.1-rc.0", "latest": "4.0.2"}` |
| Convoke under test | `convoke-agents@4.0.1` and `@4.0.2` from the npm registry, plus `npm pack` of the working tree (reports 4.0.2) |
| BMAD Method under test | `bmad-method@6.12.0` (latest) and `bmad-method@6.10.0`, installed as local tools inside the scratchpad |
| Runtimes | macOS (Darwin 25.5.0), Node v25.8.1, Python 3.14.3 |
| `$W` | `$SCRATCH/customize` (`$SCRATCH` is a temporary working directory outside the repository) |
| npm cache | `$W/npmcache` (isolated); `npm_config_update_notifier/fund/audit=false` |
| Logging | `$W/run.sh <label> <cwd> <cmd>` runs the command with stdin `/dev/null`, stores stdout+stderr in `$W/logs/<label>.out`, and appends cwd/cmd/exit to `$W/logs/_index.log` |
| Tree snapshots | `$W/snap.sh` records the sha1 of every file except `node_modules/` and `.git/`. Diffs between snapshots are the basis for every "kept/lost" claim. |

Scratch projects:

- `$W/acme-app`: BMAD 6.12.0, then Convoke 4.0.1, customised, then upgraded to 4.0.2 and updated repeatedly. The main test bed.
- `$W/acme-audit-copy`: a `cp -R` of `acme-app` after the first update, used for destructive trap tests.
- `$W/solo-app`: Convoke only, from the packed working-tree tarball, with no BMAD.
- `$W/bump-app`: BMAD 6.10.0 plus Convoke, then a BMAD update to 6.12.0.
- `$W/fresh-check`: a clean Convoke 4.0.2 install, used to re-check the default config keys.

### Repo safety

- The only command run with the repo as cwd that wrote anything was `npm pack --pack-destination $W/pack`. There are no `prepack`, `prepare` or `postpack` scripts: `Object.keys(package.json.scripts)` has no pack or prepare lifecycle key, and the check printed `lifecycle hits: []`.
- There was no `npm install`, `git stash`, checkout, reset or commit in the repo. `git status --short` was checked before and after `npm pack`; the only differences are other people's in-flight files (`_bmad/bme/_team-factory/*`, `tests/team-factory/*`, `_bmad-output/*`).
- The two files in `_bmad-output/drafts/docs-program/` are the only repo writes.
- Shipped code is identical to the release. `git diff --stat v4.0.2 HEAD -- scripts/ _bmad/bme/_vortex _bmad/bme/_gyre _bmad/bme/_enhance _bmad/bme/_artifacts _bmad/bme/_portability` is empty, and `git diff --stat HEAD -- scripts/` is empty. The update logic in the working-tree tarball is therefore the same as published 4.0.2.
- BMAD's installer printed `rm -rf "~/.codex/prompts/…"` lines. These are **advice only** ("Remove them manually"). Those files still exist, and nothing outside the scratchpad was deleted.

---

## 1. Code findings (read-only investigation)

Method: `cat`, `grep` and `sed` over the repo, plus `git diff --stat` (read-only). Line numbers are as of 2026-09-15.

| # | Finding | Source |
|---|---|---|
| C1 | No Convoke agent ships a `customize.toml`. `find _bmad -name customize.toml` returns nothing. In `.claude/skills/`, every `customize.toml` belongs to an upstream `bmad-*` or `wds-*` skill, and none belongs to `bmad-agent-bme-*`. | repo tree |
| C2 | Nothing in `scripts/`, `_bmad/bme/`, `src/` or `index.js` references `customize.toml`, `resolve_customization` or `_bmad/custom`. | `grep -rn` |
| C3 | Vortex and Gyre `config.yaml` go through `mergeConfig`: `{...defaults, ...current}` (`config-merger.js:108`), `extractUserPreferences` (`:175`), and user-added agents/workflows are appended (`:125`, `:141`). The seeded defaults are Vortex-specific, which explains D1. | `scripts/update/lib/config-merger.js` |
| C4 | Remove-then-copy is used for Vortex agent dirs, the Vortex workflows named in the registry, Vortex `contracts/` and `examples/`, `EXTRA_BME_AGENTS` submodules (`_team-factory`), `_artifacts`, `_portability`, and Gyre workflows. Copy-with-overwrite (no remove) is used for `_enhance`, Gyre agent files, Gyre `contracts`, and Gyre README. | `refresh-installation.js` `refreshInstallation()` |
| C5 | Stale-skill sweep: any `.claude/skills/bmad-agent-bme-*` not in the registry is removed. Orphan sweep: any `bmad-enhance-*` not in the Enhance config, and any exact Artifacts or Portability workflow name, is removed. Everything else is left alone. | `refresh-installation.js` §6, `cleanupOrphanWorkflowWrappers()` |
| C6 | Backups cover only `_bmad/bme/_vortex/config.yaml`, `_vortex/agents`, `_vortex/workflows` and `_bmad/_config/agent-manifest.csv`. | `backup-manager.js:345` `getFilesToBackup()` |
| C7 | `convoke-update` does nothing when Vortex is up to date and no sibling module is skewed. | `convoke-update.js:289` |
| C8 | The installer's `verifyInstallation()` checks every agent's skill wrapper regardless of `excluded_agents`. | `install-vortex-agents.js:107` |
| C9 | Refresh writes `_bmad/_config/agents/bme-<name>.customize.yaml` stubs if absent. **Nothing reads them**: the only reference in the codebase is the writer. | `refresh-installation.js` §7 |
| C10 | The doctor classifies custom skills by name prefix. `bmad-*` maps to `bmm` and is reported as `[drift]`; any unrecognised prefix maps to `unknown` and is reported as `[unregistered]`. | `audit-bmm-dependencies.js:506` `_inferSourceModule` |
| C11 | `checkBmmDependencies` never checks that `bmm_agent` still exists. | `convoke-doctor.js:759` |
| C12 | `auto-scan` is a reserved `registered_by` value, and `convoke-register-skill` rejects a duplicate triple. | `convoke-register-skill.js:33`, `checkDuplicate()` |
| C13 | Three Vortex agents (Emma, Mila, Wade) load config "via bmad-init skill" and search `**/project-context.md`. Isla, Liam, Noah, Max and all four Gyre agents load their module `config.yaml` directly and require `user_name`, `communication_language` and `output_folder`: `grep -c 'VERIFY all 3 required fields'` returns 1 for each of those seven files and 0 for Emma, Mila and Wade. | agent files |
| C14 | Vortex workflow steps are loaded by absolute `{project-root}/_bmad/bme/_vortex/workflows/...` paths, for example `lean-persona/workflow.md:50`. | workflow files |
| C15 | Merge rules: scalars override, tables deep-merge, arrays of tables where every item has `code` (or every item has `id`) merge by key, and all other arrays append. There is no removal mechanism. The 6.10 copy is `_bmad/scripts/resolve_customization.py` in the repo. 6.12.0 `config_utils.structural_merge` has the same semantics and also rejects non-string or empty key ids. | both resolvers |
| C16 | `package.json` `files` ships `.claude/skills/bmad-audit-skill-dirs/` only. `bmad-register-skill` does not ship. | `package.json` |

---

## 2. Command log

Result key:

- **OK**: succeeded as expected.
- **NEG-OK**: negative test; it failed on purpose, and the failure is the evidence.
- **DEFECT**: failed and should not have.
- **N/A**: incidental and out of scope.

### 2.1 Setup

| Label | cwd | Command | Exit | Result | Trimmed output |
|---|---|---|---|---|---|
| 01-npm-pack | repo root | `npm pack --pack-destination $W/pack` | 0 | OK | `convoke-agents-4.0.2.tgz`, 468 files |
| 02-tarball-contents | `$W/pack` | `tar -tzf convoke-agents-4.0.2.tgz \| grep -E 'claude/skills\|customize\|resolve_\|bmm-dependencies\|register' \| sort` | 0 | OK | Only `.claude/skills/bmad-audit-skill-dirs/{SKILL,workflow}.md`, `scripts/audit/audit-bmm-dependencies.js`, `scripts/convoke-register-skill.js`. No `bmad-register-skill`. |
| 03-tools-bmad-install | `$W/tools` | `npm init -y >/dev/null && npm install bmad-method@6.12.0` | 0 | OK | `added 99 packages` |
| 10-proj-init | `$W/acme-app` | `npm init -y >/dev/null && git init -q` | 0 | OK | |
| 11-bmad-install | `$W/acme-app` | `$W/tools/node_modules/.bin/bmad-method install --directory . --modules bmm --tools claude-code --user-name Pat --yes` | 0 | OK | `BMad Core Module (v6.12.0, installed)`, `claude-code (29 skills → .claude/skills)`. `_bmad/custom/{config.toml,config.user.toml,.gitignore(*.user.toml)}` and `_bmad/scripts/{resolve_customization,resolve_config,config_utils,render_skill,memlog}.py` created. |
| 12-npm-install-401 | `$W/acme-app` | `npm install convoke-agents@4.0.1` | 0 | OK | `added 14 packages` |
| 13-convoke-install-401 | `$W/acme-app` | `npx -p convoke-agents convoke-install` | 0 | OK | `⚠ BMAD core not detected (package not in node_modules)`, `⚠ BMAD Method not detected (Convoke will install standalone)` (both false; BMAD is installed), `✓ All files installed successfully`, `Edit _bmad/bme/_vortex/config.yaml and replace {user} with your name` |

### 2.2 BMAD customisation layer

| Label | cwd | Command | Exit | Result | Trimmed output |
|---|---|---|---|---|---|
| 20-list-customizable | `$W/acme-app` | `python3 .claude/skills/bmad-customize/scripts/list_customizable_skills.py --project-root .` | 0 | OK | agents: `bmad-agent-analyst, -architect, -dev, -pm, -ux-designer`; 22 workflows; `errors: []`. **No `bmad-agent-bme-*` listed.** |
| (direct) | `$W/acme-app` | Wrote `_bmad/custom/bmad-agent-pm.toml` (persistent_facts ×2, principles ×1, menu `CB`) and `_bmad/custom/bmad-agent-pm.user.toml` (communication_style, menu `CE` replacement), exactly as on the page | – | OK | |
| 21-resolve-pm | `$W/acme-app` | `python3 _bmad/scripts/resolve_customization.py --skill .claude/skills/bmad-agent-pm --key agent` | 0 | OK | persistent_facts = the 2 team entries; `communication_style` = user value; principles = 3 defaults + 1 team; menu = PRD, CE, IR, CC, **CB** |
| 22-resolve-pm-menu | `$W/acme-app` | `python3 _bmad/scripts/resolve_customization.py --skill .claude/skills/bmad-agent-pm --key agent.menu` | 0 | OK | `CE` description is now "Create epics and stories using the Acme story template", **at position 2** (replaced in place); `CB` is last |
| 23-resolve-convoke-agent-NEG | `$W/acme-app` | `python3 _bmad/scripts/resolve_customization.py --skill .claude/skills/bmad-agent-bme-discovery-empathy-expert --key agent` (with `_bmad/custom/bmad-agent-bme-discovery-empathy-expert.toml` present) | 1 | NEG-OK | `error: required TOML file not found: …/bmad-agent-bme-discovery-empathy-expert/customize.toml`. The override file was then deleted. |
| 24-resolve-emma-source-NEG | `$W/acme-app` | `python3 _bmad/scripts/resolve_customization.py --skill _bmad/bme/_vortex/agents/contextualization-expert --key agent` | 1 | NEG-OK | `error: required TOML file not found: …/contextualization-expert/customize.toml` |
| 80-resolve-config-core | `$W/acme-app` | `python3 _bmad/scripts/resolve_config.py --project-root . --key core` (after appending `[core] document_output_language = "French"` to `_bmad/custom/config.toml`) | 0 | OK | `"document_output_language": "French"`. `grep -c bmad-agent-bme _bmad/config.toml` → `0`. |
| 96-gitignore-user-toml | `$W/acme-app` | `git check-ignore -v _bmad/custom/bmad-agent-pm.user.toml _bmad/custom/config.user.toml` | 0 | OK | Both ignored by `_bmad/custom/.gitignore:1:*.user.toml`. `git check-ignore -q _bmad/custom/bmad-agent-pm.toml` → exit 1 (team file not ignored). |
| 126-cp-template-verbatim | `$W/bump-app` (BMAD 6.12.0) | `cp .claude/skills/bmad-product-brief/assets/brief-template.md _bmad/custom/bmad-product-brief-template.md` | 0 | OK | The same `cp` was first run directly in `$W/acme-app`, followed by an appended Acme comment; re-run here verbatim for the log. |
| 110-resolve-brief-template | `$W/acme-app` | `python3 _bmad/scripts/resolve_customization.py --skill .claude/skills/bmad-product-brief --key workflow.brief_template` | 0 | OK | `"{project-root}/_bmad/custom/bmad-product-brief-template.md"` |

### 2.3 Convoke customisations applied before the first update (4.0.1)

Applied directly in `$W/acme-app` with python/sed/echo/heredoc. `set -e` was active, and `grep`/`tail` confirmed each change landed.

| ID | Change |
|---|---|
| V1 | `_vortex/config.yaml`: `output_folder` → `_bmad-output/discovery`; `workflows:` += `acme-discovery-sprint`; `excluded_agents: [production-intelligence-specialist]`; appended the comment `# Acme engagement settings (added by hand)` and the keys `user_name: Pat`, `communication_language: French`, `party_mode_enabled: false`, `acme_client: Globex` |
| G1 | `_gyre/config.yaml`: `output_folder` → `_bmad-output/gyre-artifacts`; `user_name: Pat`, `communication_language: French` |
| T1 | `_team-factory/config.yaml`: `user_name: '{user}'` → `user_name: Pat` |
| E1 | `_enhance/config.yaml`: appended `# acme: hand edit` |
| A1 | Appended `<!-- ACME-EDIT … -->` to `_vortex/agents/discovery-empathy-expert/SKILL.md` (Isla) |
| A2 | Appended a marker to `_gyre/agents/stack-detective.md` |
| W1 | Appended a marker to `_vortex/workflows/lean-persona/workflow.md` |
| W2 | New `_vortex/workflows/acme-discovery-sprint/workflow.md` |
| U1 | Appended a marker to `_vortex/guides/ISLA-USER-GUIDE.md` |
| Y1 | `_bmad/_config/agents/bme-isla.customize.yaml`: `name: "Isla (Acme)"` |
| X1 | New `_vortex/agents/acme-agent/SKILL.md` and `_gyre/agents/acme-gyre-agent.md` |
| S1 | New `.claude/skills/bmad-agent-bme-acme-coach/SKILL.md` |
| S2 | New `.claude/skills/acme-client-brief/SKILL.md` with `dependencies: [bmad-agent-pm]` |
| P1 | New `_bmad-output/project-context.md` |

The contract edits (K1/K2) could not be applied at 4.0.1 because `_vortex/contracts/` is not installed in 4.0.1. They were applied after the upgrade (§2.5).

| Label | cwd | Command | Exit | Result | Trimmed output |
|---|---|---|---|---|---|
| 25-doctor-401-before-register | `$W/acme-app` | `npx -p convoke-agents convoke-doctor` | 0 | OK | `Package version: 4.0.1`; `⚠ BMM dependencies: registry present / bmm-dependencies.csv not found` |

### 2.4 First real update: 4.0.1 → 4.0.2 (registry)

| Label | cwd | Command | Exit | Result | Trimmed output |
|---|---|---|---|---|---|
| 30-npm-install-latest | `$W/acme-app` | `npm install convoke-agents@latest` | 0 | OK | `changed 1 package`; the snapshot diff shows only `package.json` and `package-lock.json` changed |
| 31-update-dry-run | `$W/acme-app` | `npx -p convoke-agents convoke-update --dry-run` | 0 | OK | `From: 4.0.1 To: 4.0.2`, `No migration deltas needed — refreshing installation files.`, changelog, `DRY RUN — no changes will be made`. **No file list.** |
| 32-update-apply | `$W/acme-app` | `npx -p convoke-agents convoke-update --yes` | 0 | OK | Backup `_bmad-output/.backups/backup-4.0.1-<ts>` (4 items); `Skipped excluded Vortex agent: production-intelligence-specialist`; `Refreshed Vortex contracts`; `Refreshed standalone bme submodule: _team-factory`; `Updated Gyre config.yaml`; `Backed up ISLA-USER-GUIDE.md → .bak`; **`Removed stale skill: bmad-agent-bme-acme-coach`**; `Removed stale skill: bmad-agent-bme-production-intelligence-specialist`; `Created _bmad/_config/bmm-dependencies.csv (empty registry)`; post-upgrade gate: `⚠ [unregistered] acme-client-brief → bmad-agent-pm` |

The snapshot diff across update 1 (excluding `.backups`) showed 2 files removed (the two skill dirs above) and 42 changed. The changed files include every hand-edited Convoke file and `_team-factory/config.yaml`.

### 2.5 Registration, repeated updates, and BMAD updates

| Label | cwd | Command | Exit | Result | Trimmed output |
|---|---|---|---|---|---|
| 33-doctor-402-before-register | `$W/acme-app` | `npx -p convoke-agents convoke-doctor` | 0 | OK | `⚠ BMM dependencies: [unregistered] acme-client-brief → bmad-agent-pm` / `custom skill not in registry — future upgrades won't validate it` / `Or regenerate … convoke-audit-bmm-deps`; `_gyre config: 8 agents, 14 workflows` (see D2) |
| 34-register-help | `$W/acme-app` | `npx -p convoke-agents convoke-register-skill --help` | 0 | OK | Flags `--skill --agent --type [--source --email --yes --dry-run]` |
| 35-register-dry-run | `$W/acme-app` | `npx -p convoke-agents convoke-register-skill --skill acme-client-brief --agent bmad-agent-pm --type frontmatter --email pat@acme.example --dry-run` | 0 | OK | `Dry-run — row that would be written: {"skill_name":"acme-client-brief",…,"source_module":"unknown","registered_by":"pat@acme.example"…}`; CSV still header-only |
| 36-register | `$W/acme-app` | `npx -p convoke-agents convoke-register-skill --skill acme-client-brief --agent bmad-agent-pm --type frontmatter --email pat@acme.example` | 0 | OK | `✓ Registered: acme-client-brief → bmad-agent-pm (frontmatter)`; row `acme-client-brief,bmad-agent-pm,frontmatter,unknown,pat@acme.example,2026-09-14` |
| 37-doctor-402-after-register | `$W/acme-app` | `npx -p convoke-agents convoke-doctor` | 0 | OK | `✓ BMM dependencies: registry consistent / 0 auto-scan + 1 manual rows, no drift`; `All 29 checks passed.` |
| (direct) | `$W/acme-app` | K1: appended a marker to `_vortex/contracts/hc1-empathy-artifacts.md`; K2: new `_vortex/contracts/acme-handoff.md`; U2: marker in `EMMA-USER-GUIDE.md`; K3: marker in `_gyre/contracts/gc1-stack-profile.md`; K4: new `_gyre/contracts/acme-gyre-contract.md`; new `_portability/acme-note.md`, `_enhance/acme-note.md`; then set `_vortex/config.yaml` `version: 4.0.2` → `4.0.1` to reproduce a patch update | – | OK | |
| 40-update2-simulated | `$W/acme-app` | `npx -p convoke-agents convoke-update --yes` | 0 | OK | `From: 4.0.1 To: 4.0.2`, `Refreshed Vortex contracts`, `Refreshed Gyre contracts`, the `.bak` step for every guide, `BMM registry consistent — no drift` |
| 60-bmad-quick-update | `$W/acme-app` | `$W/tools/node_modules/.bin/bmad-method install --directory . --action quick-update --yes` | 0 | OK | `Custom files preserved: 315`. Snapshot diff: REMOVED 0; CHANGED only `_bmad/_config/{files-manifest.csv,manifest.yaml,skill-manifest.csv}`, `_bmad/bmm/config.yaml`, `_bmad/core/config.yaml`; ADDED `_bmad/bme/config.yaml`. `diff -r` of `_bmad/custom`: identical. |
| 81-doctor-wrapper-unregistered | `$W/acme-app` | `npx -p convoke-agents convoke-doctor` (after writing `.claude/skills/acme-isla/SKILL.md` exactly as on the page) | 0 | OK | `⚠ BMM dependencies: [unregistered] acme-isla → bmad-agent-bme-discovery-empathy-expert` |
| 82-register-wrapper | `$W/acme-app` | `npx -p convoke-agents convoke-register-skill --skill acme-isla --agent bmad-agent-bme-discovery-empathy-expert --type frontmatter --email pat@acme.example` | 0 | OK | `✓ Registered: acme-isla → bmad-agent-bme-discovery-empathy-expert (frontmatter)`, with no "Unrecognized BMM agent" warning |
| 83-doctor-wrapper-registered | `$W/acme-app` | `npx -p convoke-agents convoke-doctor` | 0 | OK | `0 auto-scan + 2 manual rows, no drift`; `All 28 checks passed.` (see O2) |
| (direct) | `$W/acme-app` | Set `version` → 4.0.1 again | – | OK | |
| 84-update3-simulated | `$W/acme-app` | `npx -p convoke-agents convoke-update --yes` | 0 | OK | `✓ Update completed successfully!`, `BMM registry consistent` |
| 85-bmad-quick-update-2 | `$W/acme-app` | `$W/tools/node_modules/.bin/bmad-method install --directory . --action quick-update --yes` | 0 | OK | `Custom files preserved: 316` |
| 86-resolve-config-after-updates | `$W/acme-app` | `python3 _bmad/scripts/resolve_config.py --project-root . --key core.document_output_language` | 0 | OK | `"French"` |
| 87-resolve-pm-after-updates | `$W/acme-app` | `python3 _bmad/scripts/resolve_customization.py --skill .claude/skills/bmad-agent-pm --key agent.principles` | 0 | OK | 3 defaults + `"Every requirement names the client stakeholder who asked for it."` (the output shown on the page) |
| 88-doctor-final | `$W/acme-app` | `npx -p convoke-agents convoke-doctor` | 0 | OK | `All 28 checks passed.` |
| (direct) | `$W/acme-app` | Template swap (cp + `_bmad/custom/bmad-product-brief.toml`); `version` → 4.0.1 | – | OK | |
| 111-update4-simulated | `$W/acme-app` | `npx -p convoke-agents convoke-update --yes` | 0 | OK | `✓ Update completed successfully!` |
| 112-bmad-quick-update-3 | `$W/acme-app` | `$W/tools/node_modules/.bin/bmad-method install --directory . --action quick-update --yes` | 0 | OK | `Quick update complete!`. `diff -r` of `_bmad/custom` (incl. template): identical. |
| 113-resolve-brief-template-after | `$W/acme-app` | `python3 _bmad/scripts/resolve_customization.py --skill .claude/skills/bmad-product-brief --key workflow.brief_template` | 0 | OK | Unchanged custom path |
| (direct) | `$W/acme-app` | Local-only `git config user.name/email`; `.gitignore` = `node_modules/`; commit baseline; append a marker to `hypothesis-engineer/SKILL.md` and commit; `version` → 4.0.1 and commit | – | OK | |
| 120-update5-simulated | `$W/acme-app` | `npx -p convoke-agents convoke-update --yes` | 0 | OK | `✓ Update completed successfully!` |
| 121-git-status-after-update | `$W/acme-app` | `git status --short -- _bmad .claude` | 0 | OK | `M _bmad/_config/skill-manifest.csv`, `M _bmad/bme/_vortex/agents/hypothesis-engineer/SKILL.md`, `M _bmad/bme/_vortex/config.yaml` |
| 122-git-diff-after-update | `$W/acme-app` | `git diff -- _bmad/bme/_vortex/agents` | 0 | OK | `-<!-- ACME-EDIT-3 -->` |
| 123-git-diff-bme | `$W/acme-app` | `git diff -- _bmad/bme` | 0 | OK | The same removed line, plus `-version: 4.0.1 / +version: 4.0.2` |
| 124-git-commit-before-update | `$W/acme-app` | `git add -A && git commit -m "Before Convoke update"` | 0 | OK | Commit created |

**Basis for "simulated" updates.** Updates 2–5 lower the Vortex `version` field back to 4.0.1 so that `convoke-update` takes its real `refresh-only` path (backup → `refreshInstallation()` → validate → governance gate) with 4.0.2 code. This is exactly what a future 4.0.2 → 4.0.x patch update without migrations executes. Only update 1 crossed a real published version boundary.

### 2.6 Trap tests (on the copy)

| Label | cwd | Command | Exit | Result | Trimmed output |
|---|---|---|---|---|---|
| (direct) | `$W` | `cp -R acme-app acme-audit-copy`; new `.claude/skills/acme-risk-log/SKILL.md` with `dependencies: [bmad-agent-architect]` | – | OK | |
| 50-copy-audit-bmm-deps | `$W/acme-audit-copy` | `npx -p convoke-agents convoke-audit-bmm-deps` | 0 | OK (trap shown) | `Wrote 1 auto-scan + 1 manual rows`; row `acme-risk-log,bmad-agent-architect,frontmatter,unknown,auto-scan,2026-09-14` |
| 51-copy-doctor-after-audit | `$W/acme-audit-copy` | `npx -p convoke-agents convoke-doctor` | 0 | OK (trap shown) | `1 auto-scan + 1 manual rows, no drift`; `All 29 checks passed.` The warning is silenced. |
| 52-copy-register-after-audit | `$W/acme-audit-copy` | `npx -p convoke-agents convoke-register-skill --skill acme-risk-log --agent bmad-agent-architect --type frontmatter --email pat@acme.example` | 1 | NEG-OK | `✗ Duplicate triple: acme-risk-log/bmad-agent-architect/frontmatter already registered by auto-scan on 2026-09-14.` |
| 53-copy-doctor-agent-removed | `$W/acme-audit-copy` | `rm -rf .claude/skills/bmad-agent-pm` then `npx -p convoke-agents convoke-doctor` | 0 | OK (limit shown) | `no drift`; `All 29 checks passed.` A dependency on a missing agent goes unnoticed. |
| 61-export-after-bmad-update | `$W/acme-app` | `npx -p convoke-agents convoke-export bmad-agent-bme-contextualization-expert --output $W/export-test-a` | 2 | N/A | `not in the manifest` (see O1) |
| 62-export-before-bmad-update | `$W/acme-audit-copy` | the same command, with `--output $W/export-test-b` | 2 | N/A | The same (see O1) |

### 2.7 Standalone project, packed working tree

| Label | cwd | Command | Exit | Result | Trimmed output |
|---|---|---|---|---|---|
| 70-solo-init | `$W/solo-app` | `npm init -y >/dev/null && echo ok` | 0 | OK | |
| 71-solo-npm-install-tarball | `$W/solo-app` | `npm install $W/pack/convoke-agents-4.0.2.tgz` | 0 | OK | `added 14 packages` |
| 72-solo-convoke-install | `$W/solo-app` | `npx -p convoke-agents convoke-install` | 0 | OK | `✓ All files installed successfully`. `_gyre/config.yaml`: `submodule_name: _vortex`, `output_folder: '{project-root}/_bmad-output/vortex-artifacts'` (D1). `_vortex/config.yaml`: no `user_name` or `communication_language` (D3). |
| (direct) | `$W/solo-app` | Appended `user_name: Sam`, `communication_language: English`; markers in Emma's SKILL.md and EMMA guide | – | OK | |
| 73-solo-update-up-to-date | `$W/solo-app` | `npx -p convoke-agents convoke-update --yes` | 0 | OK | `✓ Already up to date! (v4.0.2)`; the edit is still present (count 1). Nothing is re-applied. |
| 74-solo-reinstall | `$W/solo-app` | `npx -p convoke-agents convoke-install` | 0 | OK | Agent edit count 0 and guide edit count 0, with **no `.bak`** (installer passes `backupGuides:false`) and no `.backups`; `user_name: Sam` kept |
| (direct) | `$W/solo-app` | New `.claude/skills/{bmad-enhance-acme,bmad-acme-notes,acme-notes}/SKILL.md`, each with `dependencies: [bmad-agent-pm]` | – | OK | |
| 100-solo-doctor-prefixes | `$W/solo-app` | `npx -p convoke-agents convoke-doctor` | 0 | OK | `[unregistered] acme-notes`; **`[drift] bmad-acme-notes`** and **`[drift] bmad-enhance-acme`**, each with `Run: … convoke-audit-bmm-deps to sync` |
| (direct) | `$W/solo-app` | `excluded_agents: [learning-decision-expert]` | – | OK | |
| 101-solo-reinstall-exclude | `$W/solo-app` | `npx -p convoke-agents convoke-install` | **1** | **DEFECT** (D4) | `Skipped excluded Vortex agent: learning-decision-expert`, `Removed stale skill: bmad-agent-bme-learning-decision-expert`, **`Removed orphan skill wrapper: bmad-enhance-acme`**, `✗ Max skill - MISSING`, `Installation verification failed. Some files are missing.` `bmad-acme-notes` and `acme-notes` survive. |
| 102-solo-doctor-after-exclude | `$W/solo-app` | `npx -p convoke-agents convoke-doctor` | 0 | OK | `6 agents present (1 excluded: learning-decision-expert)`, `11 agent skill wrappers verified (1 excluded)` |
| (direct) | `$W/solo-app` | `excluded_agents: []` | – | OK | |
| 103-solo-reinstall-reinclude | `$W/solo-app` | `npx -p convoke-agents convoke-install` | 0 | OK | `Refreshed agent: learning-decision-expert/SKILL.md`, `Refreshed skill: bmad-agent-bme-learning-decision-expert/SKILL.md`; the skill dir is back |
| (direct) | `$W/fresh-check` | `npm init -y && npm install $W/pack/convoke-agents-4.0.2.tgz && npx -p convoke-agents convoke-install` | 0 | OK | `grep -nE '^(user_name\|communication_language\|output_folder\|party_mode_enabled)'` finds only `output_folder` in `_vortex/config.yaml` and `_gyre/config.yaml`, and both point at `vortex-artifacts` |

### 2.8 BMAD version update: 6.10.0 → 6.12.0

| Label | cwd | Command | Exit | Result | Trimmed output |
|---|---|---|---|---|---|
| 90-tools-bmad-610 | `$W/tools610` | `npm init -y >/dev/null && npm install bmad-method@6.10.0` | 0 | OK | `added 99 packages` |
| 91-bump-init | `$W/bump-app` | `npm init -y >/dev/null && git init -q && echo ok` | 0 | OK | |
| 92-bump-bmad-610-install | `$W/bump-app` | `$W/tools610/node_modules/.bin/bmad-method install --directory . --modules bmm --tools claude-code --user-name Pat --yes` | 0 | OK | `BMad Core Module (v6.10.0, installed)` |
| 93-bump-convoke-install | `$W/bump-app` | `npm install $W/pack/convoke-agents-4.0.2.tgz && npx -p convoke-agents convoke-install` | 0 | OK | `✓ All files installed successfully` |
| (direct) | `$W/bump-app` | Copied the PM team and user overrides and `acme-isla` from `acme-app`; appended `[core] document_output_language = "French"` to `_bmad/custom/config.toml` | – | OK | |
| 94-bump-bmad-update-to-612 | `$W/bump-app` | `$W/tools/node_modules/.bin/bmad-method install --directory . --action update --yes` | 0 | OK | `BMad Core Module (v6.10.0 → v6.12.0)`, `Custom files preserved: 308`. `diff -r _bmad/custom`: identical. `acme-isla` kept. 12 `bmad-agent-bme-*` dirs intact. **Removed** `.claude/skills/bmad-agent-tech-writer/` (6 files) and `bmad-check-implementation-readiness/` (9 files). Of the 37 `customize.toml` present before the update, 20 changed, 2 were removed, and 15 were unchanged. All 15 unchanged ones are skills absent from a fresh 6.12.0 install (left in place). `_bmad/config.toml` and both resolver scripts changed. No path under `_bmad/bme/_vortex`, `_bmad/custom` or `.claude/skills/acme-*` changed. |
| 95-bump-list-orphan-override | `$W/bump-app` | `python3 .claude/skills/bmad-customize/scripts/list_customizable_skills.py --project-root .` (with `_bmad/custom/bmad-agent-tech-writer.toml` present) | 0 | OK (limit shown) | `errors: []`; `"tech-writer" in output: False`. The orphaned override is not reported. |

---

## 3. Page commands → proof

Checked mechanically. Every line inside a ```` ```bash ```` block on the page was extracted and matched **verbatim** against `cmd:` lines in `_index.log` with exit 0. The result was `ALL PAGE COMMANDS EXECUTED VERBATIM WITH EXIT 0: True | commands: 15`. Every run was from a project root, which is the reader's directory.

| Page command | Proving run(s) |
|---|---|
| `python3 .claude/skills/bmad-customize/scripts/list_customizable_skills.py --project-root .` | 20, 95 |
| `python3 _bmad/scripts/resolve_customization.py --skill .claude/skills/bmad-agent-pm --key agent.principles` | 87 |
| `cp .claude/skills/bmad-product-brief/assets/brief-template.md _bmad/custom/bmad-product-brief-template.md` | 126 (and direct run in `acme-app`) |
| `python3 _bmad/scripts/resolve_customization.py --skill .claude/skills/bmad-product-brief --key workflow.brief_template` | 110, 113 |
| `python3 _bmad/scripts/resolve_config.py --project-root . --key core` | 80 |
| `npx -p convoke-agents convoke-doctor` | 25, 33, 37, 81, 83, 88, 100, 102 |
| `npx -p convoke-agents convoke-register-skill … acme-client-brief … --dry-run` | 35 |
| `npx -p convoke-agents convoke-register-skill … acme-client-brief …` | 36 |
| `npx -p convoke-agents convoke-register-skill … acme-isla …` | 82 |
| `git add -A && git commit -m "Before Convoke update"` | 124 |
| `npm install convoke-agents@latest` | 30 |
| `npx -p convoke-agents convoke-update --dry-run` | 31 |
| `npx -p convoke-agents convoke-update --yes` | 32, 40, 84, 111, 120 |
| `git status --short -- _bmad .claude` | 121 |
| `git diff -- _bmad/bme` | 123 |

Inline mentions in prose: `--key agent.menu` → 22; `convoke-audit-bmm-deps` → 50 (it succeeds, and the page warns against using it for your own skills).

**Deliberately kept off the page because they failed:** the resolver against Convoke agents (23, 24); `convoke-install` with `excluded_agents` set (101), which the page describes only as "re-running the installer" with no command; `convoke-export` (61, 62). The BMAD installer runs used a scratch-local binary (`$W/tools/.../bmad-method`); `npx bmad-method install` itself was never executed, so the page describes BMAD's update in prose only.

---

## 4. Survives-update results

Legend:

- **CU**: `convoke-update` (update 1 = real 4.0.1 → 4.0.2; updates 2–5 = refresh-only).
- **BQ**: BMAD quick-update 6.12.0.
- **BV**: BMAD 6.10.0 → 6.12.0.
- **CI**: re-running `convoke-install`.

Kept/lost was checked by `grep` for the marker, `diff -r` against a pre-copy, or a sha1 snapshot diff.

| Customisation | Where | CU | BQ | BV | Notes |
|---|---|---|---|---|---|
| BMAD agent team + user override (`bmad-agent-pm.toml`, `.user.toml`) | `_bmad/custom/` | **Kept** ×5 | **Kept** ×3 | **Kept** | `diff -r` identical; resolver 87 still merges |
| Template swap (`bmad-product-brief.toml` + template file) | `_bmad/custom/` | **Kept** | **Kept** | – | 111/112 → 113 |
| Central config pin (`[core] document_output_language`) | `_bmad/custom/config.toml` | **Kept** | **Kept** | **Kept** | 86 |
| Override for a skill BMAD then removed | `_bmad/custom/bmad-agent-tech-writer.toml` | – | – | File kept, **no effect**, not reported | 94, 95 |
| Edit to a skill's own `customize.toml` | `.claude/skills/*/customize.toml` | – | – | **Overwritten** (20 of 20 still-shipped files changed) | 94 |
| Vortex `user_name`, `communication_language`, `output_folder`, `party_mode_enabled`, custom key, comment, extra `workflows:` entry | `_vortex/config.yaml` | **Kept** ×5 | **Kept** | – | Final file checked after 120; `version` re-stamped |
| `excluded_agents` | `_vortex/config.yaml` | **Kept + applied** | **Kept** | – | Agent not refreshed, guide not refreshed, wrapper removed; agent dir left on disk |
| Re-include an excluded agent | `_vortex/config.yaml` | – | – | – | CI restored agent, guide and wrapper (103). Same `refreshInstallation()` as CU. |
| Gyre `user_name`, `communication_language`, `output_folder` | `_gyre/config.yaml` | **Kept** | **Kept** | – | `agents`/`workflows` lists duplicated (D2) |
| Team Factory `user_name` | `_team-factory/config.yaml` | **Lost**: reset to `'{user}'` | – | – | Reproduces backlog I138 end to end |
| Enhance config comment | `_enhance/config.yaml` | **Lost** | – | – | |
| Own file in `_enhance/` | `_enhance/acme-note.md` | **Kept** | – | – | Copy without remove |
| Own file in `_portability/` | `_portability/acme-note.md` | **Lost** | – | – | Remove then copy |
| Vortex agent edit (Isla, Liam) | `_vortex/agents/*/SKILL.md` | **Lost**; copy in `.backups/` | – | – | `git diff` shows it (123) |
| Vortex agent edit via re-install | `_vortex/agents/…` | – | – | – | CI **lost**, **no backup** (74) |
| Gyre agent edit | `_gyre/agents/stack-detective.md` | **Lost**, no copy anywhere | – | – | `grep -rl` found 0 copies |
| Own agent dir/file inside a module | `_vortex/agents/acme-agent/`, `_gyre/agents/acme-gyre-agent.md` | **Kept** | – | – | No wrapper is generated; not recommended |
| Vortex workflow edit | `_vortex/workflows/lean-persona/workflow.md` | **Lost**; copy in `.backups/` | – | – | |
| Own workflow dir | `_vortex/workflows/acme-discovery-sprint/` | **Kept** | – | – | |
| Vortex guide edit | `ISLA-USER-GUIDE.md` | **Lost**; `.bak` kept after update 1, **`.bak` lost after update 2** | – | – | |
| Vortex contract edit / own contract | `_vortex/contracts/` | **Lost** / **Lost** | – | – | No backup |
| Gyre contract edit / own contract | `_gyre/contracts/` | **Lost** / **Kept** | – | – | Copy without remove |
| Legacy stub edit | `_bmad/_config/agents/bme-isla.customize.yaml` | **Kept** | – | – | Inert: nothing reads it (C9) |
| Custom skill, own prefix | `.claude/skills/acme-client-brief/`, `acme-isla/` | **Kept** | **Kept** | **Kept** (`acme-isla`) | |
| Custom skill, `bmad-agent-bme-` prefix | `.claude/skills/bmad-agent-bme-acme-coach/` | **Deleted** | – | – | 32 |
| Custom skill, `bmad-enhance-` prefix | `.claude/skills/bmad-enhance-acme/` | – | – | – | CI **deleted** (101) |
| Custom skill, other `bmad-` prefix | `.claude/skills/bmad-acme-notes/` | – | – | – | CI kept; doctor misclassifies as `[drift]` (100) |
| Registry rows | `_bmad/_config/bmm-dependencies.csv` | **Kept** | **Kept** | – | `diff` identical after 84 + 85 |
| `project-context.md` | `_bmad-output/` | **Kept** | **Kept** | – | |

---

## 5. Defects and observations found along the way

None of these were filed. Nothing in the repo was changed except the two draft files.

| ID | What | Reproduce | Page impact |
|---|---|---|---|
| D1 | **A fresh install writes Vortex values into `_gyre/config.yaml`** (`submodule_name: _vortex`, Vortex description, `output_folder: …/vortex-artifacts`). `mergeConfig` seeds Vortex-specific defaults when the Gyre target doesn't exist. Practical impact is low: Gyre agents load `output_folder` as a session variable, but `grep -rn '{output_folder}' _bmad/bme/_gyre/workflows` returns 0 hits. Gyre writes to `.gyre/` (86 references) and one literal `_bmad-output/gyre-artifacts/`. Not found in the backlog by grep. | 72, `$W/fresh-check` | The page says it looks wrong but no Gyre workflow reads the value |
| D2 | **Every update duplicates Gyre's `agents:` and `workflows:` lists** (4 → 8 agents, 7 → 14 workflows). Gyre IDs are not in the Vortex `AGENT_IDS`, so `mergeConfig` treats them as user-added. The deduped Set keeps it at 2× rather than growing. `convoke-doctor` reports `8 agents present` as healthy. | 33 | Not mentioned |
| D3 | **A fresh install writes no `user_name` or `communication_language`** to `_vortex/config.yaml`, yet Isla, Liam, Noah and Max require both and stop with a config error when either is missing. The installer tells users to "replace `{user}`", a placeholder that isn't in the file. | 72, `$W/fresh-check` | The page tells readers to add the keys |
| D4 | **`convoke-install` exits 1 with `✗ <agent> skill - MISSING` whenever `excluded_agents` is set.** `verifyInstallation()` ignores exclusions (C8), while the refresh itself applied them correctly and the doctor agrees. | 101 | The page warns in prose and gives no command |
| D5 | **I138 reproduced end to end:** Team Factory `user_name` resets to `'{user}'` on update, and the Enhance config is replaced. The backlog row says "Not yet reproduced end-to-end". | 32 | Listed under "can't customise" |
| D6 | **The doctor's `[unregistered]` fix suggests `convoke-audit-bmm-deps`**, which stamps the custom skill `auto-scan`, silences the warning, and makes `convoke-register-skill` fail on a duplicate. This is the same failure `seedBmmDependencies()`'s comment documents for the installer. | 33, 50–52 | The page warns |
| D7 | **Registration doesn't detect a vanished `bmm_agent`** (C11). | 53 | The page warns |
| D8 | **The `bmad-*` custom-skill prefix is misclassified as first-party `[drift]`**, and the doctor recommends the audit tool for it. | 100 | The page says avoid `bmad-` |
| D9 | **Emma, Mila and Wade load config "via bmad-init skill"**, which BMAD 6.12.0 doesn't install (`find` over the scratch project finds no `bmad-init`; the repo's own 6.10 tree has only `.bak` files). What those agents read instead can't be verified without running a model. | code + `find` | The page marks this as unverified |
| D10 | **`compat-preflight` and the installer print "BMAD core not detected" and "BMAD Method not detected"** on a project with BMAD 6.12.0 installed. They look for `_bmad/_config/bmad.yaml` and a node_modules package. | 13, 31 | Not mentioned |
| D11 | **`convoke-update --dry-run` on the refresh-only path lists no files.** | 31 | The page gives the git recipe instead |
| D12 | **Refresh creates `_bmad/_config/agents/bme-*.customize.yaml` stubs that nothing reads** (C9). They invite edits that do nothing. | code; Y1 kept but inert | Not mentioned; possibly worth a line later |
| O1 | `convoke-export bmad-agent-bme-contextualization-expert` fails with `not in the manifest` in a project where BMAD created `skill-manifest.csv` before Convoke was installed. Convoke seeds only when the manifest is absent or unusable, and BMAD's quick-update rewrites it without `bme` rows. Out of scope for this page. | 61, 62 | None |
| O2 | After a BMAD quick-update rewrote `skill-manifest.csv`, the doctor's `_enhance skill wrappers` check disappears from the output (29 → 28 checks) rather than failing. | 37 vs 83 | None |
| O4 | **Vortex applies `output_folder` in two conventions plus literals.** Among files under `_bmad/bme/_vortex/{workflows,agents}` (repo, 2026-09-15): 22 use `{output_folder}/<file>`, 26 use `{output_folder}/vortex-artifacts/<file>`, and 19 contain the literal `_bmad-output/vortex-artifacts/`. Some files fall in more than one group. With the default value (`…/_bmad-output/vortex-artifacts`), the second convention resolves to `vortex-artifacts/vortex-artifacts/`. | `grep -rl` counts | The page warns before moving `output_folder`; "Where artifacts are written" is listed as not customisable |
| O3 | BMAD's 6.10.0 → 6.12.0 update leaves 15 skills it no longer ships in `.claude/skills/` (e.g. `bmad-create-prd`, `bmad-quick-dev`) but removes `bmad-agent-tech-writer` and `bmad-check-implementation-readiness`. | 94 | The page mentions the two removals |
