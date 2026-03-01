# Story 5.4: README Landing Page — Output Previews & Journey Link

Status: done

## Story

As a new user evaluating BMAD,
I want to see example output previews showing what agents actually produce and reach the journey example in one click,
so that I can see real results before installing and dive deeper when ready.

## Acceptance Criteria

1. Given the README landing page from Story 5.3 exists with value proposition and visual overview, when the new user scrolls past the initial overview, then they see example output previews showing what at least 2-3 representative agents actually produce (FR27)
2. Previews use real artifacts from the journey example (Epic 4) or representative samples — not fabricated content
3. A clearly visible link reaches the full journey example in one click (FR29) — the link target is `_bmad-output/journey-examples/busy-parents-7-agent-journey.md`
4. The link target (journey example from Epic 4) exists and is accessible from the README (relative path must resolve correctly on GitHub)
5. Output previews avoid implementation jargon and are understandable by a non-technical PM (NFR11) — no HC IDs, no "handoff contracts", no "manifest merge" in preview text
6. All agent names referenced in previews match the registry exactly (NFR10) — see Agent Registry Reference below

## Tasks / Subtasks

- [x] Task 1: Select representative agents and extract preview content (AC: #1, #2, #5)
  - [x] 1.1 Read the complete journey example at `_bmad-output/journey-examples/busy-parents-7-agent-journey.md` (944 lines) — understand the structure and identify the best preview excerpts
  - [x] 1.2 Select 2-3 agents that represent the breadth of the discovery flow. Recommended selection covering start, middle, and end: (a) **Emma** — lean persona / Job-to-be-Done output (relatable problem framing), (b) **Liam** — hypothesis contract (testable ideas), (c) **Max** — learning card / pivot decision (outcomes). Alternative choices are acceptable if better excerpts exist
  - [x] 1.3 For each selected agent, extract a BRIEF preview excerpt (5-15 lines each) that: (a) shows concrete output — what the agent actually produces, not what it does abstractly, (b) uses real text from the journey example — do NOT fabricate sample content, (c) is self-contained — a PM can understand it without reading the full journey, (d) avoids HC IDs, contract schemas, or implementation terminology
  - [x] 1.4 Write a brief intro sentence for each preview that tells Raya what she's looking at. Example: "Emma helps you frame the right problem. Here's the Job-to-be-Done she produced for a busy parents meal planning project:"

- [x] Task 2: Insert output previews at the designated insertion point (AC: #1, #5)
  - [x] 2.1 Replace `<!-- STORY-5.4: Output Previews Section -->` at README line 122 with the output previews section. The HTML comment gets REPLACED, not appended to
  - [x] 2.2 Add a section header — use `## What Agents Produce` or similar benefit-oriented heading. Do NOT use "Output Previews" (jargon) or "Example Artifacts" (jargon)
  - [x] 2.3 Use markdown blockquotes (`>`) for the preview excerpts — these render well on GitHub, are always visible (not hidden), and visually distinguish preview content from README prose. Do NOT use `<details><summary>` — Story 5.3 established that hiding content works against discoverability
  - [x] 2.4 Each preview block: agent name + emoji + stream name as heading → brief intro sentence → blockquoted excerpt from journey example
  - [x] 2.5 Keep total preview section to ~30-40 lines of markdown — enough to be compelling, short enough not to push the journey link off-screen

- [x] Task 3: Insert journey example link at the designated insertion point (AC: #3, #4)
  - [x] 3.1 Replace `<!-- STORY-5.4: Journey Example Link -->` at README line 124 with the journey link. The HTML comment gets REPLACED
  - [x] 3.2 The link must point to: `_bmad-output/journey-examples/busy-parents-7-agent-journey.md` — this relative path resolves correctly on GitHub
  - [x] 3.3 Make the link prominent and clearly visible — not buried in a paragraph. Use a standalone line with visual emphasis (bold, emoji, or callout formatting). Raya should see this link without hunting. Example format: `**[See the complete 7-agent journey example →](_bmad-output/journey-examples/busy-parents-7-agent-journey.md)**`
  - [x] 3.4 Add a brief sentence explaining what the journey example is: a complete walkthrough of all 7 agents applied to a real domain (busy parents meal planning). Avoid "artifacts", "handoff contracts", or "HC" terminology
  - [x] 3.5 Verify the link target exists and is accessible: run `test -f _bmad-output/journey-examples/busy-parents-7-agent-journey.md`

- [x] Task 4: Validate NFR10 and NFR11 compliance (AC: #5, #6)
  - [x] 4.1 Every agent name in the new content matches the registry: Emma/Isla/Mila/Liam/Wade/Noah/Max with correct emojis and stream names
  - [x] 4.2 Preview text contains zero implementation jargon: no HC IDs, no "handoff contract", no "manifest", no "artifact contract", no "compass routing"
  - [x] 4.3 Read the new sections as Raya: Can she understand what these previews show? Does the journey link make her want to click?

- [x] Task 5: Final review (AC: #1-#6)
  - [x] 5.1 Read the full README from top to bottom — verify the previews and journey link fit naturally in the landing page flow
  - [x] 5.2 Verify no existing sections were accidentally modified or deleted (Quick Start, Updating, Using the Agents, etc.)
  - [x] 5.3 Verify the `---` separator between the previews section and "Using the Agents" still exists and there is no double-separator issue (Story 5.3 code review found and fixed a double `---` — don't reintroduce it)
  - [x] 5.4 Count total README lines — Story 5.3 left the README at ~270 lines. Adding ~35-45 lines of previews + link should keep it under ~320 lines, which is reasonable

## Dev Notes

### Story 5.3 Design Decisions (MUST follow — already implemented)

| Decision Area | Choice | Rationale |
|---|---|---|
| Layout Format | Single-page with restructured sections | Works everywhere (GitHub, npm, terminal) |
| Visual Approach | ASCII diagram (simplified) | Zero dependencies, renders in every context |
| Copy Tone | Dual-audience (PM hero + dev quick-start) | NFR11 mandates PM-first hero, devs need Quick Start |

Story 5.4 content MUST follow the same dual-audience tone: PM-accessible previews with developer-accessible journey link.

### Current README Structure (post Story 5.3, ~270 lines)

```
Lines 1-20:   Hero (logo, tagline, badges)
Line 22:      Value proposition paragraph
Lines 24-41:  ASCII visual diagram (7 agents)
Line 43:      Caption
Lines 45-53:  Agent summary table
Line 55:      ---
Lines 57-100: Quick Start (prerequisites, install, activate, what gets installed)
Line 102:     ---
Lines 104-120: Updating section
Line 122:     <!-- STORY-5.4: Output Previews Section -->  ← REPLACE THIS
Line 124:     <!-- STORY-5.4: Journey Example Link -->     ← REPLACE THIS
Line 126:     ---
Lines 128-150: Using the Agents (detailed descriptions, user guides)
Line 152:     ---
Lines 154-169: How It Fits with BMAD Core
Lines 171+:   Documentation, Roadmap, Contributing, License, Acknowledgments
```

The two HTML comments at lines 122 and 124 are the ONLY locations where new content goes. Everything else is preserved exactly.

### Journey Example Source (944 lines)

File: `_bmad-output/journey-examples/busy-parents-7-agent-journey.md`

Structure:
- Title: "The Busy Parents Journey: A Complete 7-Agent Vortex Walkthrough"
- Domain: Busy Parents Meal Planning
- Sections: How This Journey Works → Emma → Isla → Mila → Liam → Wade → Noah → Max → Conclusion
- Each agent section has: description → captured artifact (YAML frontmatter) → what happens next

**Recommended preview excerpts** (dev agent should read the full file and verify these are the best choices):

1. **Emma (Contextualize)** — Lines ~48-57: The executive summary from the lean persona. Contains the Job-to-be-Done statement: "When I arrive home after a full workday with hungry children asking 'what's for dinner?', I want to know exactly what to make..." — highly relatable, zero jargon, shows concrete output
2. **Liam (Hypothesize)** — Lines ~518-530: Hypothesis 1 "Pre-Commute Decision Eliminator" — the 4-field contract with hypothesis statement showing how problems become testable ideas. **WARNING:** The Rationale field at ~line 527 contains "HC2" and "HC1" references (e.g., "HC2 shows decision fatigue is the primary barrier") — these MUST be stripped or reworded before use in preview text (NFR11 violation). Rewrite as plain English, e.g., "Research shows decision fatigue is the primary barrier"
3. **Max (Systematize)** — Lines ~890-906: The Strategic Decision section — "Recommendation: PATCH (iterate on timing, don't pivot direction)" followed by three concrete actions. Shows the final outcome PMs care about: a clear decision with next steps. The full learning card spans lines ~843-923 but the decision section alone is the most compelling excerpt

If these specific excerpts don't work well in preview form (too long, too much YAML frontmatter, too much jargon), the dev agent should choose alternatives. Prioritize: (a) concrete over abstract, (b) PM-readable over technically precise, (c) brief over comprehensive.

**YAML frontmatter stripping:** Each captured artifact in the journey example is wrapped in YAML frontmatter (`---` delimited metadata blocks with fields like `artifact_id`, `agent_id`, `timestamp`). These metadata blocks MUST be excluded from preview excerpts — extract only the human-readable content below the frontmatter closing `---`.

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

### GitHub Markdown Rendering Constraints

- `<details><summary>` hides content by default — Story 5.3 code review penalized hidden content. For output previews, use blockquotes (`>`) instead — always visible, visually distinct
- Relative links work on GitHub: `_bmad-output/journey-examples/busy-parents-7-agent-journey.md` will resolve correctly
- Bold markdown links are clickable: `**[link text](path)**` renders as bold clickable text
- GitHub renders `>` blockquotes with left border and gray background — visually effective for excerpts
- **Tables inside blockquotes** (`>`) can render inconsistently on GitHub — if an excerpt contains a markdown table (e.g., Liam's 4-field contract), consider reformatting as plain text with bold labels instead of pipe-delimited table syntax

### Story 5.3 Code Review Learnings (avoid repeating these mistakes)

- **Double `---` separator**: Story 5.3 had two `---` with only invisible HTML comments between them, creating a visual double-rule. The review fixed this by removing one. Story 5.4 MUST NOT reintroduce this — when replacing the HTML comments with visible content, ensure there's exactly one `---` before "Using the Agents"
- **Redundant content**: Story 5.3 had the value prop paragraph and visual caption saying the same thing. Don't repeat what the value prop or agent table already say — the previews should show NEW information (actual output, not descriptions)
- **NFR10 stream names**: Every agent name and stream name must match the registry exactly. No abbreviations, no synonyms
- **Entry point clarity**: The diagram now has "▶ Start at Emma · back to any stream" — the preview section should reinforce this flow (start with Emma's output, end with Max's output)

### Raya Persona Context (Target User)

Raya is a non-technical PM scrolling through the README. By this point she has:
- Read the value proposition (understands what BMAD does conceptually)
- Seen the visual diagram (understands the 7-stream flow)
- Seen the agent table (knows the 7 agents by name and purpose)
- Scrolled past Quick Start (knows how to install)

Now she wants to see: "What will I actually GET if I use this?" The output previews answer that question. And the journey link says: "Want to see the full thing? Click here."

### What NOT To Do

- Do NOT modify the value proposition, visual diagram, agent table, or any content above line 120
- Do NOT modify the Quick Start or Updating sections
- Do NOT modify "Using the Agents" or any content below line 128 (except removing the HTML comments)
- Do NOT add a feedback mechanism — that is Story 5.5
- Do NOT modify any JavaScript, test files, or configuration
- Do NOT add external images hosted on CDNs
- Do NOT fabricate preview content — use real text from the journey example
- Do NOT use `<details><summary>` for the previews (lessons from Story 5.3 review)
- Do NOT add HC IDs, contract schemas, or implementation jargon to preview text

### Project Structure Notes

- Target file: `README.md` (root, ~270 lines currently)
- Journey example: `_bmad-output/journey-examples/busy-parents-7-agent-journey.md` (944 lines, verified exists)
- Agent registry source of truth: `scripts/update/lib/agent-registry.js`
- Package metadata: `package.json` (version 1.6.4)
- No code changes expected — README.md content only

### References

- [Source: _bmad-output/planning-artifacts/epics-phase2.md#Epic 5, Story 5.4] — ACs, dependencies, FR27/FR29
- [Source: _bmad-output/planning-artifacts/prd-phase2.md#FR27] — Output preview examples before installing
- [Source: _bmad-output/planning-artifacts/prd-phase2.md#FR29] — One-click path to journey example
- [Source: _bmad-output/planning-artifacts/prd-phase2.md#NFR10] — Consistent terminology
- [Source: _bmad-output/planning-artifacts/prd-phase2.md#NFR11] — Non-technical PM audience
- [Source: _bmad-output/planning-artifacts/prd-phase2.md#D6] — README as Landing Page deliverable
- [Source: README.md] — Current README (~270 lines, post Story 5.3)
- [Source: _bmad-output/journey-examples/busy-parents-7-agent-journey.md] — Journey example (944 lines, link target)
- [Source: _bmad-output/implementation-artifacts/p2-5-3-readme-landing-page-value-proposition-visual-overview.md] — Previous story (design decisions, code review learnings, insertion points)
- [Source: scripts/update/lib/agent-registry.js] — Agent names, IDs, streams (7 agents, 22 workflows)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

### Completion Notes List

- Selected 3 agents covering start→middle→end of discovery flow: Emma (Contextualize), Liam (Hypothesize), Max (Systematize)
- Emma excerpt: Job-to-be-Done statement + 3 riskiest assumptions from lean persona (lines 48-55 of journey example) — zero jargon, highly relatable
- Liam excerpt: Hypothesis 1 "Pre-Commute Decision Eliminator" statement + riskiest assumption (lines 518-530) — stripped "HC2" and "HC1" references, reworded as "Research shows" for NFR11 compliance
- Max excerpt: Strategic Decision (PATCH recommendation) + three concrete actions (lines 890-902) — clear decision with next steps, PM-compelling
- Section header: "## What Agents Produce" (benefit-oriented, avoids jargon per Task 2.2)
- All excerpts use blockquotes (`>`) per Task 2.3 — always visible, no `<details>` hiding
- Journey link: prominent bold+emoji format `**📖 [See the full 7-agent journey example →](...)**` on standalone line
- Link target verified exists via `test -f`
- NFR10: All agent names (Emma, Liam, Max, Isla) match registry exactly with correct emojis and stream names
- NFR11: Zero prohibited terms in new content (grep verified: no HC IDs, no "handoff contract", no "manifest", no "artifact contract", no "compass routing")
- No existing sections modified — all content above line 120 and below line 128 (original) preserved exactly
- Single `---` separator at line 164 before "Using the Agents" — no double-separator reintroduction
- Total README: 306 lines (268 + 38 new) — under ~320 target
- Tests: 293 pass, 0 fail, 2 todo (pre-existing) — no regressions
- Content-only story — no JavaScript, test files, or configuration changes

### Change Log

- 2026-03-01: Implemented Story 5.4 — added "What Agents Produce" section with 3 agent preview excerpts (Emma, Liam, Max) and prominent journey example link to README.md. Replaced both `<!-- STORY-5.4: ... -->` HTML comment placeholders with visible content.
- 2026-03-01: Code review fixes — restored concrete specifics in Max's three action items (sprint estimates, 3:15 PM timing, landing page test methodology), fixed "this project" ambiguity → "the example above", added sprint-status.yaml to File List. 2 MEDIUM, 2 LOW issues resolved.

### File List

- README.md (modified: +38 lines — output previews section and journey link)
- _bmad-output/implementation-artifacts/sprint-status.yaml (modified: workflow-managed status transition)
