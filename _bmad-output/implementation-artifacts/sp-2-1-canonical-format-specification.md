# Story SP-2.1: Canonical Format Specification

Status: ready-for-dev

## Story

As a platform maintainer building the skill exporter,
I want a documented canonical format specification — including a template, a transformation rule table, and a fully-worked example — for the LLM-agnostic `instructions.md` file that exported skills produce,
so that the export engine (sp-2-2), CLI (sp-2-3), and batch exporter (sp-2-4) all share a single source of truth and produce consistent output.

## Acceptance Criteria

1. A canonical format template exists at `scripts/portability/templates/canonical-template.md` with placeholders for every required section. The template is plain markdown with no Claude-specific tool names, no framework references (`bmad-init`, `Load step:`), no micro-file conventions, and no slash commands.

2. The template defines exactly these top-level sections in this order:
   - **Title** (`# <Skill display name>`)
   - **Persona** (`## You are <name>`) — agent display name, icon, role, communication style, principles
   - **When to use this skill** — one paragraph + a `Use when:` bullet list
   - **Inputs you may need** — what context/files/values the user should have ready (or "(none required)")
   - **How to proceed** — the inlined workflow steps as a numbered list, with sub-steps as nested bullets
   - **What you produce** — description of the output artifact(s) the skill creates
   - **Quality checks** (optional, only if the source workflow has explicit gates) — a checklist the LLM should run before declaring success

3. A transformation rule table exists at `scripts/portability/templates/transformation-rules.md` documenting every Claude-specific construct that gets stripped or rewritten during export. At minimum, the table covers:
   - **Tool name replacements:** `Read tool` → "read the file at", `Edit tool` → "edit the file at", `Write tool` → "create a file at", `Bash tool` → "run the shell command", `Glob tool` → "find files matching", `Grep tool` → "search file contents for", `Skill tool` → "(strip — see chained-skill rule)"
   - **Framework call removals:** `bmad-init` invocations, `bmad-help` references, `Skill: bmad-*` slash command references
   - **Config var substitutions:** `{user_name}` → `[your name]`, `{communication_language}` → `[your preferred language]`, `{output_folder}` → `[your output folder]`, `{planning_artifacts}` → `[your planning artifacts directory]`, `{implementation_artifacts}` → `[your implementation artifacts directory]`, `{document_output_language}` → `[your document language]`
   - **Micro-file directive removals:** `Load step:`, `read fully and follow:`, `Read fully and execute:`, frontmatter blocks like `---\nname:\n---`
   - **Step file inlining rule:** when a workflow references step files like `./steps/step-01-foo.md`, the exporter must inline the step content at the corresponding numbered list item in "How to proceed"
   - **Workflow XML/MDX tag handling:** `<workflow>`, `<step n="X">`, `<action>`, `<check>`, `<critical>` tags get stripped; their content becomes prose

4. A fully-worked canonical example exists at `scripts/portability/templates/canonical-example.md` showing what a real exported `instructions.md` looks like. The example MUST be the export of `bmad-brainstorming` (Carson) — the Tier 1 reference skill from `portability-schema.md`. The example is hand-authored for this story (the actual exporter from sp-2-2 will need to reproduce it), demonstrating every section of the canonical format with realistic content.

5. The canonical example contains NO Claude-specific tool names (verified by grep — see Task 5), NO `bmad-*` references, NO `{var-name}` placeholders that aren't from the substitution table in Task 3, and NO `Load step:` / `read fully and follow:` directives.

6. A per-skill output directory structure is documented at `scripts/portability/templates/output-structure.md` describing exactly what the exporter produces per skill:
   ```
   <skill-name>/
     README.md          ← what, why, who, how-to-install (catalog-facing)
     instructions.md    ← canonical LLM-agnostic content (this story's spec)
   ```
   Per-platform adapters (`adapters/claude-code/`, `adapters/copilot/`, `adapters/cursor/`) are explicitly NOT in scope for sp-2-1 — they belong to sp-5-2.

