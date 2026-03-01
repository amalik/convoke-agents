# Story 5.3: README Landing Page — Value Proposition & Visual Overview

Status: done

## Story

As a new user arriving at the README,
I want to understand BMAD-Enhanced's value proposition within the first scroll and see a visual overview of how the 7-agent chain connects,
so that I can quickly decide whether BMAD fits my needs without reading detailed documentation.

## Acceptance Criteria

1. Given a new user (non-technical PM audience) visits the README for the first time, when they view the first scroll of content, then the value proposition is clear, compelling, and free of implementation jargon (FR26, NFR11)
2. The language communicates to a non-technical PM audience, not just developers (NFR11) — the value proposition paragraph (Task 2.2) avoids unexplained jargon ("handoffs", "manifest", "domain-specialized agents"); the word "agents" may appear in subsequent sections (visual overview, agent table) where visual context makes the meaning clear
3. A visual overview shows how the 7 agents connect in the chain, making the system's flow immediately understandable (FR28)
4. All agent names and workflow names match the registry and manifest exactly (NFR10) — see Agent Registry Reference below
5. The design approach (format, visuals, copy tone) has been decided through a design spike before implementation — the spike is the first task within this story, producing a brief decision document
6. Story 5.4 design decisions (output previews section placement, journey link location) are accounted for in the layout — leave clear insertion points for Story 5.4 content

## Tasks / Subtasks

