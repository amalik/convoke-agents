# Customize Convoke without forking

This page is for projects where Convoke is installed from npm (`convoke-agents`), usually next to BMAD Method. It tells you where each kind of change belongs, whether that change survives an update, and where no supported place exists yet.

> **Last verified:** 2026-09-15 against `convoke-agents` 4.0.2 and BMAD Method 6.12.0, including an update from BMAD Method 6.10.0, and re-checked against **4.0.3** on 2026-09-17 for the sections 4.0.3 changed (the configuration rows, and how the three converted agents read config). Every command below was run from the project root of a scratch project and succeeded.
>
> **4.0.3 published 2026-09-17** and is now `latest`, so `npm install convoke-agents` gives you 4.0.3 and the
> "from 4.0.3" column is the one that applies. Every behaviour this page predicted from source before the
> release was confirmed against the installed package on 17 September: both configs carry `user_name` and
> `communication_language`, the readiness config carries its own output folder, and both refusals land.

---

## Why not fork

A fork freezes Convoke on the day you cloned it. After that, every fix and every new agent is a merge you do by hand, and the improvements you make stay in your copy where nobody else can use them. Most of what practitioners fork for has a supported place that updates leave alone, and this page shows you each one, including the cases where no such place exists.

## Before you customise anything: change the knowledge, not the agent

Almost everyone reaches for the same thing in week one — open an agent and make it *ours*. Put the house
architecture in the developer agent, the client's vocabulary in the analyst, the stack conventions in the
reviewer. It works immediately, and it is the most expensive decision available to you on this page.

**The moment an agent carries your domain, you own that agent.** Not its behaviour — the agent itself, and
every future improvement to it, as a merge you do by hand. A generic agent is maintained by everybody: by
upstream BMAD, by Convoke, by every other organisation running it. A specialised one is maintained by you,
alone, forever. That is the same trade as forking, taken one file at a time, which is why it rarely feels
like a decision at all.

The alternative is to keep the agents generic and let them **read** what makes your work specific.

| You want | Don't | Do instead |
|---|---|---|
| The team's architecture standards applied | Edit the developer or architect agent | Write them as project rules the agents read (`project-context.md` is exactly this pattern — Convoke uses it on itself) |
| Domain vocabulary, business rules, product context | Rewrite agent personas | Keep them as knowledge artifacts in a path you own, and point the agents at them |
| Different tone, menus, or model settings | Copy the agent file | `_bmad/custom/` overrides — section 1 below |
| An agent that doesn't exist yet | Fork and add one | Your own skill alongside Convoke's — section 4 below |

Knowledge is meant to grow through a progression, and starting at the far end is its own mistake:
**markdown files → a wiki → retrieval → a graph.** Begin with files in a directory you own. Move up only when
the corpus itself becomes the bottleneck, not because the later form sounds more serious.

> **What Convoke does not yet give you.** Today that knowledge layer is markdown files and project rules,
> read by agents at run time. Convoke ships no inventory, no curation tooling, no retrieval and no graph —
> if you are running agents across many teams and repositories, that gap is real and you will feel it
> before we close it. We would rather you plan around it than discover it.

Everything below assumes you have already made this call. The rest of the page is about *where a change
belongs* once you have decided it belongs in a file you own.

