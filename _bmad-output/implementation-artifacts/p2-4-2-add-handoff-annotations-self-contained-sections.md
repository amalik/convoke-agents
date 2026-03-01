# Story 4.2: Add Handoff Annotations & Self-Contained Sections

Status: ready-for-dev

## Story

As a journey follower,
I want callout boxes explaining which fields each agent consumed and which artifact contract applies, and I want each section to stand alone so I can read non-linearly,
So that I understand the handoff mechanics and can jump to any agent's section without reading the entire journey first.

## Acceptance Criteria

1. Each handoff point has a callout box or footnote identifying which fields the receiving agent consumed from the previous agent's output (FR17)
2. Each annotation references the specific handoff contract (HC1-HC5) that applies (FR17)
3. Each agent section declares its own context — defining any terms, artifacts, or concepts it references (FR18)
4. A reader entering at any section encounters no undefined terms from previous sections (FR18)
5. The journey still reads as a coherent narrative when read sequentially (NFR9)
6. Terminology is consistent throughout — no synonyms or abbreviations for agent/workflow/artifact names (NFR10)

## Tasks / Subtasks

- [ ] Task 1: Add handoff annotation callout boxes at each transition point (AC: #1, #2)
  - [ ] 1.1 Add Emma → Isla annotation after "What Happens Next" in Emma's section: explain contextual input (not HC handoff), list fields Isla draws from (JTBD, pain points, validation plan), note that Emma's lean-persona format differs from HC schema
  - [ ] 1.2 Add Isla → Mila annotation (HC1 contract) after Isla's artifact: list consumed fields (Synthesized Insights with evidence counts, Key Themes with implications, Pain Points with priorities, Desired Gains with priorities), reference HC1 schema
  - [ ] 1.3 Add Mila → Liam annotation (HC2 contract) after Mila's artifact: list consumed fields (Problem Statement, JTBD primary + related, Ranked Pains & Gains, Assumptions with validation status, Evidence Summary), reference HC2 schema
  - [ ] 1.4 Add Liam → Wade annotation (HC3 contract) after Liam's artifact: list consumed fields (3 hypotheses in 4-field format, Assumption Risk Map with Lethality × Uncertainty, Recommended Testing Order), reference HC3 schema
  - [ ] 1.5 Add Wade → Noah annotation (HC4 contract) after Wade's artifact: list consumed fields (Hypothesis Tested baseline, Pre-Defined Success Criteria, Expected Production Behavior, Signal Thresholds, Monitoring Duration), reference HC4 schema
  - [ ] 1.6 Add Noah → Max annotation (HC5 contract) after Noah's artifact: list consumed fields (Signal Description, Trend Analysis, Anomaly Detection, Confidence Level), note HC5 is intelligence-only (excludes strategy — Max adds that), reference HC5 schema

- [ ] Task 2: Add self-contained context declarations to each agent section (AC: #3, #4)
  - [ ] 2.1 Emma section: already self-contained — verify JTBD, lean persona, and Vortex concepts are defined within this section (no changes expected)
  - [ ] 2.2 Isla section: add brief context declaration defining who Emma is and what the lean persona provides, so a reader starting here understands the input without reading Section 1
  - [ ] 2.3 Mila section: add context declaration defining who Isla is, what HC1 empathy artifacts contain, and what "research convergence" means — so a reader starting here understands Mila's inputs
  - [ ] 2.4 Liam section: add context declaration defining who Mila is, what HC2 problem definition contains, and what "hypothesis engineering" means — so a reader starting here can follow the hypothesis work
  - [ ] 2.5 Wade section: add context declaration defining who Liam is, what HC3 hypothesis contracts contain (4-field format), and what "externalize" means (experiment design + execution)
  - [ ] 2.6 Noah section: add context declaration defining who Wade is, what HC4 experiment context contains, what "graduation" means (experiment → production), and what signal interpretation does
  - [ ] 2.7 Max section: add context declaration defining who Noah is, what HC5 signal reports contain (intelligence-only, no strategy), and what "systematize" means (learning synthesis + routing decisions)

- [ ] Task 3: Verify narrative coherence and terminology consistency (AC: #5, #6)
  - [ ] 3.1 Read the full journey document end-to-end after annotations and context declarations are added — verify it still reads as a coherent narrative sequentially, not as a collection of disconnected sections
  - [ ] 3.2 Verify all agent names match registry: Emma 🎯, Isla 🔍, Mila 🔬, Liam 💡, Wade 🧪, Noah 📡, Max 🧭 — no abbreviations or synonyms
  - [ ] 3.3 Verify all contract references use exact names: HC1 through HC5, not "handoff 1" or "contract one" or other variants
  - [ ] 3.4 Verify all workflow names match registry: lean-persona, user-discovery, research-convergence, hypothesis-engineering, mvp, signal-interpretation, learning-card
  - [ ] 3.5 Update the individual artifact files in `_bmad-output/vortex-artifacts/` if any content changes are needed for consistency with annotations added to the journey document

## Dev Notes

### This is a CONTENT EDITING story, not a code story

This story modifies an existing content document. The dev agent will:
1. Read the journey document created in Story 4.1
2. Insert handoff annotation callout boxes at 6 transition points
3. Add self-contained context declarations to 6 agent sections (Isla through Max)
4. Verify narrative coherence and terminology consistency

**No automated tests are expected.** Validation comes through editorial review in Story 4.3 (`/bmad-editorial-review-prose`).

### Annotation Format

Use markdown blockquote callout boxes for handoff annotations. Format:

```markdown
> **Handoff: HC1 Contract — Isla 🔍 → Mila 🔬**
>
> This artifact conforms to the **HC1 Empathy Artifacts** schema. Mila consumes these fields:
> - **Synthesized Insights** — 3 insights with evidence counts (16/20, 14/20, 11/20)
> - **Key Themes** — 4 themes with pattern descriptions and implications
> - **Pain Points** — 5 prioritized pains with current workarounds
> - **Desired Gains** — 4 prioritized gains with evidence
>
> Mila synthesizes these 52 evidence points into a converged HC2 Problem Definition.
> Schema reference: `_bmad/bme/_vortex/contracts/hc1-empathy-artifacts.md`
```

The first handoff (Emma → Isla) is different — it's NOT an HC contract:

```markdown
> **Handoff: Contextual Input — Emma 🎯 → Isla 🔍**
>
> Emma's lean persona is **not** an HC contract handoff. It provides contextual grounding:
> - **Job-to-be-Done** — the primary job Isla uses to focus her research questions
> - **Riskiest Assumptions** — 3 hypotheses Isla can investigate empirically
> - **Validation Plan** — suggested research scope (8-12 parents, weeknight observation)
>
> Isla draws from this context but is not constrained by it — her empirical findings may confirm, refine, or contradict Emma's hypotheses.
```

### Context Declaration Format

Use a brief italic paragraph at the top of each section's "What [Agent] Receives/Draws From" subsection. Format:

```markdown
*For readers starting here: Isla 🔍 (Discovery & Empathy Expert) is the second agent in the Vortex chain. She receives contextual input from Emma 🎯 (Contextualization Expert), who creates a lean persona — a structured hypothesis about the target user segment. Isla conducts independent empirical research (interviews, observations) to validate or challenge Emma's hypotheses. Her output is an HC1 empathy artifact containing synthesized insights, themes, pain points, and desired gains.*
```

Keep context declarations short (2-4 sentences). They should orient a non-linear reader, not repeat the entire upstream section.

### HC Contract Schema Reference — Consumed Fields Per Handoff

This table summarizes which specific fields each receiving agent consumes. The dev agent MUST use these exact field names in annotations:

| Handoff | Contract | Source → Target | Key Fields Consumed |
|---------|----------|----------------|-------------------|
| Emma → Isla | (none) | Contextual input | JTBD, Riskiest Assumptions, Validation Plan |
| Isla → Mila | HC1 | Isla → Mila | Synthesized Insights, Key Themes, Pain Points, Desired Gains, Evidence Summary |
| Mila → Liam | HC2 | Mila → Liam | Problem Statement, JTBD (primary + related), Pains, Gains, Assumptions (with validation status) |
| Liam → Wade | HC3 | Liam → Wade | Hypothesis Contracts (4-field format), Assumption Risk Map (Lethality × Uncertainty), Recommended Testing Order |
| Wade → Noah | HC4 | Wade → Noah | Hypothesis Tested, Pre-Defined Success Criteria, Expected Production Behavior, Signal Thresholds, Monitoring Duration |
| Noah → Max | HC5 | Noah → Max | Signal Description, Trend Analysis, Anomaly Detection, Data Quality / Confidence Level |

**Critical constraint for HC5 → Max annotation:** HC5 is intelligence-only. The annotation MUST note that HC5 excludes strategic recommendations, pivot/patch/persevere decisions, and resource allocation — Max adds those.

### Contract Schema Locations

The dev agent should reference these paths for exact field definitions:

- HC1: `_bmad/bme/_vortex/contracts/hc1-empathy-artifacts.md`
- HC2: `_bmad/bme/_vortex/contracts/hc2-problem-definition.md`
- HC3: `_bmad/bme/_vortex/contracts/hc3-hypothesis-contract.md`
- HC4: `_bmad/bme/_vortex/contracts/hc4-experiment-context.md`
- HC5: `_bmad/bme/_vortex/contracts/hc5-signal-report.md`

### Self-Containment Assessment

Current state of each section (from Story 4.1 output):

| Section | Self-Contained? | Action Needed |
|---------|----------------|---------------|
| Emma | YES | Verify only — no changes expected |
| Isla | PARTIAL | Add: who Emma is, what lean persona provides |
| Mila | PARTIAL | Add: who Isla is, what HC1 contains, what research convergence means |
| Liam | PARTIAL | Add: who Mila is, what HC2 contains, what hypothesis engineering means |
| Wade | PARTIAL | Add: who Liam is, what HC3 4-field format is, what externalize means |
| Noah | PARTIAL | Add: who Wade is, what HC4 contains, what graduation and signal interpretation mean |
| Max | PARTIAL | Add: who Noah is, what HC5 contains (intelligence-only), what systematize means |

### What NOT to Change

- Do NOT modify the captured artifacts themselves — those are real outputs from Story 4.1
- Do NOT restructure the journey document's heading hierarchy
- Do NOT add new agent sections or remove existing ones
- Do NOT change the narrative voice or introduction section
- Do NOT modify YAML frontmatter in artifacts
- Do NOT alter data points, percentages, or evidence counts in the artifacts

### Previous Story Intelligence (4.1)

Key learnings from Story 4.1:
- **Content creation follows editorial rules, not code rules** — no lint/test, editorial review validates
- **Journey document is ~870 lines** — annotations will add ~100-150 lines (estimated ~1000 lines total)
- **Code review found 5 issues** that were fixed: A3 assumption mislabeling, A4 validation overclaim, 14→10 weekday arithmetic, 4.1→4.2 baseline drift, weekend scope expansion. These fixes are already applied — do NOT revert them
- **NFR10 compliance verified**: All agent names, IDs, titles, icons, workflow names match registry
- **Individual artifacts in `_bmad-output/vortex-artifacts/`** should NOT need modification unless annotations reveal inconsistencies (unlikely since code review already passed)

### Risk Profile

**Risk:** LOW — Content insertion into existing document.
- No code to break, no regressions possible
- Annotations are additive (inserted between existing sections)
- Context declarations are additive (inserted at section tops)
- Risk is in annotation accuracy (wrong field names) — mitigated by HC schema reference table above
- Risk is in verbosity (annotations too long disrupt narrative) — mitigated by format guidance above

### Foundation for Story 4.3

This story prepares the journey for editorial review. Story 4.3 will:
- Run `/bmad-editorial-review-prose` on the annotated journey
- Apply editorial checklist for narrative flow, self-containment, annotation completeness
- Ensure journey reads as coherent narrative, not artifact dump

### Project Structure Notes

- Journey document: `_bmad-output/journey-examples/busy-parents-7-agent-journey.md`
- Individual artifacts: `_bmad-output/vortex-artifacts/` (7 files — do not modify unless needed)
- HC contract schemas: `_bmad/bme/_vortex/contracts/hc{1-5}-*.md`
- Agent registry: `scripts/update/lib/agent-registry.js`

### References

- [Source: _bmad-output/planning-artifacts/epics-phase2.md#Epic 4, Story 4.2]
- [Source: _bmad-output/planning-artifacts/prd-phase2.md#FR17, FR18, NFR9, NFR10]
- [Source: _bmad/bme/_vortex/contracts/hc1-empathy-artifacts.md]
- [Source: _bmad/bme/_vortex/contracts/hc2-problem-definition.md]
- [Source: _bmad/bme/_vortex/contracts/hc3-hypothesis-contract.md]
- [Source: _bmad/bme/_vortex/contracts/hc4-experiment-context.md]
- [Source: _bmad/bme/_vortex/contracts/hc5-signal-report.md]
- [Source: _bmad/bme/_vortex/compass-routing-reference.md]
- [Source: _bmad-output/implementation-artifacts/p2-4-1-create-7-agent-journey-example-with-real-artifacts.md]

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
