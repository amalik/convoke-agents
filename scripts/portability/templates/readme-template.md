# <Skill display name>

<!-- Catalog-facing README. Consumed by sp-3-2 (Per-Skill README Generation). -->
<!-- The user reads this file FIRST to decide whether to install the skill. -->
<!-- For the LLM-consumed instructions, see instructions.md in the same directory. -->

> **Tier:** `<standalone | light-deps | pipeline>` &nbsp;|&nbsp; **Persona:** <persona name + icon>

<!-- Tier badge: -->
<!-- - standalone: works out of the box, no setup -->
<!-- - light-deps: needs templates/config inlined (Tier 2) -->
<!-- - pipeline: framework-internal or chained workflows (not portable; framework-internal) -->

## What this skill does

<!-- One paragraph. Plain language. The reader is a teammate deciding whether to install. -->

<one-paragraph description of what the skill does and what value it delivers>

## Who is <persona name>?

<!-- Communication style summary — helps the reader anticipate the persona's tone. -->
<!-- 2-3 sentences max. -->

<persona communication style summary>

## When to use it

<!-- Bullet list of trigger conditions. Should match the "Use when:" section in instructions.md. -->

<trigger-list>

## What it produces

<!-- Concrete description of the output artifact. Where it lives, what format. -->

<output artifact description>

## How to use it

<!-- Per-platform install instructions using adapter files. -->

### Claude Code

```bash
cp adapters/claude-code/SKILL.md .claude/skills/<skill-name>/SKILL.md
```

Then invoke the skill in Claude Code by name or via slash command.

### GitHub Copilot

```bash
cat adapters/copilot/copilot-instructions.md >> .github/copilot-instructions.md
```

### Cursor

```bash
cp adapters/cursor/<skill-name>.md .cursor/rules/<skill-name>.md
```

## Tier explanation

This skill is classified as **<tier>**. The three portability tiers are:

- **standalone** — works out of the box. Just copy and use.
- **light-deps** — includes inlined templates and config defaults. Just copy and use; no external setup.
- **pipeline** — framework-internal or part of a multi-step chain. Requires the full Convoke installation. NOT portable.

<!-- sp-3-1 will inject a link to the catalog repo's portability schema doc here when generating per-skill READMEs. The link is omitted from the template itself to avoid shipping a broken `<TODO>` token in every emitted README. -->