- [x] Task 1: Design spike — produce decision document (AC: #5, #6)
  - [x] 1.1 Evaluate layout format options: (a) current single-page with restructured sections, (b) condensed hero + expandable details, (c) multi-section landing with TOC. Decision factor: GitHub markdown rendering constraints — no JavaScript, no collapsible sections on first render, raw HTML limited
  - [x] 1.2 Evaluate visual approach options: (a) ASCII diagram (current — portable, zero dependencies, renders everywhere), (b) Mermaid diagram (GitHub renders natively since 2022, richer visual but no custom styling), (c) SVG/PNG image committed to repo (full design control but requires asset management). Decision factor: must render correctly in GitHub web view, npm README preview, and local markdown viewers
  - [x] 1.3 Evaluate copy tone options: (a) PM-first — benefit-oriented, no technical terms in hero section ("validate your product ideas before writing code"), (b) developer-first — tool-oriented ("7 AI agents for Lean Startup validation"), (c) dual-audience — PM-friendly hero with developer quick-start below. Decision factor: NFR11 mandates non-technical PM as primary audience (Raya persona)
  - [x] 1.4 Document decisions in a brief section at the top of this story's Dev Notes (update the "Design Spike Decisions" placeholder below). Include rationale for each choice
  - [x] 1.5 Identify insertion points for Story 5.4 content (output previews section, journey example link) — mark them in the README with HTML comments for Story 5.4 to find

- [x] Task 2: Rewrite value proposition — first scroll content (AC: #1, #2)
  - [x] 2.0 Remove the current opening paragraph (line 22: "BMAD-Enhanced extends the BMAD Method with domain-specialized agents...") and the HC summary sentence (line 53: "Every workflow ends with a Vortex Compass...Ten handoff contracts..."). The new value proposition paragraph (2.2) replaces all content between the badges and the visual diagram. The HC/Vortex Compass sentence is relocated in Task 4.3
  - [x] 2.1 Write a 1-2 sentence hero tagline that communicates what BMAD-Enhanced does in non-technical language. Current tagline "BMAD Method enhanced by domain-specialized agents" is developer-focused. Target: a PM reading this should think "this helps me validate whether to build something"
  - [x] 2.2 Write a 3-4 sentence value proposition paragraph below the tagline explaining: (a) what problem it solves (teams build products without validating assumptions), (b) how it works at a high level (guided discovery through 7 streams), (c) what the outcome is (evidence-based go/no-go decisions). Zero jargon: no "agents", "handoffs", "contracts", "manifest"
  - [x] 2.3 Keep existing badges (version, agents, workflows, license) — they provide trust signals at a glance
  - [x] 2.4 Ensure the value proposition + visual overview fit within ~40-50 lines of markdown (approximately one screen scroll at standard viewport)

- [x] Task 3: Create or update visual overview of 7-agent chain (AC: #3, #4)
  - [x] 3.1 Based on design spike decision (Task 1.2), create the visual using chosen approach
  - [x] 3.2 Visual MUST show: all 7 agents by name (Emma, Isla, Mila, Liam, Wade, Noah, Max), their stream names (Contextualize, Empathize, Synthesize, Hypothesize, Externalize, Sensitize, Systematize), the flow direction, and the non-linear Vortex Compass routing back
  - [x] 3.3 Visual must NOT show: handoff contract IDs (HC1-HC10) in the hero section — these are implementation details that violate NFR11. They can remain in a later technical section
  - [x] 3.4 Add a brief caption below the visual explaining the flow in plain language — no product-specific jargon. Example: "Each stream builds on the previous one's output. Based on what you learn, the system guides you back to fill any remaining gaps — you don't have to follow a fixed path." Do NOT use "Vortex Compass" in the hero area caption (Raya won't know what it means); the term can appear in the detailed "Using the Agents" section below the fold

- [x] Task 4: Restructure README sections for landing page flow (AC: #1, #6)
  - [x] 4.1 Restructure to landing page order: Hero (tagline + value prop) → Visual overview → Agent summary table (simplified, benefit-focused) → Quick Start → [Story 5.4 insertion point: Output Previews] → [Story 5.4 insertion point: Journey Link] → Using the Agents → How It Fits with BMAD Core → Documentation → Roadmap → Contributing → License → Acknowledgments
  - [x] 4.2 Simplify the agent reference table for the hero area — keep agent name + emoji + stream + one-line benefit description. Current descriptions are good but verify they're benefit-oriented, not implementation-oriented
  - [x] 4.3 Move technical details (HC1-HC10, contract schemas, file structure) below the fold — keep them in "Using the Agents" or "Documentation" sections, not in the first scroll. Also relocate the HC1-HC10 summary sentence (current line 53: "Ten handoff contracts (HC1-HC10) ensure structured information flows between agents") to "Using the Agents". Keep the Vortex Compass non-linear routing concept in the hero area but express it in plain language (see Task 3.4 caption)
  - [x] 4.4 Add HTML comment insertion points for Story 5.4: `<!-- STORY-5.4: Output Previews Section -->` and `<!-- STORY-5.4: Journey Example Link -->`

- [x] Task 5: Validate NFR10 compliance — exact naming (AC: #4)
  - [x] 5.1 Cross-reference every agent name, stream name, and workflow name in the updated README against the Agent Registry Reference below
  - [x] 5.2 Search for stale references: "four agents", "original agents", "2 agents", "4 agents" — must be "7 agents"
  - [x] 5.3 Verify badge counts: agents=7, workflows=22 (current values are correct)
  - [x] 5.4 Verify version badge matches package.json version (currently 1.6.4)

- [x] Task 6: Final review against all ACs (AC: #1-#6)
  - [x] 6.1 Read the final README from top to bottom as if you are Raya (non-technical PM): Can you understand what this does in the first scroll? Is there any jargon that makes you confused?
  - [x] 6.2 Verify the visual overview renders correctly in GitHub markdown preview (if Mermaid chosen, verify syntax; if ASCII, verify alignment; if image, verify relative path)
  - [x] 6.3 Verify Story 5.4 insertion points are present and clearly marked
  - [x] 6.4 Run a diff between old and new README to ensure no content was accidentally deleted (especially Quick Start, Update commands, Documentation links)

## Dev Notes

### Design Spike Decisions

| Decision Area | Choice | Rationale |
|---|---|---|
| Layout Format | Single-page with restructured sections | Simple, works everywhere (GitHub, npm, terminal), no special HTML. `<details>` hides content (violates first-scroll). GitHub auto-TOC makes explicit TOC redundant. |
| Visual Approach | ASCII diagram (simplified) | Zero dependencies, renders in every context. Mermaid doesn't render on npm README. Images require asset management. Simplify existing diagram (remove HC IDs). |
| Copy Tone | Dual-audience (PM hero + dev quick-start) | NFR11 mandates PM-first hero. Developers also need Quick Start. PM-optimized first scroll flows into developer-oriented install/usage. |

**Story 5.4 insertion points** (HTML comments to add to README):
- `<!-- STORY-5.4: Output Previews Section -->` — after Quick Start, before Using the Agents
- `<!-- STORY-5.4: Journey Example Link -->` — after Output Previews, before Using the Agents

### Current README Analysis (265 lines)

The current README.md is well-structured but optimized for developers, not PMs:

**Strengths to preserve:**
- ASCII BMAD logo (brand identity)
- Shield badges (version, agents, workflows, license — trust signals)
- Agent reference table (good structure)
- Quick Start section (clear installation flow)
- BMAD Core comparison diagram (helpful positioning)

**Problems to fix (FR26, NFR11):**
- Hero tagline "BMAD Method enhanced by domain-specialized agents" is developer jargon — a PM doesn't know what "BMAD Method" or "domain-specialized agents" means
- Opening paragraph name-drops Innovation Vortex, unFIX model, Jurgen Appelo — irrelevant to a PM deciding if this tool helps them
- Vortex diagram shows HC1-HC10 contract IDs — implementation detail, not user benefit
- No clear problem statement — jumps straight to solution without articulating the pain point
- "Seven specialized agents will guide teams through full product discovery validation" — close but still uses "agents" jargon

**Section order for landing page:**
1. Hero: Logo + tagline + badges + value proposition
2. Visual: 7-stream chain overview (simplified, no HC IDs)
3. Agent table: Benefit-oriented descriptions
4. Quick Start: Prerequisites + install + activate
5. _[Story 5.4: Output Previews]_
6. _[Story 5.4: Journey Link]_
7. Using the Agents: Detailed descriptions
8. BMAD Core comparison
9. Documentation links
10. Roadmap, Contributing, License, Acknowledgments

### Agent Registry Reference (NFR10 — exact naming)

These are the ONLY correct names. Do not use synonyms, abbreviations, or variations.

| Agent Name | Agent ID (file slug) | Stream | Emoji |
|---|---|---|---|
| Emma | contextualization-expert | Contextualize | 🎯 |
| Isla | discovery-empathy-expert | Empathize | 🔍 |
| Mila | research-convergence-specialist | Synthesize | 🔬 |
| Liam | hypothesis-engineer | Hypothesize | 💡 |
| Wade | lean-experiments-specialist | Externalize | 🧪 |
| Noah | production-intelligence-specialist | Sensitize | 📡 |
| Max | learning-decision-expert | Systematize | 🧭 |

**22 workflows (for badge verification):** lean-persona, product-vision, contextualize-scope, empathy-map, user-interview, user-discovery, research-convergence, pivot-resynthesis, pattern-mapping, hypothesis-engineering, assumption-mapping, experiment-design, mvp, lean-experiment, proof-of-concept, proof-of-value, signal-interpretation, behavior-analysis, production-monitoring, learning-card, pivot-patch-persevere, vortex-navigation

### Raya Persona Context (Target User)

Raya is a non-technical PM who has heard about BMAD but doesn't know what it does or if it's relevant to her workflow. She:
- Doesn't know what "agents" means in this context
- Doesn't care about handoff contracts or manifest merging
- Wants to know: "Will this help me validate product ideas faster?"
- Decides within the first scroll whether to keep reading
- Needs to see concrete benefits, not architecture details

### Story 5.4 Dependency

Story 5.4 ("Output Previews & Journey Link") will add:
- Example output previews showing what 2-3 representative agents produce (FR27)
- A clearly visible link to the journey example (FR29): `_bmad-output/journey-examples/busy-parents-7-agent-journey.md`

Story 5.3 must leave clear insertion points for this content. Do NOT attempt to add output previews or journey links — that is Story 5.4's scope. But DO design the layout to accommodate them naturally.

### GitHub Markdown Rendering Constraints

- **Mermaid diagrams**: GitHub renders `mermaid` code blocks natively since 2022. No custom CSS. Limited styling options but functional
- **HTML in markdown**: GitHub allows `<div align="center">`, `<pre>`, `<details>`, `<summary>`, basic tables. No `<style>`, no `<script>`, no arbitrary CSS
- **Image rendering**: Relative paths work. SVG renders inline. PNG/JPG render as images. No max-width CSS — images render at full size unless wrapped in HTML
- **Collapsible sections**: `<details><summary>` works but content is hidden by default — not suitable for first-scroll content

### Previous Story Learnings (Stories 5.1, 5.2)

Stories 5.1 and 5.2 were CLI test stories (different work stream). Limited direct relevance to README editing, but key patterns:
- **No new dependencies** rule (NFR7) — this story doesn't add code, but any build/asset tooling would violate NFR7
- **Agent registry as source of truth** — all 7 agent names/IDs/streams come from `scripts/update/lib/agent-registry.js`. README must match exactly
- **Package version 1.6.4** — verify badge matches
- **Full test suite: 997 tests, 0 failures** — no changes to tests expected in this story

### What NOT To Do

- Do NOT add output previews or journey links — that is Story 5.4
- Do NOT add a feedback mechanism — that is Story 5.5
- Do NOT change the Quick Start installation commands — they work correctly
- Do NOT modify any JavaScript, test files, or configuration
- Do NOT add external images hosted on CDNs — all assets must be in the repo
- Do NOT remove the Acknowledgments section or agent roster
- Do NOT change the LICENSE or Contributing sections

### Project Structure Notes

- Target file: `README.md` (root, 265 lines currently)
- Agent registry source of truth: `scripts/update/lib/agent-registry.js`
- Journey example (for Story 5.4 reference): `_bmad-output/journey-examples/busy-parents-7-agent-journey.md`
- Package metadata: `package.json` (version 1.6.4, description, keywords)
- No image/asset directory exists — if design spike chooses image approach, create `docs/images/` or `assets/`

### References

- [Source: _bmad-output/planning-artifacts/epics-phase2.md#Epic 5, Story 5.3] — ACs, design spike requirement, Raya persona
- [Source: _bmad-output/planning-artifacts/prd-phase2.md#FR26] — Value proposition within first scroll
- [Source: _bmad-output/planning-artifacts/prd-phase2.md#FR28] — Visual overview of 7-agent chain
- [Source: _bmad-output/planning-artifacts/prd-phase2.md#NFR10] — Consistent terminology matching registry/manifest
- [Source: _bmad-output/planning-artifacts/prd-phase2.md#NFR11] — Non-technical PM audience communication
- [Source: _bmad-output/planning-artifacts/prd-phase2.md#D6] — README as Landing Page deliverable
- [Source: README.md] — Current README (265 lines, ASCII-only, developer-focused)
- [Source: scripts/update/lib/agent-registry.js] — Agent names, IDs, streams (7 agents, 22 workflows)
- [Source: package.json] — Version 1.6.4, description, keywords
- [Source: _bmad-output/journey-examples/busy-parents-7-agent-journey.md] — Journey example (Story 5.4 link target)
- [Source: _bmad-output/implementation-artifacts/p2-5-1-bmad-update-js-automated-tests-at-85-coverage.md] — Previous story (CLI tests, different work stream)
- [Source: _bmad-output/implementation-artifacts/p2-5-2-bmad-version-js-automated-tests-at-85-coverage.md] — Previous story (CLI tests, different work stream)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

### Completion Notes List

- Design spike completed: single-page layout, ASCII visual, dual-audience tone (PM hero + dev quick-start)
- Hero tagline rewritten from "BMAD Method enhanced by domain-specialized agents" to "Validate your product ideas before writing a single line of code"
- Value proposition paragraph: 3 sentences covering problem (teams skip validation), solution (7 discovery streams), outcome (evidence-based decisions), zero jargon
- ASCII visual simplified: removed HC1-HC10 labels, "VORTEX PATTERN" → "7 Streams · 7 Agents", bottom label "◀ back to any stream"
- Plain language caption added below visual — no "Vortex Compass" jargon in hero area
- Agent table descriptions simplified to benefit-oriented language (removed "lean personas", "JTBD", "pains & gains analysis")
- HC/Compass technical details relocated to "Using the Agents" section
- Story 5.4 insertion points added: `<!-- STORY-5.4: Output Previews Section -->` and `<!-- STORY-5.4: Journey Example Link -->`
- NFR10 validated: all 7 agent names, emojis, streams, and IDs match registry exactly; no stale references; badges correct (7 agents, 22 workflows, v1.6.4)
- Full test suite: 997 tests, 0 failures (2 todo from story 5.1)
- No code changes — README.md content only (26 insertions, 20 deletions)
- **[Code Review]** 6 issues found (1 HIGH, 3 MEDIUM, 2 LOW), all fixed:
  - HIGH: Stream names truncated in visual (Hypothesiz, Externaliz, Contextual, Systematiz) — widened boxes to 13-char inner width for full NFR10-compliant names
  - MEDIUM: Double `---` separator from Story 5.4 insertion points — removed redundant separator
  - MEDIUM: Redundant content between value proposition and visual caption — rewrote caption with non-overlapping content
  - MEDIUM: Visual diagram lacked entry point indicator — added "▶ Start at Emma · back to any stream" label
  - LOW: HC1-HC5 parenthetical in Quick Start file tree — simplified to "Artifact contract schemas"
  - LOW: Section ordering deviation (Updating between Quick Start and 5.4 points) — documented here as intentional preservation

### Change Log

- 2026-03-01: Design spike + README landing page implementation — value proposition, simplified visual, restructured sections, Story 5.4 insertion points
- 2026-03-01: Code review fixes — wider diagram boxes (full stream names), entry point label, non-redundant caption, single separator, HC ID cleanup (16 insertions, 18 deletions)

### File List

- `README.md` (MODIFIED) — cumulative: 42 insertions, 38 deletions. New tagline, value proposition, full-width visual with entry point, benefit-oriented agent table, Story 5.4 insertion points, HC details relocated to "Using the Agents"
