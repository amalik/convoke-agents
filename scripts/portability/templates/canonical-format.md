# Canonical Format Specification

Specification consumed by the export engine (sp-2-2). Defines what an exported skill looks like, how source files are transformed into canonical form, and where output files land.

This document is the **single source of truth** for the canonical `instructions.md` format. Any divergence between this spec and what the exporter produces is a bug in the exporter.

---

## Template

The canonical `instructions.md` has exactly seven top-level sections in this order. Sections 1-6 are required; section 7 is optional.

```markdown
# <Skill display name>
<!-- e.g., "Brainstorming with Carson" — derived from skill name + persona -->

## You are <persona name>

<!-- Persona block. Required fields: -->
<!-- - Name and icon (e.g., "Carson 🧠") -->
<!-- - Role/title (e.g., "Elite Brainstorming Specialist") -->
<!-- - Identity / background paragraph -->
<!-- - Communication style -->
<!-- - Core principles (bulleted) -->

**Role:** <role title>

**Identity:** <one-paragraph background>

**Communication style:** <how this persona talks>

**Principles:**
- <principle 1>
- <principle 2>
- <principle 3>

## When to use this skill

<!-- One paragraph describing the skill's purpose, then a Use when: bullet list -->

<one-paragraph description>

**Use when:**
- <trigger condition 1>
- <trigger condition 2>
- <trigger condition 3>

## Inputs you may need

<!-- What context, files, or values the user should have ready BEFORE invoking the skill. -->
<!-- If the skill needs nothing, write "(none required)". -->

- <input 1: description>
- <input 2: description>

## How to proceed

<!-- The inlined workflow as a numbered list. Sub-steps are nested bullets. -->
<!-- This section REPLACES the original SKILL.md + workflow.md + steps/*.md. -->
<!-- All Claude tool references, framework calls, and config vars are stripped/replaced per the Transformation rules section below. -->

1. <step 1 title>
   - <sub-step 1.1>
   - <sub-step 1.2>
2. <step 2 title>
   - <sub-step 2.1>
3. <step 3 title>

## What you produce

<!-- Description of the output artifact(s) the skill creates. -->
<!-- Be concrete about format, structure, and where it lives. -->

<output description>

## Quality checks

<!-- OPTIONAL — only include if the source workflow has explicit quality gates. -->
<!-- Format as a checklist the LLM should run before declaring success. -->

- [ ] <check 1>
- [ ] <check 2>
```

### Section purpose at a glance

| Section | Purpose | LLM consumption pattern |
|---|---|---|
| Title | Identifies the skill | First line — sets context |
| Persona | Tells the LLM "who to be" | Critical for tone + behavior consistency |
| When to use this skill | Trigger conditions | Helps the LLM decide whether the skill applies |
| Inputs you may need | Pre-flight checklist | Reduces "ask the user 5 questions in a row" patterns |
| How to proceed | The actual workflow | The meat — inlined steps, no external file refs |
| What you produce | Output description | Helps the LLM know when it's done |
| Quality checks | Self-validation | Optional — only when source has explicit gates |

### Why no frontmatter

The canonical format is **platform-neutral**. Claude Code SKILL.md uses `---name: ... description: ---` frontmatter; Cursor uses different structure; Copilot uses none. Adapters (sp-5-2) wrap the canonical content in platform-specific frontmatter; the canonical content itself stays clean.

---

## Transformation rules

Every Claude-specific construct in the source skill files gets stripped or rewritten when producing the canonical `instructions.md`. The export engine (sp-2-2) implements these rules.

### Tool name replacements

| Source pattern | Replacement | Notes |
|---|---|---|
| `Read tool` | `read the file at` | "Use the Read tool on X" → "read the file at X" |
| `Edit tool` | `edit the file at` | Preserve any path argument |
| `Write tool` | `create a file at` | "Write tool to X" → "create a file at X" |
| `Bash tool` | `run the shell command` | "Use the Bash tool to run X" → "run the shell command X" |
| `Glob tool` | `find files matching` | "Use Glob to find X" → "find files matching X" |
| `Grep tool` | `search file contents for` | "Use Grep on X" → "search file contents for X" |
| `Skill tool` | _(strip — see chained-skill rule)_ | Chained skills are not preserved in Tier 1 exports |

### Framework call removals

| Source pattern | Action | Notes |
|---|---|---|
| `bmad-init` invocation | Remove the entire line/block | Universal — every skill calls it; not relevant once exported |
| References to `bmad-help` | Remove the reference | Framework-internal |
| `Skill: bmad-*` slash commands | Remove the line | Framework-internal chaining |
| Mentions of "config from {project-root}/_bmad/..." | Remove the mention | Framework path |

### Config var substitutions

When the source contains `{var-name}` references to runtime config values, replace each with a square-bracket prompt the user fills in themselves:

| Source var | Replacement |
|---|---|
| `{user_name}` | `[your name]` |
| `{communication_language}` | `[your preferred language]` |
| `{document_output_language}` | `[your document language]` |
| `{output_folder}` | `[your output folder]` |
| `{planning_artifacts}` | `[your planning artifacts directory]` |
| `{implementation_artifacts}` | `[your implementation artifacts directory]` |

