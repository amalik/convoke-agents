# Customize Convoke without forking

This page is for projects where Convoke is installed from npm (`convoke-agents`), usually next to BMAD Method. It tells you where each kind of change belongs, whether that change survives an update, and where no supported place exists yet.

> **Last verified:** 2026-09-15, against `convoke-agents` 4.0.2 and BMAD Method 6.12.0, including an update from BMAD Method 6.10.0. Every command below was run from the project root of a scratch project and succeeded.

---

## Why not fork

A fork freezes Convoke on the day you cloned it. After that, every fix and every new agent is a merge you do by hand, and the improvements you make stay in your copy where nobody else can use them. Most of what practitioners fork for has a supported place that updates leave alone, and this page shows you each one, including the cases where no such place exists.

## The one rule: know who owns each path

An update rewrites the paths it owns, so keep your changes in paths you own.

| Path | Owner | What an update does to it |
|---|---|---|
| `_bmad/custom/` | **You** | Nothing. Convoke never writes there, and BMAD's installer left it byte-identical in every test. |
| `.claude/skills/<your-prefix>-*` | **You** | Nothing. |
| `_bmad/_config/bmm-dependencies.csv` | **You** (Convoke only creates it if missing) | Your rows are kept. |
| `_bmad-output/` | **You** | Your files are left alone. Convoke adds its own folders there: `.backups/` and `vortex-artifacts/`. |
| `_bmad/bme/` | Convoke | Mostly **replaced**. Only the Vortex and Gyre `config.yaml` files are merged. |
| `.claude/skills/bmad-agent-bme-*`, `.claude/skills/bmad-enhance-*` | Convoke | **Regenerated.** Names Convoke doesn't recognise are **deleted**. |
| The rest of `_bmad/`, and BMAD's `.claude/skills/bmad-*` | BMAD Method | Replaced by BMAD's installer. |

---

## Decision table

"Survives" means the change was still in effect after `convoke-update` **and** after BMAD's installer ran an update.

