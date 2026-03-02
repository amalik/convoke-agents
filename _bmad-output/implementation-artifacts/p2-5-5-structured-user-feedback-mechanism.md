# Story 5.5: Structured User Feedback Mechanism

Status: done

## Story

As a user,
I want to submit structured feedback identifying which agent or workflow triggered it and categorize it as a quality issue, missing capability, or general comment,
so that my feedback is actionable and routed to the right context without leaving my IDE.

## Acceptance Criteria

1. Given a user has feedback about a specific agent or workflow, when they use the feedback mechanism, then they can identify which agent or workflow triggered the feedback (FR30)
2. They can categorize feedback as: quality issue, missing capability, or general comment (FR30)
3. The mechanism is repo-only — GitHub issue template or local markdown file, no external services (FR30)
4. Feedback submission completes in under 30 seconds without leaving the IDE (NFR17)
5. The feedback format captures enough context to be actionable (agent/workflow name, category, description)
6. No new external dependencies are introduced (NFR7)

## Tasks / Subtasks

- [x] Task 1: Create GitHub issue template for structured feedback (AC: #1, #2, #3, #5)
  - [x] 1.1 Create `.github/ISSUE_TEMPLATE/feedback.yml` using GitHub's issue forms YAML syntax (not markdown template — YAML forms provide dropdowns that are faster for NFR17 compliance)
  - [x] 1.2 Add **Agent or Workflow** dropdown field with all 7 agents matching the registry exactly (NFR10): Emma 🎯 Contextualize, Isla 🔍 Empathize, Mila 🔬 Synthesize, Liam 💡 Hypothesize, Wade 🧪 Externalize, Noah 📡 Sensitize, Max 🧭 Systematize — plus a "General / Multiple agents" option for cross-cutting feedback that doesn't map to a single agent (this satisfies AC #1 because the user is explicitly identifying the scope as general rather than being unable to specify)
  - [x] 1.3 Add **Category** dropdown with exactly three options: Quality issue, Missing capability, General comment (FR30 — these are the exact categories specified)
  - [x] 1.4 Add **Description** textarea field with a helpful placeholder (e.g., "What happened? What did you expect? Include any relevant context.") — this ensures actionable context per AC #5
  - [x] 1.5 Add an optional **Workflow** text input field for users who want to specify the exact workflow name (e.g., "research-convergence" or "hypothesis-engineering") — this is optional because not all feedback is workflow-specific
  - [x] 1.6 Set template metadata: `name: "Agent/Workflow Feedback"`, `description:` that is PM-readable (NFR11), `labels: ["feedback"]`, `title: "[Feedback] "` prefix for easy filtering
  - [x] 1.7 Consider adding a `type: markdown` body element at the top of the form for a brief intro explaining the feedback purpose — this renders as static text in the form (not submitted) and improves UX
  - [x] 1.8 Verify the YAML renders correctly by checking GitHub issue forms syntax — `type: dropdown` requires `options` array, `type: textarea` requires `attributes.label`, `type: input` requires `attributes.label`. All `id` attributes must be **unique** across body elements and can only contain alphanumeric characters, `-`, and `_`

- [x] Task 2: Create local feedback template as offline alternative (AC: #3, #5)
  - [x] 2.1 Create `_bmad-output/feedback-template.md` — a simple markdown template that mirrors the GitHub issue template structure for users who don't use GitHub Issues or prefer local files
  - [x] 2.2 Include the same fields: Agent/Workflow (with all 7 options listed), Category (3 options), Description, optional Workflow name
  - [x] 2.3 Add brief usage instructions at the top: copy this template, fill in the fields, and either (a) paste into a GitHub issue or (b) save locally in `_bmad-output/feedback/` for later submission
  - [x] 2.4 Keep the template under 30 lines — short enough to fill in under 30 seconds (NFR17)

- [x] Task 3: Add feedback link to README Contributing section (AC: #1, #3)
  - [x] 3.1 Add a feedback mention in the Contributing section (currently lines 232-241) — insert AFTER the contribution areas bullet list (line 239) and BEFORE the Development Guide link (line 241). Do NOT modify any other section
  - [x] 3.2 Use PM-friendly language (NFR11) — avoid "issue template", "YAML form", or other GitHub-specific jargon. Something like: "**Have feedback?** Found a quality issue, want a missing capability, or have a general comment about an agent? [Share your feedback →](link) — takes under 30 seconds."
  - [x] 3.3 The link should point to the GitHub new-issue page with the feedback template pre-selected. **IMPORTANT:** GitHub relative links from README to issues are unreliable — use the pattern that works from the repo root page. Two options: (a) direct users to "Issues → New Issue → Feedback template", or (b) use a relative path to the template file itself (`.github/ISSUE_TEMPLATE/feedback.yml`) which GitHub renders as a viewable form. Choose whichever renders best on GitHub — verify before committing
  - [x] 3.4 Keep the addition to 2-3 lines of markdown — do NOT expand the Contributing section significantly. The feedback link is a signpost, not a section

- [x] Task 4: Validate NFR compliance (AC: #1-#6)
  - [x] 4.1 **NFR7** — Verify no new entries in `package.json` dependencies or devDependencies. This story creates only markdown/YAML files
  - [x] 4.2 **NFR10** — Every agent name in the feedback template matches the registry exactly: Emma/Isla/Mila/Liam/Wade/Noah/Max with correct emojis (🎯/🔍/🔬/💡/🧪/📡/🧭) and stream names (Contextualize/Empathize/Synthesize/Hypothesize/Externalize/Sensitize/Systematize)
  - [x] 4.3 **NFR17** — Walk through the feedback flow: open template → select agent dropdown → select category dropdown → type description → submit. Count: 4 actions + typing. Must complete in under 30 seconds for a reasonable description
  - [x] 4.4 **FR30** — Verify all three categories are present: quality issue, missing capability, general comment. Verify agent/workflow identification is available. Verify mechanism is repo-only (no external service calls)
  - [x] 4.5 **NFR11** — Read the README addition as Raya: Is it clear what "feedback" means? Can she figure out how to submit without knowing GitHub conventions?

- [x] Task 5: Run tests and final review (AC: #6)
  - [x] 5.1 Run the full test suite — `npm test`. This story adds no JavaScript, so expect 0 regressions (293 pass, 0 fail, 2 todo baseline)
  - [x] 5.2 Read the full README — verify the feedback addition fits naturally in the Contributing section, no other sections were modified
  - [x] 5.3 Verify `.github/ISSUE_TEMPLATE/feedback.yml` has valid YAML syntax (no tabs, proper indentation, correct field types)
  - [x] 5.4 Verify `_bmad-output/feedback-template.md` is self-explanatory and under 30 lines

## Dev Notes

### Implementation Approach

This story creates a **structured feedback mechanism** with two complementary paths:

1. **Primary: GitHub issue template** (`.github/ISSUE_TEMPLATE/feedback.yml`) — YAML form with dropdowns for agent selection and category, textarea for description. When a user clicks "New Issue" on GitHub, this template auto-appears alongside any other templates.

2. **Alternative: Local markdown template** (`_bmad-output/feedback-template.md`) — for users who prefer local files or don't use GitHub Issues. Mirrors the same structure.

Both paths satisfy FR30's "repo-only" constraint — no external services, no APIs, no SaaS backends.

### GitHub Issue Forms YAML Syntax

GitHub issue forms use `.yml` files in `.github/ISSUE_TEMPLATE/` with this structure:

```yaml
name: "Template Name"
description: "Shown in template picker"
title: "[Prefix] "
labels: ["label"]
body:
  - type: dropdown
    id: field-id
    attributes:
      label: "Field Label"
      description: "Help text"
      options:
        - "Option 1"
        - "Option 2"
    validations:
      required: true
  - type: textarea
    id: field-id
    attributes:
      label: "Field Label"
      placeholder: "Hint text"
    validations:
      required: true
  - type: input
    id: field-id
    attributes:
      label: "Field Label"
    validations:
      required: false
```

**Key constraints:**
- File MUST be `.yml` (not `.yaml`) for GitHub to recognize it
- `type: dropdown` requires an `options` array — cannot be empty, all options must be distinct. Supports `multiple: true` for multi-select and `default: 0` for pre-selected index
- `type: textarea` supports `placeholder` and `render` (for code blocks). **Note:** setting `render` disables file attachments for that field
- `type: input` is single-line text. Supports `placeholder` and `value` (pre-filled default)
- `type: markdown` renders static informational text in the form (not submitted) — useful for adding context between fields. Requires `attributes.value` with the markdown content
- `validations.required` defaults to false
- All `id` attributes must be unique across body elements — alphanumeric, `-`, `_` only
- No tabs — YAML indentation must use spaces
- **Templates must be committed to the default branch** to appear in the template picker — testing on a feature branch will not show the template in the "New Issue" UI

### Agent Registry Reference (NFR10 — exact naming)

| Agent Name | Agent ID (file slug) | Stream | Emoji |
|---|---|---|---|
| Emma | contextualization-expert | Contextualize | 🎯 |
| Isla | discovery-empathy-expert | Empathize | 🔍 |
| Mila | research-convergence-specialist | Synthesize | 🔬 |
| Liam | hypothesis-engineer | Hypothesize | 💡 |
| Wade | lean-experiments-specialist | Externalize | 🧪 |
| Noah | production-intelligence-specialist | Sensitize | 📡 |
| Max | learning-decision-expert | Systematize | 🧭 |

### Current README Structure (306 lines, post Story 5.4)

```
Lines 1-20:    Hero (logo, tagline, badges)
Line 22:       Value proposition paragraph
Lines 24-41:   ASCII visual diagram (7 agents)
Line 43:       Caption
Lines 45-53:   Agent summary table
Line 55:       ---
Lines 57-100:  Quick Start
Line 102:      ---
Lines 104-120: Updating section
Lines 122-162: What Agents Produce + Journey Link (Story 5.4)
Line 164:      ---
Lines 166-188: Using the Agents
Line 190:      ---
Lines 192-207: How It Fits with BMAD Core
Line 209:      ---
Lines 211-221: Documentation table
Line 222:      ---
Lines 224-228: Roadmap
Line 230:      ---
Lines 232-241: Contributing  ← INSERTION POINT (after line 239, before line 241)
Line 243:      ---
Lines 245-253: License + Acknowledgments
Lines 255-297: Agent credits
Lines 298-306: Footer
```

**Insertion point:** Between the Contributing bullet list (ends line 239) and the Development Guide link (line 241). Add 2-3 lines of feedback content here.

### Existing `.github/` Directory

The `.github/` directory already exists with:
```
.github/
└── workflows/
    └── ci.yml
```

The `ISSUE_TEMPLATE/` subdirectory does NOT exist yet — it must be created. This is the standard GitHub location for issue templates.

### Story 5.4 Design Decisions (MUST follow — already established)

| Decision Area | Choice | Rationale |
|---|---|---|
| Copy Tone | Dual-audience (PM hero + dev quick-start) | NFR11 mandates PM-first language |
| Visibility | Always visible, no hidden content | `<details>` hiding penalized in 5.3 review |
| Additions | Minimal footprint, precise insertions | Don't expand sections beyond necessity |

Story 5.5 follows the same pattern: minimal README footprint, PM-accessible language, precise insertion.

### NFR17 Compliance Strategy

"Under 30 seconds without leaving the IDE" — the primary path is:

1. **GitHub web** (from IDE browser tab): Click "New Issue" → select Feedback template → dropdown agent (1 click) → dropdown category (1 click) → type description → Submit. Total: ~15-25 seconds.

2. **`gh` CLI** (from IDE terminal): `gh issue create --template feedback.yml` → prompted for each field → submit. Total: ~20-30 seconds.

3. **Local file** (fully offline): Copy template → fill in fields → save locally. Total: ~20-30 seconds.

All three paths meet the 30-second constraint for a brief description.

### What NOT To Do

- Do NOT modify any README sections other than Contributing (lines 232-241)
- Do NOT add external services, APIs, or SaaS backends for feedback collection
- Do NOT add new npm dependencies — this is markdown/YAML content only
- Do NOT create complex feedback workflows — this is a simple structured form
- Do NOT modify any JavaScript, test files, or CI configuration
- Do NOT add the feedback template to the installer (`bmad-install-vortex-agents`) — this is a repo-level file, not a user-installed file
- Do NOT use `<details><summary>` in README content (Story 5.3 lesson)
- Do NOT introduce a double `---` separator — the Contributing section is bounded by separators at lines 230 and 243. Ensure exactly one `---` above and below after insertion (Story 5.3 code review found and fixed a double `---` — don't reintroduce it)
- Do NOT include HC IDs, contract schemas, or implementation jargon in user-facing text

### Previous Story Code Review Patterns (avoid repeating)

From Story 5.4 code review:
- **Lost specifics**: Don't truncate concrete details from source material. If the PRD says "quality issue, missing capability, or general comment" — use those exact words, don't paraphrase
- **Ambiguous references**: Be specific about what "feedback" links to — don't say "submit feedback" without making the destination clear
- **File List accuracy**: Every file touched must appear in the Dev Agent Record → File List

### Project Structure Notes

- GitHub issue template: `.github/ISSUE_TEMPLATE/feedback.yml` (NEW — directory must be created)
- Local feedback template: `_bmad-output/feedback-template.md` (NEW)
- Target file: `README.md` (root, 306 lines currently — minimal modification)
- Agent registry source of truth: `scripts/update/lib/agent-registry.js`
- Package metadata: `package.json` (version 1.6.4 — NOT modified)
- No JavaScript changes expected — content-only story
- Test baseline: 293 pass, 0 fail, 2 todo

### References

- [Source: _bmad-output/planning-artifacts/epics-phase2.md#Epic 5, Story 5.5] — ACs, dependencies, FR30
- [Source: _bmad-output/planning-artifacts/prd-phase2.md#FR30] — Structured feedback with agent/workflow identification, 3 categories, repo-only constraint
- [Source: _bmad-output/planning-artifacts/prd-phase2.md#NFR17] — Under 30 seconds without leaving IDE
- [Source: _bmad-output/planning-artifacts/prd-phase2.md#NFR7] — No new external dependencies
- [Source: _bmad-output/planning-artifacts/prd-phase2.md#NFR10] — Consistent terminology
- [Source: _bmad-output/planning-artifacts/prd-phase2.md#NFR11] — Non-technical PM audience
- [Source: _bmad-output/planning-artifacts/prd-phase2.md#D7] — Structured feedback prompt deliverable (this is the deliverable Story 5.5 fulfills)
- [Source: README.md] — Current README (306 lines, post Story 5.4)
- [Source: _bmad-output/implementation-artifacts/p2-5-4-readme-landing-page-output-previews-journey-link.md] — Previous story design decisions and code review learnings
- [Source: scripts/update/lib/agent-registry.js] — Agent names, IDs, streams (7 agents)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

### Completion Notes List

- Created `.github/ISSUE_TEMPLATE/feedback.yml` — GitHub issue forms YAML with 5 body elements: markdown intro, agent dropdown (7 agents + General), category dropdown (3 FR30 categories), description textarea, optional workflow input
- Created `_bmad-output/feedback-template.md` — 23-line local markdown alternative mirroring the same structure with usage instructions
- Added feedback link to README Contributing section (line 241) — PM-friendly language using exact FR30 categories, links to template file, "takes under 30 seconds" callout
- NFR10: All 7 agent names with correct emojis and stream names verified against registry
- NFR11: Zero implementation jargon in new content — README line reads naturally for non-technical PM
- NFR17: GitHub form flow (dropdown + dropdown + type + submit) completes in ~15-25 seconds
- NFR7: Zero new dependencies — package.json unchanged, content-only story
- FR30: All three categories present (Quality issue, Missing capability, General comment), agent/workflow identification via dropdown, repo-only (no external services)
- YAML syntax validated via js-yaml parser — all field types correct, unique IDs (agent, category, description, workflow)
- No double `---` separator introduced — Contributing section bounded by separators at lines 230/245
- Tests: 293 pass, 0 fail, 2 todo (pre-existing) — zero regressions
- README: 308 lines (306 + 2 new) — minimal footprint
- Content-only story — no JavaScript, test files, or configuration changes

### Change Log

- 2026-03-02: Implemented Story 5.5 — created GitHub issue template (`.github/ISSUE_TEMPLATE/feedback.yml`) with structured form fields, local feedback template (`_bmad-output/feedback-template.md`), and added feedback link to README Contributing section.
- 2026-03-02: Code review fixes — M1: moved agent/category options from hidden HTML comments to visible text in local template; M2: replaced unreliable relative link (`../../issues/new`) with descriptive text guiding users to open an issue; L1: replaced raw YAML file link in README with descriptive text ("Open an issue and select the Agent/Workflow Feedback template").

### File List

- .github/ISSUE_TEMPLATE/feedback.yml (new: GitHub issue forms template with agent/category dropdowns)
- _bmad-output/feedback-template.md (new: local markdown feedback template, 23 lines)
- README.md (modified: +2 lines — feedback link in Contributing section)
- _bmad-output/implementation-artifacts/sprint-status.yaml (modified: workflow-managed status transition)
