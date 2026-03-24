# Story 2.3: Agent Scope Definition & Overlap Detection

Status: ready-for-dev

## Story

As a framework contributor,
I want to define my team's agents one by one with naming enforcement and overlap detection,
So that my agents are properly scoped, correctly named, and don't silently duplicate existing capabilities.

## Acceptance Criteria

1. **Given** the contributor is in Step 1 (Scope)
   **When** defining agents for their team
   **Then** the factory forces explicit scope decisions for each agent before proceeding (TF-FR8)
   **And** contextual examples from Vortex and native teams are surfaced at each decision point (TF-FR13)

2. **Given** a new agent name is proposed
   **When** the factory validates the name
   **Then** naming conventions are actively enforced — kebab-case, role-based, matching agent ID regex (TF-FR22)
   **And** violations are flagged immediately with the correct format shown

3. **Given** agent definitions are provided
   **When** the factory checks for overlaps
   **Then** the factory surfaces potential overlaps against the existing agent manifest for human review (TF-FR12)
   **And** the contributor can override with acknowledgment — overlap detection informs, it does not block
   **And** the factory shows the manifest comparison so the contributor can see exactly where overlap exists

## Tasks / Subtasks

- [ ] Task 1: Add Part 2 (Agent Scope Definition) to step-01-scope.md (AC: #1)
  - [ ] 1.1 Add `## PART 3: AGENT SCOPE DEFINITION` section to `step-01-scope.md` after Part 2 (Decision Cascade). This is the "Part 2 of 2" referenced in the PURPOSE section. Note: the file's internal section numbering uses PART 1 (pattern selection), PART 2 (cascade), so the new agent scope section continues as PART 3 despite being "story Part 2."
  - [ ] 1.2 Implement agent-by-agent definition flow: ask contributor for each agent's (a) role/purpose in one sentence, (b) proposed agent ID (kebab-case), (c) key capabilities. Collect agents iteratively — "Add another agent?" loop. Minimum 1 agent required.
  - [ ] 1.3 For Sequential teams: require pipeline ordering. After all agents are defined, ask contributor to specify the pipeline sequence. Show Vortex example: `Contextualize → Empathize → Synthesize → Hypothesize → Externalize → Sensitize → Systematize`.
  - [ ] 1.4 For Independent teams: confirm no ordering needed. Note that agents can run in any order.
  - [ ] 1.5 Surface contextual examples at each decision point (TF-FR13). When defining agents: show Vortex agent examples (e.g., "Emma — Contextualization Expert — Strategic Framing + Problem-Product Space Navigator") and Gyre examples (e.g., "Scout — Stack Detective — Technology Stack Analysis Expert"). Reference the Architecture Reference for authoritative agent definitions.

- [ ] Task 2: Implement Naming Enforcement in step-01-scope.md (AC: #2)
  - [ ] 2.1 After each agent ID is proposed, validate against the naming regex: `/^[a-z]+(-[a-z]+)*$/` (kebab-case, lowercase, role-based). Show the regex and a good/bad example. Good: `task-runner`, `data-processor`. Bad: `TaskRunner`, `data_processor`, `my-agent-1`.
  - [ ] 2.2 If naming violation detected: flag immediately, show the correct format, and ask contributor to re-enter. Do NOT proceed past the agent until the name validates.
  - [ ] 2.3 Validate agent file name derivation: agent file = `{agent_id}.md` (e.g., `task-runner.md`). Canonical skill ID = `bmad-agent-bme-{agent_id}` (e.g., `bmad-agent-bme-task-runner`). Show these derivations to the contributor for confirmation.

- [ ] Task 3: Implement Overlap Detection in step-01-scope.md (AC: #3)
  - [ ] 3.1 After all agents are defined and named, instruct the LLM to load `_bmad/_config/agent-manifest.csv` and check for overlaps at three levels:
    - **Level 1 (Exact ID):** Check if any proposed agent ID exactly matches an existing `name` column value. If match → flag as **conflict** (strongly recommend different name).
    - **Level 2 (Name Similarity):** Check for similar names using prefix/substring matching (e.g., `data-processor` vs `data-handler`). If similar → flag as **warning** with the matching entry shown.
    - **Level 3 (Capability Overlap):** Use LLM reasoning to compare proposed agent role/capabilities against existing agent `role` and `capabilities` columns. If overlap → flag as **advisory** with the matching agent(s) shown.
  - [ ] 3.2 Present overlap results in a clear table format showing: proposed agent, overlap level (conflict/warning/advisory), matching existing agent, and what overlaps.
  - [ ] 3.3 For each overlap found: allow contributor to (a) rename their agent, (b) acknowledge and proceed (override), or (c) remove the agent from their team. Record acknowledgments in conversation context.
  - [ ] 3.4 Include a "No overlaps found" confirmation message when all agents pass overlap detection cleanly.

- [ ] Task 4: Add Visibility Checklist and Update CHECKPOINT/NEXT (AC: #1, #2, #3)
  - [ ] 4.1 Add a Visibility Checklist section for Part 2 per the architecture specification (D-VB). Colleague-visible: (1) agent inventory with roles and capabilities, (2) naming validation results, (3) overlap detection results. Silent: agent-manifest.csv loaded for overlap checks. Concept count: 3/3. Approval prompt: "Confirm your agent inventory."
  - [ ] 4.2 Update the existing CHECKPOINT section: replace the Part-1-only checkpoint with a combined checkpoint that confirms both pattern selection AND agent inventory. Summary should show: pattern, agent count, agent list (id + role), any acknowledged overlaps.
  - [ ] 4.3 Update the NEXT section: remove the Story 2.3 "not yet available" fallback. Replace with: "Proceed to Step 2: Connect" with a note that Step 2 is being implemented in Story 2.4 and is not yet available — point to Architecture Reference for manual guidance.
  - [ ] 4.4 Update the PURPOSE section: remove the "Part 1 (Story 2.2) / Part 2 (Story 2.3)" split note. The step is now complete — both parts are implemented.
  - [ ] 4.5 Record agent inventory in conversation context for downstream steps: `agents` array with each agent's `id`, `role`, `capabilities`, `pipeline_position` (Sequential only), `overlap_acknowledgments`.

- [ ] Task 5: Update workflow.md Status (AC: all)
  - [ ] 5.1 Update workflow.md status line from "Steps 0–1 (Part 1) available" to "Steps 0–1 available."

- [ ] Task 6: Verification (AC: #1, #2, #3)
  - [ ] 6.1 Verify step-01-scope.md follows the step-file structure: PURPOSE, RULES, content sections, CHECKPOINT, NEXT.
  - [ ] 6.2 Verify naming regex matches the Architecture Reference specification: `/^[a-z]+(-[a-z]+)*$/`.
  - [ ] 6.3 Verify overlap detection references `_bmad/_config/agent-manifest.csv` (not hardcoded agent lists).
  - [ ] 6.4 Verify contextual examples reference Vortex and Gyre agents (FR13).
  - [ ] 6.5 Verify concept count <= 3 in Part 2's visibility checklist.
  - [ ] 6.6 Verify NEXT section no longer has "not yet available" for Story 2.3 — it now points to Step 2 with its own fallback.
  - [ ] 6.7 Verify workflow.md status line is updated.

## Dev Notes

### Story 2.3 completes Step 1 (started by Story 2.2)

Story 2.2 created step-01-scope.md with Part 1 (composition pattern selection) and Part 2 (decision cascade). Story 2.3 adds the remaining functionality: agent scope definition, naming enforcement, and overlap detection. After this story, Step 1 is complete.

### Architecture Decisions

1. **No JS modules in this story**: The architecture maps overlap detection to `collision-detector.js` and naming to `naming-enforcer.js`. However, those JS utilities are for Stories 2.6-2.9. This story creates LLM-side instructions only — the step file instructs the LLM to perform overlap detection by reading the agent manifest directly.
2. **Three-level overlap detection is LLM-driven for now**: Level 1 (exact match) and Level 2 (similarity) will eventually be JS-deterministic via `collision-detector.js`. Level 3 (capability overlap) is always LLM reasoning. For this story, all three levels are LLM-driven instructions in the step file.
3. **NFR5 — Architecture Reference is single source of truth**: Agent naming regex and conventions should reference the Architecture Reference, not be hardcoded. However, the regex `/^[a-z]+(-[a-z]+)*$/` is simple enough to include inline as presentation guidance (same approach as Story 2.2's pattern descriptions).
4. **NFR2 — <=3 concepts for Part 2**: The 3 concepts are: (1) agent inventory with roles/capabilities, (2) naming validation, (3) overlap detection results. These are separate from Part 1's 3 concepts.
5. **Overlap detection informs, does not block**: FR12 explicitly says "surface potential overlaps... for human review." Contributors can override with acknowledgment. Only Level 1 (exact ID match) should be a strong recommendation to rename — it's not a hard block.
6. **Sequential teams need pipeline ordering**: After agents are defined, the contributor must specify the pipeline sequence. This is critical for downstream contract design (Step 2).

### File Locations and Patterns

**Files to MODIFY:**
- `.claude/skills/bmad-team-factory/step-01-scope.md` — add Part 2 (agent scope definition, naming, overlap detection), update CHECKPOINT, update NEXT, update PURPOSE
- `.claude/skills/bmad-team-factory/workflow.md` — update status line only

**Reference files (read, do NOT modify):**
- `_bmad-output/planning-artifacts/architecture-reference-teams.md` — naming conventions (line 517-526), agent examples, quality property checklists
- `_bmad-output/planning-artifacts/architecture-team-factory.md` — FR12 overlap detection, FR22 naming enforcement, collision detection levels (line 853-861), D-VB visibility boundary
- `_bmad/_config/agent-manifest.csv` — existing agent inventory for overlap detection (columns: name, displayName, title, icon, capabilities, role, identity, communicationStyle, principles, module, path, canonicalId)

### Agent Manifest Structure (for overlap detection)

The agent-manifest.csv has 12 columns. Key columns for overlap detection:
- `name` — agent short name (e.g., "Emma", "Isla", "bmad-master") — Level 1 exact match
- `title` — display title (e.g., "Contextualization Expert") — Level 2 similarity
- `role` — role description (e.g., "Strategic Framing + Problem-Product Space Navigator") — Level 3 capability
- `capabilities` — capability list — Level 3 capability
- `path` — file path — for showing contributor where existing agents live

Current agents in manifest: Emma, Isla, Mila, Liam, Wade, Noah, Max (Vortex), bmad-master, analyst (Mary), dev, pm, qa, sm, architect, tech-writer, ux-designer, quick-flow-solo-dev, plus Gyre agents (Scout, Atlas, Lens, Coach).

### Naming Convention Reference

From architecture-reference-teams.md:
| Entity | Convention | Regex | Example |
|--------|-----------|-------|---------|
| Agent file | Role-based kebab-case `.md` | `/^[a-z]+(-[a-z]+)*\.md$/` | `task-runner.md` |
| Agent ID | Matches filename stem | `/^[a-z]+(-[a-z]+)*$/` | `task-runner` |

Derived paths:
- Agent file: `_bmad/bme/{submodule}/agents/{agent_id}.md`
- Canonical skill ID: `bmad-agent-bme-{agent_id}`
- Skill path: `.claude/skills/bmad-agent-bme-{agent_id}/SKILL.md`

### What NOT to Do

- **Do NOT create `collision-detector.js`** or `naming-enforcer.js` — those JS modules are for Stories 2.6-2.9. This story creates LLM-side instructions only.
- **Do NOT create schema files** — those are for Story 2.5/2.8.
- **Do NOT modify Part 1 content** (composition pattern selection, cascade logic) — only add Part 2 and update shared sections (PURPOSE, CHECKPOINT, NEXT).
- **Do NOT hardcode the list of existing agents** — instruct the LLM to read `_bmad/_config/agent-manifest.csv` at runtime.
- **Do NOT make overlap detection blocking** — it informs and advises, contributor can override with acknowledgment (FR12).
- **Do NOT modify existing team files** (Vortex, Gyre, Enhance) — additive only.

### Previous Story Intelligence

From Story 2.2 (Composition Pattern Selection & Decision Cascade):
- step-01-scope.md is structured with PART 1 (pattern selection) and PART 2 (cascade). Story 2.3 content is PART 3 in file section numbering.
- The file has a "Part 1 of 2" note in PURPOSE that needs updating to remove the split reference.
- NEXT section has temporary fallback: "Agent scope definition is being implemented in Story 2.3 and is not yet available." — must be replaced.
- CHECKPOINT confirms pattern selection only — must be extended to include agent inventory.
- Cascade decisions are stored in conversation context (7 variables). Agent inventory should follow the same pattern.
- Visibility Checklist established at 3/3 concept budget for Part 1. Part 2 gets its own 3/3 budget.
- Code review patches from 2.2: SKILL.md "Orient"→"Scope" fix, step-00-route.md stale text fix, Enhance caveat added.
- Communication in `{communication_language}` is mandatory.

From Story 2.1 (Factory Discoverability & Entry Points):
- Step-file structure established: PURPOSE, RULES, content sections, CHECKPOINT, NEXT.
- Config loaded from `{project-root}/_bmad/bmm/config.yaml`.
- Code review has 75% hit rate — keep for all stories.

From Epic 1 retrospective:
- Layered story design works: Story 2.2 = scaffold, Story 2.3 = populate.
- Previous Story Intelligence sections prevent context loss.

### Known Considerations

- **Section numbering vs story numbering**: Step-01-scope.md uses PART 1, PART 2 for its internal sections. The new agent scope content is PART 3 in the file but "Part 2" in the story narrative. Use PART 3 as the section header to avoid confusion.
- **Pipeline ordering is Sequential-only**: Only ask for pipeline sequence if `composition_pattern` = "Sequential". For Independent, skip ordering entirely.
- **agent-manifest.csv `name` column inconsistency**: Vortex agents use first names (Emma, Isla) while core agents use IDs (bmad-master, analyst). The overlap check should compare proposed agent IDs against BOTH the `name` column and the filename stem extracted from `path`.
- **No pure Independent team exists yet**: When showing examples for Independent teams, note this gap (same caveat as Story 2.2).
- **Concept budget is per-part**: Part 1 uses 3/3 (pattern, default, cascade). Part 2 (this story) gets a fresh 3/3 budget (agent inventory, naming, overlaps).

### Project Structure Notes

- Team Factory skill: `.claude/skills/bmad-team-factory/`
- Architecture Reference: `_bmad-output/planning-artifacts/architecture-reference-teams.md`
- Architecture doc: `_bmad-output/planning-artifacts/architecture-team-factory.md`
- Agent manifest: `_bmad/_config/agent-manifest.csv`
- Epic file: `_bmad-output/planning-artifacts/epic-team-factory.md`

### References

- [Source: _bmad-output/planning-artifacts/epic-team-factory.md — Story 2.3 ACs, FR8, FR12, FR13, FR22]
- [Source: _bmad-output/planning-artifacts/architecture-team-factory.md — Collision detection levels (lines 853-861), naming conventions (lines 517-526), D-VB visibility checklist, LLM/JS boundary]
- [Source: _bmad-output/planning-artifacts/architecture-reference-teams.md — Agent naming regex, agent examples (Vortex, Gyre), quality property checklists]
- [Source: _bmad-output/implementation-artifacts/tf-2-2-composition-pattern-selection-decision-cascade.md — step-01-scope.md structure, cascade context variables, Part 1/Part 2 split, code review patches]
- [Source: _bmad/_config/agent-manifest.csv — 12-column schema, existing agent inventory for overlap detection]

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### Change Log

### File List