---

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
| `.claude/skills/bmad-migrate-artifacts`, `bmad-portfolio-status`, `bmad-export-skill`, `bmad-generate-catalog`, `bmad-seed-catalog`, `bmad-validate-exports` | Convoke | **Regenerated.** These six carry BMAD's `bmad-` prefix but are Convoke's, written by Convoke's installer. Delete one and it comes back on the next install. |
| `_bmad/_config/agent-manifest.csv`, `skill-manifest.csv`, `taxonomy.yaml` | Convoke writes these, inside BMAD's directory | Regenerated. `agent-manifest.csv` has its `bme` rows rewritten and other modules' rows preserved. (`bmm-dependencies.csv` lives here too and is **yours** — see the row above.) |
| The rest of `_bmad/`, and BMAD's own `.claude/skills/bmad-*` | BMAD Method | Replaced by BMAD's installer. |

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
| Give Emma, Mila and Wade project-wide rules | `project-context.md` | **Unreliably.** These three have no dependable way to read project files at startup — measured 1 run in 4 (`T183`). The other Convoke agents don't read it at all. |
| Change a Convoke agent's persona, principles or menu | No supported surface. See [what you can't customise](#what-you-still-cant-customise-without-forking). | **No**: agent files are replaced |
| Edit a Convoke workflow step, template, handoff contract or user guide in place | No supported surface | **No**: replaced, and only some of these are backed up |
| Set your name for Team Factory, or change Enhance settings | No supported surface | **No**: reset on every update |

---

## 1. Tune BMAD agents and workflows: `_bmad/custom/`

> **This section requires BMAD Method to be installed.** Everything in it — `_bmad/custom/`,
> `_bmad/scripts/`, and the `bmad-*` skills the commands below invoke — belongs to BMAD Method and ships
> with it, not with `convoke-agents`. On a standalone Convoke install `_bmad/` contains only `_config/` and
> `bme/`, and every command in this section will fail with "No such file or directory". Sections 2 onward
> apply to standalone installs as well.

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

**What a fresh install writes changed in 4.0.3. Open the file and look before you edit it.**

- **4.0.2 and earlier.** Neither `user_name` nor `communication_language` is written. Add them yourself. The installer's message tells you to "replace `{user}`", but no `{user}` placeholder appears in these files.
- **4.0.3 and later.** Both files already contain `user_name: '{user}'` and `communication_language: en`. **Change the values in place — do not add a second `user_name:` line.** A duplicate key makes the file invalid YAML, and from 4.0.3 `convoke-install` refuses to run against a Vortex or Gyre config it cannot parse — it exits non-zero, names the file and the parse error, and leaves it byte-identical. `convoke-update` does the same only when a refresh is due and the damaged file is the Gyre config; a damaged Vortex config gets a migration plan instead (`T180`). Fix or remove the file, then re-run. The other four module configs are not checked at all, and are rewritten from the package template on every install whether or not they are damaged (`T181`) — which is why this section covers only the two that are merged.

```yaml
# _bmad/bme/_vortex/config.yaml
# 4.0.3+: these keys are already present — change the values, don't re-add the keys.
# 4.0.2 and earlier: add them.
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
- **Emma, Mila and Wade** load settings through a `bmad-init` step that no longer exists: Convoke removed the skill in 4.0.0 (`CHANGELOG.md`, 4.0.0 §Removed), and BMAD Method does not provide one either. Whether they then find the file anyway **varies between runs of the same project** — measured on 2026-09-17 against 4.0.3, the config was read in one run of four. Expect to be asked for your name and language some of the time, and do not rely on these three reading anything you put in this file (`T183`).

**`output_folder` survives updates, but think twice before moving it.**

- Vortex honours it unevenly. Some workflows write to `{output_folder}/…`, others to `{output_folder}/vortex-artifacts/…`, and some steps look for their inputs at the literal path `_bmad-output/vortex-artifacts/`. If you change it, check where artifacts actually land and where the next workflow looks for them.
- Gyre's workflows write to fixed locations (`.gyre/` and `_bmad-output/gyre-artifacts/`), not to `output_folder`. On 4.0.2 and earlier a fresh install puts *Vortex's* folder in `_bmad/bme/_gyre/config.yaml`; from 4.0.3 it carries Gyre's own. Either way no Gyre workflow reads the value.

**Team Factory is different.** `_bmad/bme/_team-factory/` is replaced on every update, so a `user_name` you set there resets to `'{user}'`.

---

## 3. Switch off agents you don't use: `excluded_agents`

**Edit the existing key — do not paste this in as an addition.** A shipped `config.yaml` already contains
`excluded_agents: []`. Appending the block below instead of editing that line produces a duplicate key, and
the next install refuses the file rather than overwriting it: `config-merger: refusing to overwrite …
_vortex/config.yaml: it is not valid YAML (Map keys must be unique …)`, exit 1. This is the same trap as
the one in section 2 — it applies to every key here, not just `user_name`.

```yaml
# _bmad/bme/_vortex/config.yaml — change the value of the key that is already there
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

For rules that apply to the whole project, **Emma, Mila and Wade** are instructed to load any `project-context.md` they find (for example `_bmad-output/project-context.md`). Treat that as best-effort: the same startup path that reads their `config.yaml` is the one that finds this file, and it was observed working in one run of four (`T183`). The other Convoke agents don't read it at all.

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
