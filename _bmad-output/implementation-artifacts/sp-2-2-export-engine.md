# Story SP-2.2: Export Engine

Status: ready-for-dev

## Story

As a platform maintainer building the skill exporter,
I want a programmatic export engine that reads a Tier 1 skill's source files (SKILL.md + workflow + step files) and produces a canonical `instructions.md` matching the format spec from sp-2-1,
so that the CLI (sp-2-3) and batch exporter (sp-2-4) have a working transformation engine and Tier 1 skills can be exported automatically without hand-authoring.

## Acceptance Criteria

1. An export engine module exists at `scripts/portability/export-engine.js` exposing a function `exportSkill(skillName, projectRoot, options)` that returns `{ instructions: string, persona: object, sections: object, warnings: string[] }` and does NOT write any files (file output is sp-2-3's job).

2. The engine reads the skill's source files via the agent-manifest + skill-manifest entries:
   - Skill row from `_bmad/_config/skill-manifest.csv` (path column → SKILL.md location)
   - Persona data from `_bmad/_config/agent-manifest.csv` if a matching `bmad-agent-*` or `bmad-cis-agent-*` row exists; otherwise extract persona inline from the skill's SKILL.md content
   - Workflow file (typically `<skill-dir>/workflow.md`)
   - All step files referenced via `Load step:`, `read fully and follow:`, `read fully and execute:`, or `./steps/*.md` patterns
   - Recursive depth bounded to 4 (one deeper than sp-1-2's classifier — workflows can have nested step dispatch)

3. The engine produces canonical `instructions.md` content matching the 7-section structure from `scripts/portability/templates/canonical-format.md` (sp-2-1):
   - **Title** — derived from skill display name + persona name (e.g., `# Brainstorming with Carson`)
   - **Persona** (`## You are <name>`) — name + icon + role + identity + communication style + principles
   - **When to use this skill** — one-paragraph description + "Use when:" bullet list extracted from the skill's `description` column and workflow goal
   - **Inputs you may need** — extracted from workflow context loading + config var references (or `(none required)` if none)
   - **How to proceed** — inlined workflow + step content, formatted as a numbered list with sub-bullets
   - **What you produce** — extracted from workflow output declarations and template references
   - **Quality checks** (optional, only if source has explicit `## Success` / `## Quality` / `<critical>` blocks)

4. The engine applies every transformation rule from `canonical-format.md` Transformation rules section:
   - Tool name replacements (Read/Edit/Write/Bash/Glob/Grep → generic verbs; Skill → strip with marker)
   - Framework call removals (`bmad-init`, `bmad-help`, `Skill: bmad-*`, `_bmad/` paths, `{project-root}`, `.claude/hooks/*`)
   - Config var substitutions (`{user_name}` → `[your name]`, etc. — all 6 universal vars)
   - Micro-file directive removals (`Load step:`, `read fully and follow:`, `Read fully and execute:`, `Load fully and follow:`, frontmatter blocks)
   - Workflow XML tag handling (`<workflow>`, `<step n="X">`, `<action>`, `<check>`, `<critical>`, `<output>`, `<ask>` — strip tags, keep content)

5. The engine handles step file inlining per the canonical-format.md rule: when a workflow references step files, the engine reads each one, extracts the actual instructional content (skipping meta sections like `MANDATORY EXECUTION RULES`, `EXECUTION PROTOCOLS`, `SUCCESS METRICS`, `FAILURE MODES`, `CONTEXT BOUNDARIES`), and inlines the result at the corresponding numbered list position. Branching step files (e.g., `step-02a`, `step-02b`, `step-02c`) become nested options under one numbered step, not separate top-level steps.

6. The engine refuses to export non-Tier 1 skills: if the skill's `tier` column is `light-deps` or `pipeline`, the engine throws an error like `"<skill-name> is tier <X>, not standalone — Tier 2 export is sp-5-1's job, Tier 3 skills are not exported per the portability schema"`. Tier 1 only.

7. The engine produces a `warnings` array in its return value, where each entry is `{ type: string, message: string, location?: string }`. Allowed warning types (locked vocabulary):
   - `hook-script-stripped` — a `.claude/hooks/*` reference was stripped from a step
   - `unresolved-template-path` — a relative-template path could not be resolved via subtree search
   - `deep-conditional-skipped` — a `<check if>` block deeper than 2 levels was reduced to its happy path
   - `unstripped-xml-tag` — an XML tag remained after the strip pass (engine bug; should be 0 in healthy runs)
   - `step-file-not-found` — a referenced step file does not exist on disk

   Warnings are non-fatal — the engine still returns valid canonical output. Carson and Sophia together should produce **no more than 2 warnings each** in the gold-standard run (per AC #8 + Test 9 — Fix 3 from sp-2-2 review). Warning types outside this allow-list are themselves a bug.

8. The engine output for **two** Tier 1 skills passes structural-invariant checks:
   - **`bmad-brainstorming` (Carson)** — the gold-standard reference skill from sp-2-1
   - **`bmad-cis-agent-storyteller` (Sophia)** — a second Tier 1 standalone skill that exercises the engine on a different persona shape, workflow structure, and step layout. This is the "Carson-only blind spot" guard from the sp-2-2 review (Fix 1).

   For both skills, the engine output must satisfy:
   - All 7 required section headings present in correct order
   - Persona section populated with name + icon + role + communication style + principles
   - Zero forbidden strings (same expanded list as sp-2-1's Test 3 — 19 entries)
   - Zero curly-brace placeholders (all `{var}` substituted to `[your X]`)
   - Engine output mentions the persona name (Carson / Sophia) at least once
   - `warnings.length <= 2` with all warnings drawn from the allowed types in AC #7

   The engine output does NOT need to match the gold standard verbatim — wording and ordering of sub-bullets may differ. The structural invariants are what's tested.

9. A test file at `tests/lib/portability-export-engine.test.js` adds at least 7 tests:
   - **Test 1:** `exportSkill('bmad-brainstorming', projectRoot)` returns a non-null result with `instructions`, `persona`, `sections`, `warnings` keys
   - **Test 2:** the result's `instructions` contains all 7 required section headings in correct order (use `RegExp.exec().index` ordering — same pattern as sp-2-1's Test 2)
   - **Test 3:** the result's `instructions` contains zero forbidden strings (use the same forbidden list as sp-2-1's Test 3)
   - **Test 4:** the result's `instructions` contains zero curly-brace placeholders (regex `/\{[\w-]+\}/g`)
   - **Test 5:** the result's `persona` object has `name='Carson'` and `icon='🧠'`
   - **Test 6:** `exportSkill('bmad-create-prd', projectRoot)` throws an error because the skill is `light-deps`, not `standalone`
   - **Test 7:** `exportSkill('bmad-dev-story', projectRoot)` throws an error because the skill is `pipeline`
   - **Bonus Test 8:** `exportSkill` does NOT write any files (verify by snapshotting the project tree before and after the call — no diff)
   - **Bonus Test 9:** the result's `warnings` array is empty for Carson (the gold-standard skill should produce zero warnings on a clean run)

## Tasks / Subtasks

- [ ] Task 1: Build the export engine skeleton (AC: #1)
  - [ ] Create `scripts/portability/export-engine.js` using CommonJS
  - [ ] Use `findProjectRoot()` from `scripts/update/lib/utils.js`
  - [ ] Import `readManifest` from `scripts/portability/manifest-csv.js` (read-only — no `writeManifest` import)
  - [ ] Define and export the function `exportSkill(skillName, projectRoot, options = {})` with signature documented in JSDoc
  - [ ] Return shape: `{ instructions: string, persona: object, sections: object, warnings: string[] }`
  - [ ] No file writes — the engine is pure-transform

- [ ] Task 2: Implement source loader (AC: #2)
  - [ ] Build `loadSkillSource(skillName, projectRoot)` helper:
    - [ ] Read skill row from `_bmad/_config/skill-manifest.csv` (use `manifest-csv.js`)
    - [ ] Throw clear error if the skill name isn't in the manifest
    - [ ] Extract `path` column (SKILL.md location) and `tier` column
    - [ ] Read SKILL.md, workflow file (typically `path.dirname(skillPath) + '/workflow.md'`), and any referenced step files
  - [ ] Build `loadPersona(skillName, skillContent, projectRoot)` helper:
    - [ ] Read `_bmad/_config/agent-manifest.csv`
    - [ ] Look for matching agent rows (try `bmad-cis-agent-*`, `bmad-agent-*`, or skill name directly — see Dev Notes for matching strategy)
    - [ ] If found, extract `displayName`, `icon`, `title`, `role`, `identity`, `communicationStyle`, `principles` columns
    - [ ] If not found, fall back to extracting persona from the skill's source content (look for `**Your Role:**`, `**Identity:**`, `**Communication style:**` markers)
  - [ ] Reuse the `findFileInSubtree` pattern from `validate-classification.js` for relative step-file resolution (Epic 1 retro action item A2 — don't reinvent the workaround)

- [ ] Task 3: Implement section extractors (AC: #3)
  - [ ] Build per-section extractor functions. Each extractor has a documented source-pattern lookup chain (Fix 2 from sp-2-2 review). Apply patterns in priority order; first match wins; documented fallback applies if all patterns miss.

  - [ ] **`extractTitle(skillName, persona)`** — produces `# <display name> with <persona name>` (Fix 5: locked humanization rule)

    | Priority | Source pattern | Example |
    |---|---|---|
    | 1 | `agentManifest.find(a => a.name === skillName)?.title` (use the agent's title field) | Carson row's title=`Elite Brainstorming Specialist` → too long; prefer rule 2 |
    | 2 | Strip `bmad-` and `bmad-cis-agent-` / `bmad-agent-` prefixes; kebab-to-title-case the rest; append `with <persona name>` if persona exists | `bmad-brainstorming` + Carson → `Brainstorming with Carson`; `bmad-cis-agent-storyteller` + Sophia → `Storyteller with Sophia` |
    | 3 | Skill name as-is, kebab-to-title-case | `bmad-shard-doc` → `Shard Doc` (no persona append) |

    **Fallback:** humanized skill name with no persona suffix.

  - [ ] **`extractPersona(persona)`** — produces the `## You are <name>` block

    | Priority | Source pattern | Example |
    |---|---|---|
    | 1 | Agent manifest row fields: `displayName + icon + title + identity + communicationStyle + principles` | Carson row → all 6 fields populated |
    | 2 | Inline parse from skill source: look for `**Your Role:**`, `**Identity:**`, `**Communication style:**`, `**Principles:**` headings in workflow.md | Older skills with inline persona |

    **Fallback:** throw `"persona resolution failed for <skillName>"` (Fix 4 — no silent generic).

  - [ ] **`extractWhenToUse(skillRow, workflowContent)`** — produces description paragraph + "Use when:" bullet list

    | Priority | Source pattern | Example |
    |---|---|---|
    | 1 | One-paragraph description: skill manifest `description` column | Carson row's description |
    | 2 | "Use when:" bullets: parse the workflow's `**Goal:**` line for trigger conditions; if absent, parse the workflow's first paragraph for keywords like "Use this when", "Trigger when" | Carson workflow.md line ~7 `**Goal:** Facilitate interactive brainstorming sessions...` |
    | 3 | If no triggers found, generate one bullet: `When the user explicitly requests <human-readable skill name>` | `bmad-shard-doc` → `When the user explicitly requests document sharding` |

  - [ ] **`extractInputs(workflowContent, stepContents)`** — produces "Inputs you may need" bullet list

    | Priority | Source pattern | Example |
    |---|---|---|
    | 1 | `### Configuration Loading` block in workflow.md — extract config var names (`{user_name}`, `{output_folder}`, etc.) and convert each to a bullet (e.g., `**Output folder.** Where to write the session document. Replace [your output folder] with your preferred location.`) | Carson workflow.md line ~33 |
    | 2 | `### Required Inputs` heading | Some BMM skills |
    | 3 | YAML frontmatter `inputs:` field | Rare in BMAD |
    | 4 | Look for explicit `context_file` or path-prompt patterns in any step file | Carson references `context_file` |

    **Fallback:** `(none required)` literal string

  - [ ] **`extractHowToProceed(workflowContent, stepContents)`** — produces the inlined numbered workflow. Delegates to `inlineSteps()` (Task 4).

  - [ ] **`extractWhatYouProduce(workflowContent, stepContents)`** — extracts output description

    | Priority | Source pattern | Example |
    |---|---|---|
    | 1 | YAML frontmatter `output:` or `output_file:` field | rare |
    | 2 | A `## Output` heading section in workflow.md | rare |
    | 3 | A path variable like `*_output_file` or `*_artifact` defined in `### Paths` block in workflow.md | Carson's `brainstorming_session_output_file` |
    | 4 | A `template.md` file in the skill directory — describe its structure | Carson has `template.md` |
    | 5 | Workflow's `**Goal:**` line — extract the deliverable noun | Carson `**Goal:** Facilitate interactive brainstorming sessions` → "a brainstorming session document" |

    **Fallback:** `A markdown document at [your output folder]/<skill-name>/[date].md`

  - [ ] **`extractQualityChecks(workflowContent, stepContents)`** — optional

    | Priority | Source pattern | Example |
    |---|---|---|
    | 1 | `## SUCCESS METRICS` blocks in any step file (rename to `## Quality checks`) | Carson step files |
    | 2 | `## Critical Rules`, `<critical>` tags, `## QUALITY CHECKS` blocks | Various |
    | 3 | `## Success Criteria` headings | Some BMM skills |

    **If none of these are found, omit the section entirely** — Quality checks is the only optional section per AC #2.

- [ ] Task 4: Implement step file inlining (AC: #5)
  - [ ] Build `inlineSteps(workflowContent, stepContents)` helper:
    - [ ] Parse the workflow's step references in order (look for `Load step:`, `read fully and follow:`, `Read fully and execute:`, `./steps/*.md` patterns, and `<step n="X">` XML tags)
    - [ ] For each step file, extract the actual instructional content by stripping these meta sections (use heading-based detection):
      - `## MANDATORY EXECUTION RULES`
      - `## EXECUTION PROTOCOLS`
      - `## CONTEXT BOUNDARIES`
      - `## SUCCESS METRICS`
      - `## FAILURE MODES`
      - `## SYSTEM SUCCESS/FAILURE METRICS`
      - `## ROLE REINFORCEMENT`
      - `## STEP-SPECIFIC RULES`
      - `## NEXT STEPS`
    - [ ] Keep these "instructional content" sections:
      - `## YOUR TASK`
      - `## INITIALIZATION SEQUENCE`
      - `## EXECUTION SEQUENCE`
      - `## MANDATORY SEQUENCE`
      - Any heading that doesn't match the meta-section list
    - [ ] Detect branching step files by name pattern (`step-02a`, `step-02b`, `step-02c`, etc.) and present the branches as nested options under ONE numbered step (not separate top-level steps)
    - [ ] After extraction, apply the transformation rules from Task 5 to the inlined content
    - [ ] If a step file can't be resolved (broken reference), append an entry to the `warnings` array like `"step file <path> not found — content omitted"` and continue

- [ ] Task 5: Implement transformation rules (AC: #4)
  - [ ] Build `applyTransformations(text)` helper that applies all transformation rules from `canonical-format.md` in order:
    - [ ] **Phase 1 — Strip frontmatter blocks:** match `^---\n[\s\S]*?\n---\n` at the start of any block and remove
    - [ ] **Phase 2 — Strip XML/MDX tags:** `<workflow>`, `<step n="X">`, `<action>`, `<check>`, `<critical>`, `<output>`, `<ask>` — strip the tags, keep the content. Use `string.replace(/<\/?(workflow|step|action|check|critical|output|ask)[^>]*>/g, '')`.
    - [ ] **Phase 3 — Strip framework calls:** remove lines containing `bmad-init`, `bmad-help`, `Skill: bmad-*`, `_bmad/`, `{project-root}`, `.claude/hooks/`, `bmad-speak`. Use line-by-line filter.
    - [ ] **Phase 4 — Strip micro-file directives:** remove lines containing `Load step:`, `read fully and follow`, `Read fully and execute:`, `Load fully and follow:`
    - [ ] **Phase 5 — Replace tool names:** apply the 7 tool replacements from the table (`Read tool` → `read the file at`, `Edit tool` → `edit the file at`, etc.). The Skill tool is stripped entirely (replace with empty string or a marker comment — see "Skill tool handling" in Dev Notes).
    - [ ] **Phase 6 — Substitute config vars:** replace each of the 6 universal vars with `[your X]` square-bracket prompts
    - [ ] **Phase 7 — Collapse whitespace:** after all the strips and replaces, collapse multiple blank lines (`\n\n\n+` → `\n\n`) and trim the result
  - [ ] Each phase produces a transformed string that the next phase consumes — pure functional, no side effects
  - [ ] Order matters: frontmatter must be stripped BEFORE tag stripping (otherwise XML-like content inside frontmatter could leak), tag stripping BEFORE line filtering (otherwise multiline tags get partially stripped), etc.

- [ ] Task 6: Wire it all together in `exportSkill()` (AC: #1, #6, #7)
  - [ ] Implement the main `exportSkill(skillName, projectRoot, options)` function:
    1. Load skill source via `loadSkillSource()`
    2. Check tier — if not `standalone`, throw clear error per AC #6
    3. Load persona via `loadPersona()`
    4. Run all 7 section extractors
    5. Assemble the canonical `instructions.md` content by concatenating section outputs
    6. Apply final pass of transformations (in case extractors missed something)
    7. Return `{ instructions, persona, sections: { title, persona, whenToUse, inputs, howToProceed, whatYouProduce, qualityChecks }, warnings }`
  - [ ] No console.log output unless `options.verbose` is true (the engine is silent by default — sp-2-3's CLI handles user output)

- [ ] Task 7: Write export engine tests (AC: #9)
  - [ ] Create `tests/lib/portability-export-engine.test.js`
  - [ ] **Test 1:** `exportSkill('bmad-brainstorming', findProjectRoot())` returns object with all 4 keys
  - [ ] **Test 2:** Result's `instructions` contains all 7 section headings in order. Use the `RegExp.exec().index` pattern from sp-2-1's Test 2 (P2 fix) — do NOT use `indexOf(m[0])`.
  - [ ] **Test 3:** Result's `instructions` contains zero forbidden strings. Reuse the expanded forbidden-string list from sp-2-1's Test 3 (19 entries including bmad-speak, _bmad/, .claude/hooks, etc.).
  - [ ] **Test 4:** Result's `instructions` contains zero curly-brace placeholders.
  - [ ] **Test 5:** Result's `persona.name === 'Carson'` and `persona.icon === '🧠'`
  - [ ] **Test 6:** `exportSkill('bmad-create-prd', ...)` throws an error containing the word `tier` and `light-deps` or `standalone`
  - [ ] **Test 7:** `exportSkill('bmad-dev-story', ...)` throws an error containing `tier` and `pipeline` or `standalone`
  - [ ] **Test 8:** `exportSkill` is read-only — snapshot directory mtime / git status before and after the call, assert no diff
  - [ ] **Test 9:** Carson's export produces `warnings.length === 0` (gold-standard skill should produce zero warnings)

- [ ] Task 8: Run regression suite + verify (AC: #1-9)
  - [ ] `npx jest tests/lib/portability-schema.test.js tests/lib/portability-classification.test.js tests/lib/portability-validation.test.js tests/lib/portability-canonical-format.test.js tests/lib/portability-export-engine.test.js`
  - [ ] All tests pass (29 existing + 9 new = 38 minimum)
  - [ ] `node scripts/convoke-doctor.js` — same baseline (2 pre-existing issues OK)
  - [ ] Manual smoke check: write a tiny script that calls `exportSkill('bmad-brainstorming', findProjectRoot())` and prints the resulting `instructions` to stdout. Eyeball it — does it look like a usable instructions file? If yes, the engine works. If no, iterate. (This is a sanity check, not a checked-in test.)

## Dev Notes

### Architecture Compliance (CRITICAL)

- **Read-only operation.** The export engine MUST NOT modify any files. It returns transformed strings; the CLI (sp-2-3) handles file output.
- **CommonJS only.** Use `require()`. Match existing codebase convention.
- **No new npm dependencies.** Only `fs`, `path`, and existing project utilities.
- **`findProjectRoot()` from `scripts/update/lib/utils.js`** — never `process.cwd()`.
- **Build on Epic 1 + sp-2-1 foundation:**
  - Reuse `manifest-csv.js` (sp-1-2 + sp-1-3) for parsing
  - Reuse the `findFileInSubtree` pattern from `validate-classification.js` for relative step-file resolution (Epic 1 retro action item A2)
  - Match the canonical format from `scripts/portability/templates/canonical-format.md` (sp-2-1)
  - Measure success against `scripts/portability/templates/canonical-example.md` (sp-2-1)
- **Tier 1 only.** This story exports `standalone` skills. Tier 2 (light-deps) is sp-5-1's territory; Tier 3 (pipeline) is never exported.

### Why a separate engine module (not part of the CLI)

Splitting `export-engine.js` from `convoke-export.js` (the CLI in sp-2-3) gives us:
- **Testability** — the engine is pure-transform, easy to unit-test with no filesystem mocking
- **Reusability** — sp-2-4 (batch export) and sp-3-1 (catalog generator) can call the engine directly without going through the CLI
- **Single responsibility** — the engine transforms; the CLI handles I/O, args, and user feedback

This is the same pattern as Epic 1: classifier (`classify-skills.js`) + validator (`validate-classification.js`) are separate from any future CLI wrapper.

### Persona matching strategy (Task 2)

The skill manifest contains entries like `bmad-brainstorming` (the skill), but the persona for Carson lives in the agent manifest under `bmad-cis-agent-brainstorming-coach` (the agent). The engine needs to match skill → agent. Strategy in priority order:

1. **Exact name match:** `agentManifest.find(a => a.name === skillName)` — handles cases where the skill IS the agent (e.g., `bmad-agent-pm`)
2. **`bmad-cis-agent-*` pattern:** for CIS skills, the agent is named `bmad-cis-agent-<thing>` while the skill is named `bmad-cis-<thing>` or `bmad-<thing>`. Try transforming the skill name to find the agent. For example: `bmad-brainstorming` → look up `bmad-cis-agent-brainstorming-coach`.
3. **Description fuzzy match:** if the skill description mentions a persona name in quotes (e.g., "talk to Carson"), look up that name in the agent manifest's `displayName` column.
4. **Inline extraction fallback:** if no agent row is found, parse the skill's SKILL.md/workflow.md for inline persona markers (`**Your Role:**`, `**Identity:**`, etc.). Many older skills have inline personas instead of separate agent rows.

**No 5th strategy.** If all 4 fail, the engine throws `"<skill-name> has no resolvable persona — strategies 1-4 all failed. Add a row to agent-manifest.csv or inline a persona block in the skill source."` This is the **fail-loud** behavior — sp-2-4 will revisit if a true utility skill (e.g., `bmad-shard-doc`) needs special handling, but sp-2-2 doesn't speculate about it. (Fix 4 from sp-2-2 review.)

For sp-2-2's scope, both `bmad-brainstorming` (Carson, exercises strategies 1-3) and `bmad-cis-agent-storyteller` (Sophia, exercises strategy 1 directly) must resolve cleanly.

### Skill tool handling (Phase 5 of transformations)

Per `canonical-format.md`, the `Skill tool` reference is stripped (not replaced with a generic verb) because chained-skill invocations don't make sense in standalone exports. But "stripping" is ambiguous:

- **Option A:** delete the entire line containing `Skill tool` (loses surrounding context)
- **Option B:** delete just the `Skill tool` token, leave the rest of the line (may produce broken sentences)
- **Option C:** replace with `<!-- chained skill stripped -->` HTML comment (preserves position, signals what happened)

**Recommendation:** Option A (delete the entire line). If a step says "Use the Skill tool to invoke bmad-help", that whole instruction is meaningless in a standalone export. Cleaner to drop it.

If sp-2-2 finds that Option A produces too-aggressive deletion (e.g., a single line contains both a Skill tool reference and other content), fall back to Option C and document the change in Completion Notes.

### Sources of Carson-specific extraction logic

For Task 3's section extractors, the engine needs to know **where** to find each piece of canonical content in the source files. Carson's source has these specific markers:

| Canonical section | Source location |
|---|---|
| Title | Skill name (`bmad-brainstorming`) + persona name (`Carson`) |
| Persona | Agent manifest row (cis/bmad-cis-agent-brainstorming-coach) |
| When to use | Skill manifest `description` column + `**Goal:**` line in workflow.md |
| Inputs you may need | `### Configuration Loading` block in workflow.md, plus `context_file` reference |
| How to proceed | step-01-session-setup.md through step-04-idea-organization.md (8 step files total, 4 of which are branching technique-selection branches) |
| What you produce | `brainstorming_session_output_file` reference + template.md content |
| Quality checks | `## SUCCESS METRICS` blocks in step files (rename to "Quality checks" since "metrics" implies measurement) |

The engine should be **general** enough to handle any Tier 1 skill, not Carson-specific. Use Carson as the test case but write generic extractors that look for these structural markers wherever they appear.

### Open questions deferred from sp-2-1

`canonical-format.md` listed 6 open questions sp-2-2 must resolve empirically:

1. **Conditional steps:** how to handle `<check if="...">` branching?
   - **Resolution for sp-2-2:** convert to "If X, then Y" prose. If the conditional is shallow (one fork), inline both branches. If deep (>2 levels), present only the happy path and add a warning.
2. **Menu structures:** preserve verbatim or rewrite?
   - **Resolution for sp-2-2:** preserve verbatim. Menus like `[A] Option, [B] Option, [C] Continue` are LLM-friendly and don't depend on Claude-specific UI.
3. **Hook script references (`.claude/hooks/*`):** strip or annotate?
   - **Resolution for sp-2-2:** strip the entire line containing the hook reference. Add to `warnings` array. Document the count in completion notes.
4. **Multi-tier exports / Template section:** sp-5-1's job, not sp-2-2's. Skip.
5. **Relative-template paths from sp-1-2:** Epic 1 retro action item A2 says reuse `findFileInSubtree`. Done — Task 2 imports it.
6. **`bmad-speak` and similar hooks:** strip the line, add to warnings. Same as #3.

These resolutions are NOT locked — sp-2-2's dev agent can revise them empirically while building the engine if any prove unworkable. Document any changes in Completion Notes.

### Edge cases the test suite catches

| Edge case | Test that catches it |
|---|---|
| Engine writes a file (would be a bug) | Test 8 — directory snapshot before/after |
| Engine produces fewer than 7 sections | Test 2 — heading order check fails |
| Engine leaks `bmad-init` or other framework strings | Test 3 — forbidden string check |
| Engine forgets to substitute `{user_name}` | Test 4 — curly placeholder check |
| Engine mis-resolves Carson's persona | Test 5 — persona name + icon check |
| Engine accepts a Tier 2 skill | Test 6 — bmad-create-prd should throw |
| Engine accepts a Tier 3 skill | Test 7 — bmad-dev-story should throw |
| Engine produces unexpected warnings on the gold standard | Test 9 — Carson should produce 0 warnings |

### Source Files to Touch

| Path | Action | Purpose |
|------|--------|---------|
| `scripts/portability/export-engine.js` | Create | The pure-transform export engine |
| `tests/lib/portability-export-engine.test.js` | Create | 9 engine tests |

### Out of Scope (Do NOT do in this story)

- Building the CLI wrapper (sp-2-3)
- Running the engine against all Tier 1 skills (sp-2-4)
- Building the catalog generator (Epic 3)
- Writing per-skill READMEs (sp-3-2)
- Building platform adapters for Copilot/Cursor (sp-5-2)
- Inlining templates from Tier 2 skills (sp-5-1)
- Writing files to disk — engine is pure transform
- Modifying any agent files, workflow files, classifier, validator, manifest-csv, or sp-2-1 template files
- Re-running the validator or classifier
- Adding new transformation rules beyond what's in canonical-format.md (locked vocabulary)
- Optimizing for any skill other than Carson — sp-2-4 will exercise the broader Tier 1 set

### Story Foundation (Epic 2, Story 2 of 4)

This is the engine story. After completion:
- sp-2-3 (CLI) wraps `exportSkill()` in command-line argument parsing + file output
- sp-2-4 (batch) calls `exportSkill()` in a loop over all Tier 1 skills + writes results to a target directory
- sp-3-1 (catalog) consumes the engine output for the catalog generator

Get the engine right here — sp-2-3 and sp-2-4 are thin wrappers around it.

### Action items from sp-epic-1 retro applied

| Action item | How this story applies it |
|---|---|
| **A1** (document expected artifact-consumption patterns) | N/A — engine builds, doesn't classify |
| **A2** (Epic 2 must handle relative-template paths via subtree search) | Task 2 explicitly reuses `findFileInSubtree` from `validate-classification.js` — no reinvention |
| **A3** (verify referenced files exist when ACs name canonical sets) | Task 7 names specific test skills (`bmad-brainstorming`, `bmad-create-prd`, `bmad-dev-story`); all 3 verified to exist in the manifest |
| **A4** (enumerate negative cases in heuristic tables) | AC #6 explicitly enumerates the negative cases (Tier 2 → throw, Tier 3 → throw) |

### Action items from sp-2-1 retro applied (post-implementation)

| Action item | How this story applies it |
|---|---|
| **Logged for Epic 2 retro** ("file separate drift-fix story for orthogonal test breakage") | Documented here so I remember: if sp-2-2's regression run surfaces a pre-existing manifest drift, file a separate story instead of in-line fixing. |

### References

- [vision-skill-portability.md](../planning-artifacts/vision-skill-portability.md) — vision doc
- [epics-skill-portability.md](../planning-artifacts/epics-skill-portability.md#story-22-export-engine) — Epic 2 Story 2.2 original AC
- [_bmad/_config/portability-schema.md](../../_bmad/_config/portability-schema.md) — schema reference
- [scripts/portability/templates/canonical-format.md](../../scripts/portability/templates/canonical-format.md) — sp-2-1 spec
- [scripts/portability/templates/canonical-example.md](../../scripts/portability/templates/canonical-example.md) — Carson's hand-authored gold standard
- [sp-2-1-canonical-format-specification.md](sp-2-1-canonical-format-specification.md) — Story 2.1 (spec)
- [sp-epic-1-retro-2026-04-09.md](sp-epic-1-retro-2026-04-09.md) — Epic 1 retro action items
- `scripts/portability/manifest-csv.js` — CSV parser/writer (sp-1-2 Task 8)
- `scripts/portability/validate-classification.js` — `findFileInSubtree` source (sp-1-3, A2-applied)
- `_bmad/core/bmad-brainstorming/SKILL.md` + `workflow.md` + `steps/*.md` — Carson's source files

## Dev Agent Record

### Agent Model Used

(to be filled by dev agent)

### Debug Log References

### Completion Notes List

### File List