After applying these substitutions the canonical output should contain **zero curly-brace placeholders**. Any `{var-name}` left in the output is a bug.

### Micro-file directive removals

These BMAD-framework directives are stripped entirely (replaced with inlined content):

| Source pattern | Action |
|---|---|
| `Load step:` | Strip — content is inlined at the matching position in "How to proceed" |
| `read fully and follow:` | Strip — same as above |
| `Read fully and execute:` | Strip — same as above |
| YAML frontmatter blocks (`---\n...\n---`) at the top of source files | Strip |
| `Load fully and follow:` | Strip — same as above |

### Step file inlining rule

Workflows commonly reference step files like `./steps/step-01-foo.md` or `./steps/step-02b-recommend.md`. These are NOT external dependencies — they're part of the same skill package. The exporter must:

1. Read each step file referenced from the workflow
2. Extract the actual instructional content (skip MANDATORY EXECUTION RULES, EXECUTION PROTOCOLS, SUCCESS METRICS, and other meta sections)
3. Inline that content at the corresponding numbered list item in "How to proceed"
4. Apply all transformation rules (tool replacements, var substitutions) to the inlined content

When a workflow has branching step files (e.g., `step-02a`, `step-02b`, `step-02c` for different paths), the canonical "How to proceed" presents the branches as nested options under one numbered step rather than creating multiple top-level steps.

### Workflow XML tag handling

BMAD workflows use HTML-like tags for structure. Strip the tags, keep the content as prose:

| Source pattern | Action |
|---|---|
| `<workflow>...</workflow>` | Strip tag, keep content |
| `<step n="X">...</step>` | Strip tag, content becomes a numbered list item |
| `<action>...</action>` | Strip tag, content becomes a sub-bullet |
| `<check if="...">...</check>` | Strip tag; convert to "If X, then Y" prose |
| `<critical>...</critical>` | Strip tag, content becomes prose (often **bold** for emphasis) |
| `<output>...</output>` | Strip tag — these are output templates the LLM is supposed to print; keep as quoted prose |
| `<ask>...</ask>` | Strip tag, content becomes "Ask the user: ..." prose |

### Open questions / not yet specified

Some construct handling cannot be fully specified until the export engine is built and tested against real skills. sp-2-2 will resolve these empirically:

1. **Conditional steps:** Workflows sometimes use `<check if="...">` with deeply nested branching. Should the canonical format use markdown conditionals (e.g., "If X, then ... else ...") or omit them entirely and present only the happy path?

2. **Menu structures:** Some workflows present numbered menus to the user (`[A] Option, [B] Option, [C] Continue`). Should these be preserved verbatim or rewritten as "Ask the user to choose: ..." prose?

3. **Hook/script references:** Some workflows invoke shell scripts via Bash with absolute or project-relative paths. The `Bash tool` → "run the shell command" replacement is in the table above, but what about paths like `.claude/hooks/bmad-speak.sh` that won't exist in a standalone project?

4. **Multi-tier exports:** Tier 2 (light-deps) skills will need template inlining, which is sp-5-1's job. What does the canonical format say about a "Template" section for inlined templates? Should it be a new section (e.g., "## Templates") or appended under "Inputs you may need"?

5. **Relative-template paths from sp-1-2 (Epic 1 retro action item A2):** sp-1-2's classifier produces relative-template paths like `../templates/prd-template.md` that resolve from a step file's directory, not the SKILL.md directory. The validator (sp-1-3) handles this with a subtree-search fallback. The exporter should reuse the same approach when inlining template content (sp-5-1 territory, but worth flagging here so sp-2-2 doesn't reinvent it).

6. **`bmad-speak` and other hook scripts:** Some workflows reference `.claude/hooks/bmad-speak.sh` for character voice. These hooks won't exist in standalone exports — should the export drop the references entirely or leave a "(audio hook stripped)" comment?

These open questions are intentionally **not** locked in this story. sp-2-2 will encounter each one during implementation and document the resolution in its own dev notes.

---

## Output directory structure

The exporter produces the following per-skill layout:

```
<skill-name>/
  README.md          ← what, why, who, how-to-install (catalog-facing)
  instructions.md    ← canonical LLM-agnostic content (this spec)
```

`README.md` is the catalog-facing entry point — the file a user reads first to decide whether to install the skill. Its template is in [readme-template.md](readme-template.md) (consumed by sp-3-2).

`instructions.md` is the LLM-consumed payload — the file an AI tool reads to actually perform the skill. Its template is the **Template** section above (consumed by sp-2-2).

### Adapters are NOT in scope for sp-2-1

Per-platform adapter wrappers (`adapters/claude-code/`, `adapters/copilot/`, `adapters/cursor/`) are explicitly **not** part of this story's spec. They belong to sp-5-2 (Platform Adapter Generation) and will wrap the canonical `instructions.md` in platform-specific frontmatter and conventions.

For sp-2-1 + sp-2-2 + sp-2-3 + sp-2-4, the canonical content alone is sufficient — Claude Code can consume `instructions.md` directly when copied into `.claude/skills/<skill-name>/`.
