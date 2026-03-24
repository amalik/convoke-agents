# Story 2.2: Composition Pattern Selection & Decision Cascade

Status: ready-for-dev

## Story

As a framework contributor,
I want the factory to help me choose between Independent and Sequential composition patterns and automatically eliminate irrelevant decisions based on my choice,
So that I make the right architectural decision upfront and only deal with decisions that apply to my pattern.

## Acceptance Criteria

1. **Given** a contributor enters the Create Team workflow
   **When** Step 1 (Scope) begins
   **Then** the factory presents composition patterns in plain language with examples from existing teams (Vortex = Sequential, native teams = Independent) (TF-FR8)
   **And** each step introduces <=3 new concepts (TF-NFR2)

2. **Given** the factory presents pattern options
   **When** suggesting a default
   **Then** the default is selected based on the most common pattern in existing teams, with reasoning shown (TF-FR18)
   **And** the contributor confirms or overrides the suggestion

3. **Given** the contributor selects a composition pattern
   **When** the cascade logic evaluates downstream decisions
   **Then** irrelevant decisions are eliminated -- e.g., contracts are required for Sequential but optional for Independent (TF-FR17)
   **And** the contributor only sees decisions relevant to their selected pattern

## Tasks / Subtasks

- [ ] Task 1: Create step-01-scope.md — Composition Pattern Selection (AC: #1, #2)
  - [ ] 1.1 Create `.claude/skills/bmad-team-factory/step-01-scope.md` following the established step-file structure: PURPOSE, RULES, content sections, CHECKPOINT, NEXT. This is the first half of Step 1 — composition pattern selection and decision cascade. Story 2.3 will add agent scope definition to this same step.
  - [ ] 1.2 Present composition patterns in plain language. Two patterns only: **Independent** (agents operate standalone, no contracts — like Enhance module) and **Sequential** (agents form a pipeline with handoff contracts — like Vortex and Gyre). Include concrete examples from existing teams.
  - [ ] 1.3 Implement default suggestion logic: Sequential is the default (2 of 2 existing multi-agent teams use Sequential). Show reasoning: "Most existing BMAD teams use Sequential — agents hand off artifacts through a pipeline. This is recommended unless your agents are truly independent."
  - [ ] 1.4 Include confirmation checkpoint: contributor confirms or overrides the pattern selection. Record the decision in conversation context (pattern name, whether default was accepted, contributor's rationale if overridden).

- [ ] Task 2: Implement Decision Cascade in step-01-scope.md (AC: #3)
  - [ ] 2.1 After pattern confirmation, present a cascade summary showing which downstream decisions apply. For **Sequential**: contracts required, compass routing required, orchestration workflow required. For **Independent**: contracts optional (but possible), compass routing optional, no orchestration workflow needed.
  - [ ] 2.2 Include a clear "What this means for you" section: explain in plain language which factory steps will be full vs. abbreviated based on the selected pattern.
  - [ ] 2.3 Record cascade decisions in conversation context for downstream steps (Step 2: Connect, Step 3: Review).

- [ ] Task 3: Add Visibility Checklist to step-01-scope.md (AC: #1 — NFR2 concept budget)
  - [ ] 3.1 Add a Visibility Checklist section per the architecture specification (D-VB). Colleague-visible: (1) composition pattern choice, (2) default recommendation with reasoning, (3) cascade impact summary. Silent: Architecture Reference pattern definitions loaded. Concept count: 3/3. Approval prompt: "Confirm your composition pattern selection."

- [ ] Task 4: Update workflow.md to wire Step 1 (AC: all)
  - [ ] 4.1 Update `workflow.md` to indicate Step 1 is now partially available (composition pattern selection from Story 2.2; agent inventory from Story 2.3). Remove or update the "not yet available" fallback message for Step 1.
  - [ ] 4.2 Ensure the routing from step-00-route.md Route 1 flows correctly to step-01-scope.md via workflow.md.

- [ ] Task 5: Verification (AC: #1, #2, #3)
  - [ ] 5.1 Verify step-01-scope.md follows the step-file structure established by step-00-route.md (PURPOSE, RULES, sections, CHECKPOINT, NEXT).
  - [ ] 5.2 Verify only 2 composition patterns are presented (Independent, Sequential) — no Hybrid.
  - [ ] 5.3 Verify cascade correctly differentiates downstream decisions: contracts required (Sequential) vs optional (Independent).
  - [ ] 5.4 Verify concept count <= 3 per the visibility checklist.
  - [ ] 5.5 Verify workflow.md correctly wires to step-01-scope.md.

## Dev Notes

### Story 2.2 shares Step 1 with Story 2.3

The workflow.md step table maps Step 1 (`step-01-scope.md`) to Stories 2.2 AND 2.3. Story 2.2 implements **composition pattern selection and decision cascade**. Story 2.3 adds **agent scope definition and overlap detection** to the same step file. The CHECKPOINT and NEXT sections in Story 2.2 should be written to accommodate Story 2.3's additions — use a "Part 1 of 2" checkpoint or similar to indicate the step continues.

### Architecture Decisions

1. **Only 2 composition patterns exist**: Independent and Sequential. A third pattern would require new schema files + cascade branch (A6'-coupled pair: `cascade-logic.js` + `schema-*.json`). Do NOT design for a hypothetical third pattern — the architecture handles that through isolation.
2. **Step 1 is LLM reasoning + future JS**: The epic maps FR17/FR18 (cascade + defaults) to `lib/cascade-logic.js`. However, Story 2.2 does NOT create JS modules — it creates the LLM-side step file that will eventually invoke cascade-logic.js (Stories 2.6-2.9). For now, cascade logic is embedded in the step file instructions.
3. **NFR5 — Architecture Reference is single source of truth**: Pattern definitions should reference the Architecture Reference rather than hardcoding definitions. Step-01-scope.md should instruct the LLM to load pattern information from `_bmad-output/planning-artifacts/architecture-reference-teams.md`.
4. **NFR2 — <=3 concepts per step**: The 3 concepts for this portion of Step 1 are: (1) composition pattern choice, (2) default recommendation with reasoning, (3) cascade impact. Agent scope (Story 2.3) is a separate concept set.
5. **Decision state will be persisted in Story 2.5**: For now, decisions are tracked in conversation context. The spec file YAML format records: step name, decision text, `default_accepted` boolean, rationale.

### File Locations and Patterns

**Files to CREATE:**
- `.claude/skills/bmad-team-factory/step-01-scope.md` — composition pattern selection + cascade

**Files to MODIFY:**
- `.claude/skills/bmad-team-factory/workflow.md` — update Step 1 availability message

**Reference files (read, do NOT modify):**
- `_bmad-output/planning-artifacts/architecture-reference-teams.md` — pattern definitions, quality property checklists (COMP-I-*, COMP-S-*)
- `_bmad-output/planning-artifacts/architecture-team-factory.md` — FR17/FR18, cascade logic, visibility boundary spec

### Step-File Structure Pattern (from step-00-route.md)

```markdown
# Step N: Title

## PURPOSE
One paragraph explaining what this step accomplishes.

## RULES
- Bullet list of constraints
- Communication language rule
- Sequential enforcement rule

## [Main Content Sections]
The actual step logic — instructions, decision points, examples.

## CHECKPOINT
Confirmation prompt before proceeding.

## NEXT
Pointer to the next step file.
```

### Decision Cascade Logic

The cascade is straightforward for 2 patterns:

| Decision Area | Sequential | Independent |
|--------------|-----------|-------------|
| Handoff Contracts | Required — define inter-agent artifact schemas | Optional — agents can share artifacts informally |
| Compass Routing | Required — navigation across pipeline stages | Optional — per-agent entry points |
| Orchestration Workflow | Required — sequences agent execution | Not needed — agents invoked directly |
| Agent Ordering | Matters — pipeline sequence | Doesn't matter — any order |
| Validation Checks | 29 checks (DISC-S, INST-S, CONF-S, COMP-S) | 21 checks (DISC-I, INST-I, CONF-I, COMP-I) |

### Existing Team Examples for Plain-Language Presentation

- **Vortex** (Sequential): 7 agents forming a product discovery pipeline. Each agent's output feeds the next: Contextualize → Empathize → Synthesize → Hypothesize → Externalize → Sensitize → Systematize. 10 handoff contracts define artifact schemas between agents.
- **Gyre** (Sequential): 4 agents for production readiness analysis. Scout → Atlas → Lens → Coach. 4 handoff contracts.
- **Enhance** (Independent structure): Standalone module with no agent-to-agent contracts. Each capability operates independently.

### What NOT to Do

- **Do NOT create `cascade-logic.js`** — that JS module is for Stories 2.6-2.9. This story creates the LLM-side instructions only.
- **Do NOT create schema files** (`schema-independent.json`, `schema-sequential.json`) — those are for Story 2.5/2.8.
- **Do NOT implement agent scope definition** — that is Story 2.3. This story covers pattern selection and cascade only.
- **Do NOT add a third composition pattern** — only Independent and Sequential exist.
- **Do NOT modify existing team files** (Vortex, Gyre, Enhance) — additive only.

### Previous Story Intelligence

From Story 2.1 (Factory Discoverability & Entry Points):
- Step-file structure is established: PURPOSE, RULES, content, CHECKPOINT, NEXT
- `workflow.md` currently has a "not yet available" fallback for Steps 1-5 — must be updated
- `step-00-route.md` Route 1 ends with "follow workflow.md (which will load Step 1 when implemented in Story 2.2)" — the wiring is ready
- Code review patches applied: removed "(Orient)" label mismatch, fixed circular routing, added Route 1 fallback, added Architecture Reference to Route 5
- Config is loaded from `{project-root}/_bmad/bmm/config.yaml` — same pattern applies to step-01
- Communication in `{communication_language}` is mandatory in all step files

From Epic 1 retrospective:
- Layered story design works: this story is the "scaffold" layer for Step 1 (Story 2.3 adds agent scope)
- Code review has 75% hit rate — keep for all Epic 2 stories
- Previous Story Intelligence sections prevent context loss between stories

### Known Considerations

- **Step 1 file naming**: The workflow.md step table shows `step-01-scope.md`, not `step-01-orient.md`. The epic refers to "Step 1 (Orient)" but the architecture uses "Scope" for this step. Use `step-01-scope.md` as specified in workflow.md.
- **No pure Independent team exists yet**: The Enhance module demonstrates Independent *structure* but has no `agents/` directory. When presenting examples, note this gap — "Independent pattern is the simpler path, similar to how the Enhance module operates."
- **Cascade is deterministic**: The architecture specifies cascade logic as JS-deterministic (not LLM reasoning). For Story 2.2, the cascade is embedded in the step file instructions. When `cascade-logic.js` is created (Stories 2.6-2.9), the step file will invoke it instead.

### Project Structure Notes

- Team Factory skill: `.claude/skills/bmad-team-factory/`
- Architecture Reference: `_bmad-output/planning-artifacts/architecture-reference-teams.md`
- Architecture doc: `_bmad-output/planning-artifacts/architecture-team-factory.md`
- Epic file: `_bmad-output/planning-artifacts/epic-team-factory.md`

### References

- [Source: _bmad-output/planning-artifacts/epic-team-factory.md — Story 2.2 ACs, FR8, FR17, FR18, NFR2]
- [Source: _bmad-output/planning-artifacts/architecture-team-factory.md — LLM/JS boundary, cascade-logic.js, D-VB visibility checklist, D-S2 spec file architecture, hypothesis sensitivity A6']
- [Source: _bmad-output/planning-artifacts/architecture-reference-teams.md — composition pattern definitions, quality property checklists (50 checks: 21 Independent, 29 Sequential), decision criteria]
- [Source: _bmad-output/implementation-artifacts/tf-2-1-factory-discoverability-entry-points.md — step-file structure pattern, workflow.md wiring, code review patches]
- [Source: _bmad-output/implementation-artifacts/tf-epic-1-retro-2026-03-24.md — layered story design, code review mandate, Previous Story Intelligence]

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### Change Log

### File List