| I want to… | Use | Survives an update? |
|---|---|---|
| Give a BMAD agent standing facts, extra principles, or a different tone | `_bmad/custom/<skill>.toml` (team) or `<skill>.user.toml` (personal) | **Yes** |
| Add or replace an item on a BMAD agent's menu | `[[agent.menu]]` in the same file, matched by `code` | **Yes** |
| Point a BMAD workflow at your own template | The workflow's template setting in `_bmad/custom/<skill>.toml`, plus your template file in `_bmad/custom/` | **Yes**, but only for workflows that expose a template setting |
| Pin a BMAD-wide setting, such as document language | `_bmad/custom/config.toml` | **Yes** |
| Set your name and language for Vortex and Gyre agents | `_bmad/bme/_vortex/config.yaml`, `_bmad/bme/_gyre/config.yaml` | **Yes** (see which agents read it) |
| Stop installing Convoke agents you don't use | `excluded_agents` in that team's `config.yaml` | **Yes** |
| Add your own skill or workflow alongside Convoke | `.claude/skills/<your-prefix>-<name>/`, registered with `convoke-register-skill` | **Yes** |
| Add rules or context on top of a Convoke agent | Your own wrapper skill that loads the agent, then adds your rules | **Yes** for the file. The rules are layered on top, not merged in. |
| Give Emma, Mila and Wade project-wide rules | `project-context.md` | **Yes**. The other Convoke agents don't read it. |
| Change a Convoke agent's persona, principles or menu | No supported surface. See [what you can't customise](#what-you-still-cant-customise-without-forking). | **No**: agent files are replaced |
| Edit a Convoke workflow step, template, handoff contract or user guide in place | No supported surface | **No**: replaced, and only some of these are backed up |
| Set your name for Team Factory, or change Enhance settings | No supported surface | **No**: reset on every update |

---

## 1. Tune BMAD agents and workflows: `_bmad/custom/`

BMAD skills that ship a `customize.toml` read override files from `_bmad/custom/` when they activate. **No Convoke agent ships a `customize.toml`, so this layer does not reach Emma, Isla, or any other Convoke agent.** It does reach the BMAD agents and workflows your Convoke work hands off to, such as the product manager, the architect and PRD creation.

To see which skills you can customise, run:

```bash
python3 .claude/skills/bmad-customize/scripts/list_customizable_skills.py --project-root .
```

The output is JSON with an `agents` list and a `workflows` list. It needs Python 3.11 or later. You can also ask BMAD's `bmad-customize` skill to write the override for you.

### Team and personal overrides

| File | Scope | Git |
|---|---|---|
| `_bmad/custom/bmad-agent-pm.toml` | The whole team | Commit it |
| `_bmad/custom/bmad-agent-pm.user.toml` | Just you | Ignored by `_bmad/custom/.gitignore` |

Keep override files sparse. Include only the fields you are changing. Here is a team file for the product manager:

```toml
# _bmad/custom/bmad-agent-pm.toml
[agent]
persistent_facts = [
  "Engagements are fixed-scope. Flag any requirement that implies a change request.",
  "file:{project-root}/docs/client-glossary.md",
]
principles = ["Every requirement names the client stakeholder who asked for it."]

[[agent.menu]]
code = "CB"
description = "Draft a one-page client brief from the engagement notes"
prompt = "Read {project-root}/docs/engagement-notes.md and draft a one-page client brief."
```

And a personal file that changes the tone and replaces one existing menu item:

```toml
# _bmad/custom/bmad-agent-pm.user.toml
[agent]
communication_style = "Brief and direct. Bullet points over paragraphs."

[[agent.menu]]
code = "CE"
description = "Create epics and stories using the Acme story template"
skill = "bmad-create-epics-and-stories"
```

### How the layers merge

The skill's own `customize.toml` loads first, then your team file, then your personal file. Each layer merges into the one before it:

| Kind of value | Examples | Effect of your override |
|---|---|---|
| Single value | `icon`, `role`, `communication_style`, a template path | Replaces the default |
| List | `persistent_facts`, `principles`, `activation_steps_prepend`, `activation_steps_append` | Appends your entries to the default list |
| List of tables where every item has a `code` (or every item has an `id`) | `[[agent.menu]]` | An item with a matching `code` replaces the default in place. An item with a new `code` is appended. |

Tables merge key by key. **An override can't delete a default item.** It can only add items or replace them.

### Check the result before you rely on it

```bash
python3 _bmad/scripts/resolve_customization.py --skill .claude/skills/bmad-agent-pm --key agent.principles
```

```json
{
  "agent.principles": [
    "PRDs emerge from user interviews, not template filling.",
    "Ship the smallest thing that validates the assumption.",
    "User value first; technical feasibility is a constraint.",
    "Every requirement names the client stakeholder who asked for it."
  ]
}
```

With `--key agent.menu`, the output shows `CE` replaced in its original position and `CB` added at the end.

### Swap a workflow template

Some BMAD workflows expose their template as a setting. Look for a `*_template` key in the skill's `customize.toml`. To use your own template, copy the default into `_bmad/custom/`, edit the copy, and point the setting at it:

```bash
cp .claude/skills/bmad-product-brief/assets/brief-template.md _bmad/custom/bmad-product-brief-template.md
```

```toml
# _bmad/custom/bmad-product-brief.toml
[workflow]
brief_template = "{project-root}/_bmad/custom/bmad-product-brief-template.md"
```

```bash
python3 _bmad/scripts/resolve_customization.py --skill .claude/skills/bmad-product-brief --key workflow.brief_template
```

### Pin a BMAD-wide setting

`_bmad/config.toml` belongs to the installer and is regenerated on every install. To pin a value, put it in `_bmad/custom/config.toml` instead (or `config.user.toml` for a personal value):

```toml
# _bmad/custom/config.toml
[core]
document_output_language = "French"
```

```bash
python3 _bmad/scripts/resolve_config.py --project-root . --key core
```

This file configures BMAD, not Convoke. Convoke's agents aren't listed in it.

### Two traps

- **Don't edit `customize.toml` itself.** Its header says `DO NOT EDIT -- overwritten on every update`. In testing, BMAD's 6.10.0 → 6.12.0 update overwrote every `customize.toml` that 6.12.0 still ships.
- **An override for a skill BMAD removes stops working without any warning.** BMAD Method 6.12.0 removed `bmad-agent-tech-writer` and `bmad-check-implementation-readiness`. An override file for either one stays in `_bmad/custom/` and has no effect. The listing command above doesn't mention it either. After a BMAD update, run the listing command again and check that every override you rely on still has a matching skill.

---

## 2. Set your name and language for Vortex and Gyre

Edit `_bmad/bme/_vortex/config.yaml` and `_bmad/bme/_gyre/config.yaml`. These are the only two files under `_bmad/bme/` that `convoke-update` merges instead of replacing.

**A fresh install doesn't write your name or language.** Add the keys yourself. The installer's message tells you to "replace `{user}`", but no `{user}` placeholder appears in these files.

```yaml
# _bmad/bme/_vortex/config.yaml (add or change these)
user_name: Pat
communication_language: French
party_mode_enabled: false
```

The following changes survived five consecutive updates in testing:

- `user_name`, `communication_language`, `output_folder`, `party_mode_enabled`
- `excluded_agents` (see below)
- Extra entries you add to `workflows:`
- Keys of your own, and your comments

The `version` field is re-stamped on every update.

Who reads these settings:

- **Isla, Liam, Noah, Max, and all four Gyre agents** read their team's `config.yaml` directly when they start, and they require `user_name`, `communication_language` and `output_folder` to be present.
- **Emma, Mila and Wade** load settings through a `bmad-init` step, but BMAD Method 6.12.0 doesn't install `bmad-init`. It hasn't been verified whether these three agents pick up the values in this file.

**`output_folder` survives updates, but think twice before moving it.**

- Vortex honours it unevenly. Some workflows write to `{output_folder}/…`, others to `{output_folder}/vortex-artifacts/…`, and some steps look for their inputs at the literal path `_bmad-output/vortex-artifacts/`. If you change it, check where artifacts actually land and where the next workflow looks for them.
- Gyre's workflows write to fixed locations (`.gyre/` and `_bmad-output/gyre-artifacts/`), not to `output_folder`. A fresh install also puts Vortex's folder in `_bmad/bme/_gyre/config.yaml`. That looks wrong, but no Gyre workflow reads the value.

**Team Factory is different.** `_bmad/bme/_team-factory/` is replaced on every update, so a `user_name` you set there resets to `'{user}'`.

---

## 3. Switch off agents you don't use: `excluded_agents`

```yaml
# _bmad/bme/_vortex/config.yaml
excluded_agents:
  - production-intelligence-specialist
```

At your next update, Convoke skips that agent's files and user guide, removes its `/bmad-agent-bme-…` skill, and keeps the exclusion in place from then on. To bring the agent back, delete it from the list, and the next update restores it.

Re-running the installer applies an exclusion immediately, but the installer's final check doesn't account for exclusions, so it reports `Installation verification failed`. `npx -p convoke-agents convoke-doctor` shows the real state, for example `6 agents present (1 excluded: …)`.

---

## 4. Add your own skill alongside Convoke

Put it in `.claude/skills/<your-prefix>-<name>/SKILL.md`, and **choose a prefix that isn't `bmad-`**:

- Convoke's refresh, which runs during both `convoke-update` and the installer, **deletes** any `.claude/skills/bmad-agent-bme-*` or `.claude/skills/bmad-enhance-*` directory it doesn't recognise. Both cases were verified.
- Convoke's health check treats any other `bmad-*` name as BMAD's own skill, so the warning it prints for that skill points you at the wrong fix.

If your skill hands work to an agent, declare that in the frontmatter:

```markdown
---
name: acme-client-brief
description: Drafts a one-page client brief from engagement notes. Use when the user says "client brief".
dependencies:
  - bmad-agent-pm
---
```

Convoke's health check notices a custom skill with a dependency that hasn't been registered yet:

```bash
npx -p convoke-agents convoke-doctor
```

```text
  ⚠ BMM dependencies: [unregistered] acme-client-brief → bmad-agent-pm
    custom skill not in registry — future upgrades won't validate it
```

Register it. Preview the row first, then write it:

```bash
npx -p convoke-agents convoke-register-skill --skill acme-client-brief --agent bmad-agent-pm --type frontmatter --email pat@acme.example --dry-run
npx -p convoke-agents convoke-register-skill --skill acme-client-brief --agent bmad-agent-pm --type frontmatter --email pat@acme.example
```

```text
  ✓ Registered: acme-client-brief → bmad-agent-pm (frontmatter)
```

Use your own identifier for `--email`. After registration, `convoke-doctor` reports `BMM dependencies: registry consistent`. The registry row is kept through Convoke updates and BMAD updates.

Three things to know:

- **Use `convoke-register-skill`, not `convoke-audit-bmm-deps`, even though the doctor's warning suggests the audit tool.** The audit tool records your skill as `auto-scan`. That silences the warning without anyone having reviewed the skill, and a later `convoke-register-skill` for the same skill then fails with `Duplicate triple`.
- **The `/bmad-register-skill` slash command isn't included in the npm package.** Use the CLI shown above.
- **Registration records the dependency but doesn't watch it.** If the agent your skill depends on disappears (for example, BMAD renames it), `convoke-doctor` still reports the registry as consistent. After a BMAD update, check your skills' dependencies yourself.

---

## 5. Layer your rules onto a Convoke agent

Convoke agents have no override layer, so the supported option is a small skill of your own that loads the agent and then adds your rules. Convoke's own `/bmad-agent-bme-…` skills are built the same way: a short file that loads the real agent.

```markdown
---
name: acme-isla
description: Isla, the Convoke discovery agent, with Acme engagement rules. Use when the user asks for "acme isla" or Acme discovery.
dependencies:
  - bmad-agent-bme-discovery-empathy-expert
---

1. Load `{project-root}/.claude/skills/bmad-agent-bme-discovery-empathy-expert/SKILL.md` and follow it exactly.
2. For the whole session, also apply these engagement rules:
   - Globex is a regulated client. Never write customer names or other personal data into artifacts.
   - Before any interview, confirm which Globex business unit is in scope.
```

Register it like any other custom skill:

```bash
npx -p convoke-agents convoke-register-skill --skill acme-isla --agent bmad-agent-bme-discovery-empathy-expert --type frontmatter --email pat@acme.example
```

You still get every Isla update, because the file you load is regenerated by Convoke, and your rules stay in a file Convoke never touches.

Be clear about what this can and can't do. It **adds** facts, constraints and style. It **can't** remove a menu item, rename a capability, or change a workflow step. It's also instruction layering, not a merge, and no resolver checks the result. The agent's own file tells the model to follow its instructions exactly, so try your rules with your model before depending on them.

For rules that apply to the whole project, **Emma, Mila and Wade** also load any `project-context.md` they find (for example `_bmad-output/project-context.md`). The other Convoke agents don't read it.

---

## 6. Before you update, find out what gets overwritten

`convoke-update --dry-run` shows the plan and the changelog, but it **doesn't list the files it will replace**. Git can show you. Commit first, then update:

```bash
git add -A && git commit -m "Before Convoke update"
npm install convoke-agents@latest
npx -p convoke-agents convoke-update --dry-run
npx -p convoke-agents convoke-update --yes
git status --short -- _bmad .claude
git diff -- _bmad/bme
```

Any hand edit inside `_bmad/bme/` shows up in the diff as a removed line, which you can copy back out.

Convoke's own safety nets are narrower than you might expect:

| What you edited | Where a copy survives |
|---|---|
| Vortex agents, Vortex workflows, Vortex `config.yaml` | `_bmad-output/.backups/backup-<version>-<timestamp>/` |
| Vortex user guides | `<GUIDE>.md.bak`, **one update deep**. The next update overwrites the `.bak`. |
| Gyre agents, handoff contracts, Enhance, Team Factory, Portability | **Nowhere.** Your edit is gone. |

---

## What you still can't customise without forking

These gaps are real. If one of them is why you forked, it's a good candidate to [send upstream](#when-you-need-a-change-in-the-core-upstream-it).

1. **A Convoke agent's persona, principles, menu or capabilities.** No Convoke agent has a `customize.toml`, and every update replaces the agent files. A wrapper skill can add to an agent, but it can't remove or rewrite anything.
2. **Convoke workflow steps, templates and handoff contracts (HC1–HC5, GC1–GC4).** Every update replaces them. You can copy a workflow into your own skill, but its steps load files by `{project-root}/_bmad/bme/…` paths, so the copy keeps running Convoke's current steps until you rewrite those paths. Once you do, that workflow is a fork and won't receive fixes.
3. **Team Factory and Enhance settings.** Both module folders are replaced wholesale on every update.
4. **Files you add inside `_bmad/bme/`.** Updates keep them in some folders and wipe them in others (`_vortex/contracts/` and `_portability/`, for example). Treat everything under `_bmad/bme/` as read-only.
5. **Removing a default from a BMAD skill.** Overrides can add or replace, never delete.
6. **BMAD workflow logic and step order.** Only the fields a skill's `customize.toml` exposes can be customised.
7. **Name and language for Emma, Mila and Wade.** Unverified, as described in [section 2](#2-set-your-name-and-language-for-vortex-and-gyre).
8. **Where artifacts are written.** Gyre ignores `output_folder`, and Vortex applies it unevenly (see [section 2](#2-set-your-name-and-language-for-vortex-and-gyre)).

---

## When you need a change in the core: upstream it

When a change belongs in Convoke itself (a better step, a corrected contract, or a setting you'd like to be customisable), contribute it upstream. It then survives every update, because it's part of the update. A short-lived GitHub fork opened to send a pull request isn't the kind of fork this page warns against.

1. **Open an issue first** at [github.com/amalik/convoke-agents/issues/new/choose](https://github.com/amalik/convoke-agents/issues/new/choose), using the *Feature request*, *Agent/Workflow Feedback* or *Bug report* template. Asking for a new customisation point, such as an override file for Convoke agents, is a legitimate feature request.
2. **Open a pull request against `main`** with CI green.
3. **Read [CONTRIBUTING.md](https://github.com/amalik/convoke-agents/blob/main/CONTRIBUTING.md) before your first change.** It links to the project rules reviewers enforce, requires a namespace decision for new skills, and asks you not to edit `CHANGELOG.md`.

While you wait for the change to land, keep your version in a wrapper skill or in a scoped copy under your own prefix. When upstream catches up, delete it.
