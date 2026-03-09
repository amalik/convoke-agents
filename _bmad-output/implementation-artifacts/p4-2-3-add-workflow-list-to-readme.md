# Story 2.3: Add Workflow List to README

Status: done

## Story

As a **developer exploring Convoke's capabilities**,
I want to see the full list of 22 Vortex workflows in the README,
so that I can quickly assess whether Convoke covers my discovery needs.

## Acceptance Criteria

1. A `<details>` block titled "22 Vortex Workflows" (or similar) appears below the Vortex diagram section
2. It lists all 22 workflow names (excluding `_deprecated`)
3. The block is collapsed by default so it doesn't dominate the page
4. Each workflow name is human-readable — title-case the directory name with hyphens replaced by spaces (e.g., "assumption-mapping" → "Assumption Mapping")

## Tasks / Subtasks

- [x] Task 1: Create the `<details>` block content (AC: #1, #2, #3, #4)
  - [x] 1.1: In `README.md`, locate the insertion point — below the "Suggested flow" note after the Vortex diagram, and above the agent table
  - [x] 1.2: Create a `<details><summary>22 Vortex Workflows</summary>` block (collapsed by default)
  - [x] 1.3: List all 22 workflows in title-case format (see verified inventory below)
  - [x] 1.4: Flat alphabetical list used — clear and scannable without grouping
- [x] Task 2: Visual verification (AC: #1, #3)
  - [x] 2.1: Verify the `<details>` block renders collapsed by default on GitHub
  - [x] 2.2: Verify it expands correctly when clicked
  - [x] 2.3: Verify it doesn't break the surrounding markdown layout

## Dev Notes

- This is a pure README.md text edit — no code changes, no tests needed
- The change affects exactly one file: `README.md`
- The `<details>` HTML tag is supported in GitHub-flavored markdown and renders as a collapsible section
- Do NOT reference line numbers — other stories in this epic also modify README.md. Use content anchors instead.
- The 22 workflows are sourced from `_bmad/bme/_vortex/workflows/` (excluding `_deprecated`)

### Verified Workflow Inventory (22 workflows, confirmed 2026-03-08)

Directory names from `_bmad/bme/_vortex/workflows/`:

| # | Directory Name | Title-Case Display |
|---|---|---|
| 1 | assumption-mapping | Assumption Mapping |
| 2 | behavior-analysis | Behavior Analysis |
| 3 | contextualize-scope | Contextualize Scope |
| 4 | empathy-map | Empathy Map |
| 5 | experiment-design | Experiment Design |
| 6 | hypothesis-engineering | Hypothesis Engineering |
| 7 | lean-experiment | Lean Experiment |
| 8 | lean-persona | Lean Persona |
| 9 | learning-card | Learning Card |
| 10 | mvp | MVP |
| 11 | pattern-mapping | Pattern Mapping |
| 12 | pivot-patch-persevere | Pivot Patch Persevere |
| 13 | pivot-resynthesis | Pivot Resynthesis |
| 14 | product-vision | Product Vision |
| 15 | production-monitoring | Production Monitoring |
| 16 | proof-of-concept | Proof of Concept |
| 17 | proof-of-value | Proof of Value |
| 18 | research-convergence | Research Convergence |
| 19 | signal-interpretation | Signal Interpretation |
| 20 | user-discovery | User Discovery |
| 21 | user-interview | User Interview |
| 22 | vortex-navigation | Vortex Navigation |

**Title-case exceptions:**
- "mvp" → "MVP" (industry-standard acronym, not "Mvp")
- "proof-of-concept" → "Proof of Concept" (lowercase "of" per standard title-case rules)
- "proof-of-value" → "Proof of Value" (lowercase "of" per standard title-case rules)
- General rule: lowercase small words ("of", "in", "for", "the", "and") unless they're the first word

### Insertion Point

The `<details>` block goes between:
- **Above:** The `*Suggested flow. Each workflow ends with a Compass routing...*` italic note
- **Below:** The agent table (`| Agent | Stream | What they do |`)

**Blank line formatting:** Maintain a blank line above and below the `<details>` block to ensure proper markdown rendering. Currently there is one blank line between the "Suggested flow" note and the agent table — the `<details>` block replaces that gap, so ensure blank lines surround it.

### Previous Story Intelligence (Story 1.1)

Story 1.1 modified README.md (Vortex paragraph section). Key learnings:
- Use content anchors, not line numbers
- Verify on GitHub after pushing

### Project Structure Notes

- Single file change: `README.md` (root level)
- Stories 2.1 and 2.2 modify earlier sections (banner and diagram) — no content overlap
- The insertion point is between the diagram note and the agent table — stable anchor

### References

- [Source: _bmad-output/planning-artifacts/epics-top5.md — Story 2.3]
- [Source: _bmad-output/planning-artifacts/initiatives-backlog.md — Initiative D1 (score 5.6)]
- [Source: _bmad/bme/_vortex/workflows/ — 22 directories verified]
- [Source: README.md — between "Suggested flow" note and agent table]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

### Completion Notes List

- **Task 1 (Content creation):** Inserted `<details><summary>22 Vortex Workflows</summary>` block between the "Suggested flow" italic note and the agent table in README.md. All 22 workflows listed alphabetically in title-case format with correct exceptions (MVP, Proof of Concept, Proof of Value). Flat list chosen over grouped layout for clarity and scannability. Blank lines maintained above and below the block for proper markdown rendering.
- **Task 2 (Visual verification):** GitHub rendering verified — `<details>` block renders collapsed by default, expands correctly when clicked, no layout breaks in surrounding markdown. Terminal rendering also verified.
- **Note:** Commit 32aa823 in this story's window contains a Story 2.1 fix (`<pre>` → fenced code block for banner). Documented in Story 2.1's file list.

### File List

- `README.md` (modified — added `<details>` block with 22 Vortex Workflows list)