7. The README.md format is also defined as a sub-template in `scripts/portability/templates/readme-template.md` with sections:
   - Title + persona + tier badge
   - One-paragraph description
   - "Who is <persona name>?" — communication style summary
   - "When to use it" — bullet list
   - "What it produces" — output artifact description
   - "How to use it" — placeholder sections for each platform (filled in by sp-5-2 adapters; for sp-2-1 the only platform documented is Claude Code as `Copy this directory into .claude/skills/<skill-name>/`)
   - "Tier" — reference to the schema doc with the explanation of what the tier means

8. A test file at `tests/lib/portability-canonical-format.test.js` validates the canonical example against the specification with at least 5 tests:
   - The canonical example file exists and is non-empty
   - The example contains every required section heading from AC #2 (in order)
   - The example contains NO forbidden strings (Claude tool names, `bmad-init`, `bmad-help`, `Load step:`, `read fully and follow:`)
   - The example contains NO `{var-name}` placeholders that aren't in the substitution allow-list from AC #3
   - All 4 template files (`canonical-template.md`, `transformation-rules.md`, `canonical-example.md`, `readme-template.md`, `output-structure.md`) exist and are non-empty

## Tasks / Subtasks

- [ ] Task 1: Create the canonical-template.md (AC: #1, #2)
  - [ ] Create directory `scripts/portability/templates/`
  - [ ] Create `canonical-template.md` with markdown placeholders for all 7 top-level sections from AC #2
  - [ ] Use angle-bracket placeholder syntax: `<persona name>`, `<workflow steps inlined here>`, etc.
  - [ ] Add inline comments (HTML-style `<!-- -->`) explaining what goes in each section
  - [ ] No frontmatter, no YAML, no Claude-specific syntax

- [ ] Task 2: Create the transformation-rules.md (AC: #3)
  - [ ] Create `scripts/portability/templates/transformation-rules.md`
  - [ ] Header explains the purpose: "Defines every Claude-specific construct that gets stripped or rewritten when exporting a skill to canonical format. Consumed by the export engine (sp-2-2)."
  - [ ] Section: **Tool name replacements** — table with `Source pattern | Replacement | Notes`. Cover all 7 Claude tools: Read, Edit, Write, Bash, Glob, Grep, Skill.
  - [ ] Section: **Framework call removals** — table listing `bmad-init`, `bmad-help`, `Skill: bmad-*` slash commands, and the rule "remove the entire line/block"
  - [ ] Section: **Config var substitutions** — table with at least the 6 universal vars from AC #3
  - [ ] Section: **Micro-file directive removals** — table with `Load step:`, `read fully and follow:`, `Read fully and execute:`, and frontmatter block patterns
  - [ ] Section: **Step file inlining rule** — prose explaining how `./steps/step-NN-foo.md` references should be resolved and their content placed at the matching numbered position
  - [ ] Section: **Workflow XML tag handling** — table with `<workflow>`, `<step n="X">`, `<action>`, `<check>`, `<critical>`, `<output>`, `<ask>` and the rule "strip tag, keep content as prose"
  - [ ] Section: **Open questions / not yet specified** — explicitly list anything sp-2-2 will need to decide that this story doesn't lock down

- [ ] Task 3: Create the canonical-example.md for Carson (AC: #4, #5)
  - [ ] Read the source files for `bmad-brainstorming`:
    - [ ] `_bmad/core/bmad-brainstorming/SKILL.md`
    - [ ] `_bmad/core/bmad-brainstorming/workflow.md`
    - [ ] `_bmad/core/bmad-brainstorming/steps/*.md`
    - [ ] `_bmad/core/bmad-brainstorming/template.md`
  - [ ] Read Carson's persona from `_bmad/_config/agent-manifest.csv` (the row with name `bmad-cis-agent-brainstorming-coach` — Carson's full persona lives there even though the skill is `bmad-brainstorming`)
  - [ ] Hand-author `scripts/portability/templates/canonical-example.md` following the template from Task 1
  - [ ] Apply every transformation rule from Task 2 by hand — this is the human-authored gold-standard that sp-2-2's automated exporter will be measured against
  - [ ] Verify the example contains: persona section with Carson's name + icon + style, "When to use" with bullet list, "Inputs you may need", inlined workflow steps as a numbered list, "What you produce" describing the brainstorm output, and (if applicable) quality checks
  - [ ] Verify the example does NOT contain any of the forbidden strings (run grep manually before finalizing)
  - [ ] Length target: 100-300 lines. Long enough to be realistic, short enough to be a digestible reference.

- [ ] Task 4: Create output-structure.md and readme-template.md (AC: #6, #7)
  - [ ] Create `scripts/portability/templates/output-structure.md` documenting the per-skill directory layout. Show the exact structure with `<skill-name>/README.md` and `<skill-name>/instructions.md`. Note that adapters are sp-5-2 territory.
  - [ ] Create `scripts/portability/templates/readme-template.md` with placeholders for the 6 sections from AC #7
  - [ ] In readme-template.md's "How to use it" section, document only the Claude Code install path: `Copy this directory into .claude/skills/<skill-name>/`. Add a comment that Copilot/Cursor adapters will be filled in by sp-5-2.

- [ ] Task 5: Write canonical-format tests (AC: #8)
  - [ ] Create `tests/lib/portability-canonical-format.test.js`
  - [ ] Use `findProjectRoot()` and read template files via `fs.readFileSync`
  - [ ] **Test 1:** All 5 template files exist and are non-empty (`canonical-template.md`, `transformation-rules.md`, `canonical-example.md`, `output-structure.md`, `readme-template.md`)
  - [ ] **Test 2:** `canonical-example.md` contains every required section heading from AC #2 in the correct order. Use a regex array: `[/^# /, /^## You are /m, /^## When to use this skill$/m, /^## Inputs you may need$/m, /^## How to proceed$/m, /^## What you produce$/m]`
  - [ ] **Test 3:** `canonical-example.md` contains NO forbidden Claude tool names. Grep for: `Read tool`, `Edit tool`, `Write tool`, `Bash tool`, `Glob tool`, `Grep tool`, `Skill tool`, `bmad-init`, `bmad-help`, `Load step:`, `read fully and follow`
  - [ ] **Test 4:** `canonical-example.md` contains NO `{var-name}` placeholders except the 6 documented in the substitution table from AC #3. Use regex `/\{[\w-]+\}/g` to find all placeholders, then assert each is in the allow-list `['user_name','communication_language','document_output_language','output_folder','planning_artifacts','implementation_artifacts']` (catching the case where they shouldn't appear unsubstituted at all — these should already be replaced with `[your X]` placeholders).

    **CORRECTION:** the test should assert that **no** `{var-name}` placeholders exist in the example at all (since the transformation rules replace them). Re-read AC #3: substitutions REPLACE the var with a square-bracket prompt, so the final example should have ZERO curly-brace placeholders.
  - [ ] **Test 5:** `transformation-rules.md` contains all 7 Claude tool names in its replacement table (verifying the exporter has guidance for each)
  - [ ] **Bonus Test 6:** `canonical-example.md` mentions Carson by name (sanity check — wrong skill exported = wrong persona)

- [ ] Task 6: Run regression suite + verify (AC: #8)
  - [ ] `npx jest tests/lib/portability-schema.test.js tests/lib/portability-classification.test.js tests/lib/portability-validation.test.js tests/lib/portability-canonical-format.test.js`
  - [ ] All tests pass (21 existing + 6 new = 27 minimum)
  - [ ] `node scripts/convoke-doctor.js` — same baseline as Epic 1 stories (2 pre-existing issues OK)
  - [ ] Manually grep `scripts/portability/templates/canonical-example.md` for forbidden strings to double-check Test 3's coverage

## Dev Notes

### Architecture Compliance (CRITICAL)

- **This story produces SPECIFICATION ARTIFACTS, not runtime code.** The 5 files created in `scripts/portability/templates/` are templates and reference docs. No JavaScript except the test file.
- **Build on Epic 1 foundation:** the canonical example uses the schema (sp-1-1), and the test file should use the shared `manifest-csv.js` parser if it needs to read the manifest. It probably doesn't — this story is about templates, not manifest parsing.
- **No new npm dependencies.** Only `fs`, `path`, existing project utilities.
- **`findProjectRoot()` from `scripts/update/lib/utils.js`** in tests — never `process.cwd()`.
- **The canonical example is the gold standard.** sp-2-2's automated exporter will be measured against it. Get it right by hand here so the dev agent in sp-2-2 has a concrete target.

### Why this story exists

The vision and Epic 2 plan repeatedly reference "canonical LLM-agnostic format" and "instructions.md" but never define the structure. Without a locked spec:
- sp-2-2's export engine could produce wildly inconsistent output across skills
- sp-2-3's CLI would have no contract to validate against
- sp-2-4's batch export would be untestable
- sp-3-x's catalog generator wouldn't know what shape of file to link to

This story locks the contract. Every subsequent Epic 2 + Epic 3 story consumes it.

### Why Carson (bmad-brainstorming) as the example

1. It's the Tier 1 reference skill in `portability-schema.md`
2. It has a real persona (Carson, the Brainstorming Specialist) — exercises the persona section
3. It has a workflow with multiple steps — exercises the inlining rule
4. It has zero external template dependencies — proves Tier 1 exports work end-to-end without sp-5-1's template inlining
5. It's universally useful — when teammates copy the result, they get something they can actually use

### Canonical format design rationale

**Why these 7 sections (AC #2):**

| Section | Purpose | LLM consumption pattern |
|---|---|---|
| Title | Identifies the skill | First line — sets context |
| Persona | Tells the LLM "who to be" | Critical for tone + behavior consistency |
| When to use | Trigger conditions | Helps the LLM decide whether the skill applies to the user's request |
| Inputs you may need | Pre-flight checklist | Reduces "ask the user 5 questions in a row" patterns |
| How to proceed | The actual workflow | The meat — inlined steps, no external file refs |
| What you produce | Output description | Helps the LLM know when it's done |
| Quality checks | Self-validation | Optional — only present when the source has explicit gates |

This structure is informed by how Claude Code skills, Cursor rules, and Copilot custom instructions are all consumed: a single chunk of markdown that the LLM reads top-to-bottom before responding. Order matters — persona before workflow, inputs before output.

**Why no frontmatter:** the canonical format must be platform-neutral. Claude SKILL.md uses `---name: ... description: ---` frontmatter; Cursor uses different structure; Copilot uses none. Adapters (sp-5-2) wrap the canonical content in platform-specific frontmatter; the canonical itself stays clean.

**Why explicit "When to use" + "Inputs you may need":** these two sections are the difference between "I copied a skill into my project but I have no idea when to invoke it" and "I know exactly when this fires and what I need ready." Critical for the consultant-onboarding use case from the vision doc.

### Transformation rules — open questions sp-2-2 will resolve

Some construct handling cannot be fully specified until the export engine is built and tested against real skills. Document these in `transformation-rules.md` Section "Open questions":

1. **Conditional steps:** Workflows sometimes use `<check if="...">` with branching logic. Should the canonical format use markdown conditionals (e.g., "If X, then ..." prose) or omit them entirely?
2. **Menu structures:** Some workflows present numbered menus to the user (`[A] Option, [B] Option, [C] Continue`). Should these be preserved or rewritten?
3. **Hook/script references:** Some workflows invoke shell scripts via Bash. The Bash → "run the shell command" replacement is in the table, but what about absolute paths to project-internal scripts?
4. **Multi-tier exports:** Tier 2 (light-deps) skills will need template inlining, which is sp-5-1's job. What does the canonical-template.md say about a "Template" section for inlined templates?

These are flagged as open in the transformation rules doc — sp-2-2 will resolve them empirically while building the engine.

### Source Files to Touch

| Path | Action | Purpose |
|------|--------|---------|
| `scripts/portability/templates/canonical-template.md` | Create | Markdown placeholder template for `instructions.md` |
| `scripts/portability/templates/transformation-rules.md` | Create | Lookup table of Claude→generic transformations |
| `scripts/portability/templates/canonical-example.md` | Create | Hand-authored Carson export (gold standard) |
| `scripts/portability/templates/output-structure.md` | Create | Per-skill directory layout doc |
| `scripts/portability/templates/readme-template.md` | Create | README placeholder template |
| `tests/lib/portability-canonical-format.test.js` | Create | 6 spec validation tests |

### Out of Scope (Do NOT do in this story)

- Building the export engine (sp-2-2)
- Building the CLI (sp-2-3)
- Running the export against any skill (sp-2-4)
- Building the catalog generator (Epic 3)
- Writing the per-skill README content (sp-3-2)
- Building platform adapters for Copilot/Cursor (sp-5-2)
- Inlining templates from Tier 2 skills (sp-5-1)
- Modifying any agent files, workflow files, classifier, validator, or runtime code
- Re-running the validator or classifier
- Adding canonical sections beyond the 7 in AC #2 (locked vocabulary)
- Choosing a different example skill than Carson (locked per AC #4)

### Story Foundation (Epic 2, Story 1 of 4)

This is the spec story. After completion:
- sp-2-2 (export engine) consumes `canonical-template.md` + `transformation-rules.md` + `canonical-example.md` to know what to produce
- sp-2-3 (CLI) wraps sp-2-2's engine
- sp-2-4 (batch) runs sp-2-3 against all Tier 1 skills
- sp-3-1 + sp-3-2 (catalog) consume `readme-template.md`

Get the format right here — every Epic 2 and Epic 3 story builds on it.

### Project Structure Notes

- `scripts/portability/templates/` is a NEW directory. No existing files there.
- The 5 template files are reference docs, not runtime code. They're checked in and consumed by sp-2-2's exporter.
- The test file lives in `tests/lib/` next to the other portability tests.
- No conflicts with existing structure — purely additive.

### Action items from sp-epic-1 retro applied

| Action item | How this story applies it |
|---|---|
| **A1** (document expected artifact-consumption patterns) | N/A — this story is about format spec, not classification |
| **A2** (Epic 2 must handle relative-template paths via subtree search) | Flagged in "Open questions / not yet specified" section of transformation-rules.md so sp-2-2 doesn't reinvent the workaround |
| **A3** (verify referenced files exist when ACs name canonical sets) | Carson's source files must exist — Task 3 reads them. AC #4 names the exact source path. |
| **A4** (enumerate negative cases in heuristic tables) | Transformation rules table includes both "what to replace" AND "what to strip entirely" — the negative case |

### References

- [vision-skill-portability.md](../planning-artifacts/vision-skill-portability.md) — Section "Canonical format" + "Standalone Skills Repository"
- [epics-skill-portability.md](../planning-artifacts/epics-skill-portability.md#story-21-canonical-format-specification) — Epic 2 Story 2.1 original AC
- [_bmad/_config/portability-schema.md](../../_bmad/_config/portability-schema.md) — Carson is the Tier 1 example here
- [sp-epic-1-retro-2026-04-09.md](sp-epic-1-retro-2026-04-09.md) — action items A2, A3, A4 inform this story
- `_bmad/core/bmad-brainstorming/SKILL.md` + `workflow.md` + `steps/*.md` + `template.md` — Carson's source files
- `_bmad/_config/agent-manifest.csv` — Carson's persona row (`bmad-cis-agent-brainstorming-coach`)

## Dev Agent Record

### Agent Model Used

(to be filled by dev agent)

### Debug Log References

### Completion Notes List

### File List
