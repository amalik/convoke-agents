# Story 2.6: BMB Delegation & Artifact Generation

Status: in-progress

## Story

As a framework contributor,
I want the factory to delegate artifact generation to BMB with full context about my team decisions,
So that agent files, workflow files, and contract files are generated from shared templates — not hand-authored by the factory.

## Acceptance Criteria

1. **Given** the contributor has approved the decision summary
   **When** Step 4 (Generate) begins
   **Then** the factory delegates artifact generation to BMB with full context — composition pattern, existing agents, scope boundaries (TF-FR10)
   **And** the factory never authors agent files, workflow steps, or skill templates — only integration wiring (TF-NFR6)
   **And** generated artifacts are produced sequentially per agent — each agent's files are generated and reviewed before proceeding to the next
   **And** template substitution uses safe templating — whitelist-only variable names, no raw string interpolation (TF-NFR14)

2. **Given** the same spec file is used twice
   **When** generation runs both times
   **Then** identical artifacts are produced — idempotent (TF-FR23, TF-NFR4)

## Tasks / Subtasks

- [ ] Task 1: Create step-04-generate.md with BMB Delegation Flow (AC: #1)
  - [ ] 1.1 Add PURPOSE section: Step 4 orchestrates artifact generation by delegating to BMB (Build-Measure-Build) with full team context. Factory owns sequencing and verification; BMB owns content generation.
  - [ ] 1.2 Add RULES section: NFR6 (factory never authors agent/workflow/skill files), NFR14 (safe templating), NFR2 (≤3 concepts), NFR18 (sequential per-agent processing). Do NOT create JS modules. Do NOT create shared templates (P1/P6 prerequisite not yet met).
  - [ ] 1.3 Add PART 1: SPEC FILE LOADING — Load the spec file from `spec_file_path` (from Step 3 context). Parse YAML. Verify `progress.review: complete` and `progress.generate: pending`. If spec file missing or invalid, halt with error.
  - [ ] 1.4 Add PART 2: MODULE DIRECTORY SCAFFOLDING — Create the team module directory structure: `_bmad/bme/_{team-name-kebab}/` with subdirectories: `agents/`, `workflows/`, and `contracts/` (Sequential only). If directory exists, warn and ask contributor to confirm overwrite or abort.
  - [ ] 1.5 Add PART 3: PER-AGENT GENERATION CYCLE — For each agent in the spec's `agents` array (sequential order by `pipeline_position` for Sequential, array order for Independent): (a) Present agent context to contributor, (b) Generate agent definition file using BMB delegation prompt with full context, (c) Generate agent workflow(s), (d) Verify generated files exist and contain required sections, (e) Update spec file `progress.generate` with per-agent status, (f) Confirm with contributor before proceeding to next agent.
  - [ ] 1.6 Add PART 3A: BMB DELEGATION PROMPT TEMPLATE — Define the delegation prompt structure: team context (name, pattern, pipeline position), agent context (id, role, capabilities), existing team examples (Vortex agent structure, Gyre agent structure), required sections (activation XML, persona, capabilities, menu), safe templating variable whitelist.
  - [ ] 1.7 Add PART 3B: AGENT FILE GENERATION — For each agent, generate: `agents/{agent-id}.md` (agent definition with activation XML, persona, capabilities, constraints, menu). Use existing Vortex/Gyre agents as structural reference. File must conform to BMAD agent schema.
  - [ ] 1.8 Add PART 3C: WORKFLOW GENERATION — For each agent, generate workflow directory: `workflows/{workflow-name}/` with `SKILL.md` and `workflow.md`. Sequential teams: workflows reference pipeline position and handoff contracts. Independent teams: standalone workflows.

- [ ] Task 2: Implement Contract File Generation for Sequential Teams (AC: #1)
  - [ ] 2.1 Add PART 4: CONTRACT GENERATION (Sequential only) — For each contract in the spec's `contracts` array: generate contract file at `contracts/{file_name}` with frontmatter (contract id, source_agent, target_agents, artifact_title, key_sections) and content sections matching key_sections from spec.
  - [ ] 2.2 Add contract chain verification — After all contracts generated, verify every adjacent pipeline pair has a contract file. Report gaps.
  - [ ] 2.3 Handle feedback contracts — If `feedback_contracts` array is non-empty, generate feedback contract files following same pattern but with reverse-flow metadata.

- [ ] Task 3: Implement Compass Routing Reference for Sequential Teams (AC: #1)
  - [ ] 3.1 Add PART 5: COMPASS ROUTING REFERENCE (Sequential only) — Generate `compass-routing-reference.md` documenting: pipeline flow, per-agent routing (what workflow to invoke, what contract to consume/produce, what's next in pipeline), cross-module routing placeholders.
  - [ ] 3.2 Use Gyre's `compass-routing-reference.md` as structural template reference.

- [ ] Task 4: Implement Per-Agent Progress Tracking and Idempotency (AC: #1, #2)
  - [ ] 4.1 Add per-agent progress tracking in spec file — Update `progress.generate` section with per-agent completion status after each agent cycle. Format: `generate: { agent-id-1: complete, agent-id-2: pending }`.
  - [ ] 4.2 Add resume-from-agent logic — On resume, skip agents marked `complete` in spec file progress, continue from first `pending` agent.
  - [ ] 4.3 Add idempotency guidance — Same spec file inputs must produce identical file content. No timestamps, random values, or session-specific data in generated artifacts. Date fields use spec file's `created` date.

- [ ] Task 5: Add Visibility Checklist, Step Validation, Checkpoint, NEXT (AC: #1)
  - [ ] 5.1 Add STEP VALIDATION — Validate: all agent files generated, all workflow directories created, all contracts generated (Sequential), compass routing reference generated (Sequential), spec file progress updated, file manifest recorded.
  - [ ] 5.2 Add Visibility Checklist — 3/3 concept budget: (1) per-agent generation with review checkpoint, (2) generated file verification results, (3) generation progress summary. Silent: BMB delegation prompt construction, spec file progress updates, directory scaffolding.
  - [ ] 5.3 Add CHECKPOINT confirming generation complete, listing all generated files, showing progress status, and asking contributor to proceed to Step 5 (Validate) or review specific agents.
  - [ ] 5.4 Add NEXT pointing to Step 5 (Validate) with fallback note that Step 5 is being implemented in Story 2.9.

- [ ] Task 6: Update workflow.md with Step 4 Routing (AC: #1)
  - [ ] 6.1 Update status line: "Steps 0–4 available"
  - [ ] 6.2 Add routing entry: "If returning from step-03-review.md (Step 3 confirmed), read fully and follow: `./step-04-generate.md` to proceed to Step 4 (Generate)."
  - [ ] 6.3 Update fallback note: "Step 5 is being implemented in Story 2.9"

- [ ] Task 7: Update step-03-review.md NEXT Section (AC: #1)
  - [ ] 7.1 Remove the fallback note about Step 4 being implemented in Story 2.6
  - [ ] 7.2 Clean NEXT to just: "Proceed to Step 4: Generate (BMB delegation and artifact generation)."

- [ ] Task 8: Verification
  - [ ] 8.1 Verify step-04-generate.md follows step-file pattern: PURPOSE, RULES, content PARTs, STEP VALIDATION, Visibility Checklist, CHECKPOINT, NEXT
  - [ ] 8.2 Verify workflow.md routing chain: step-00 → step-01 → step-02 → step-03 → step-04 is complete
  - [ ] 8.3 Verify step-03-review.md NEXT no longer has fallback note
  - [ ] 8.4 Verify no JS modules, no shared templates, no JSON schemas created (those are for later stories or P1/P6 prerequisite)

## Dev Notes

### Key Architecture Decisions

1. **Factory NEVER authors agent/workflow/skill files (NFR6)** — Step 4 delegates ALL content generation to BMB. The factory's role is orchestration: load spec → scaffold directories → delegate per-agent → verify → track progress. The LLM constructs a BMB delegation prompt with full context and lets BMB produce the artifact content.

2. **Sequential per-agent processing (NFR18)** — Process one agent at a time: generate agent file → generate workflow(s) → verify → contributor confirms → next agent. Never batch-generate all agents at once. This allows the contributor to review and course-correct per agent.

3. **Safe templating (NFR14)** — No `eval()`, no dynamic `require()`, no raw string interpolation. Template variable substitution uses a whitelist of known variable names: `{team_name}`, `{agent_id}`, `{agent_role}`, `{composition_pattern}`, `{pipeline_position}`, `{contract_prefix}`. Any variable not on the whitelist is flagged, not silently expanded.

4. **Idempotency (FR23)** — Same spec file must produce identical artifacts. No session timestamps, no random IDs, no LLM temperature variance in generated content. Use the spec file's `created` date for any date fields in generated artifacts.

5. **This story creates a step file (LLM instructions), NOT JS modules** — step-04-generate.md is an LLM instruction file like step-00 through step-03. The JS modules listed in the architecture (manifest-tracker.js, writers/, etc.) are for Stories 2.7–2.9.

6. **Shared templates (P1/P6) do NOT exist yet** — `_bmad/core/resources/templates/` has not been created. Step 4 uses BMB delegation prompting (LLM-driven), not JS template file reading. When templates are externalized in a future initiative, Step 4 can reference them, but for now BMB generates content using existing team examples as structural reference.

7. **Per-agent progress in spec file** — The spec file's `progress.generate` section is expanded from a simple `pending/complete` to per-agent tracking: `generate: { agent-id: complete|pending }`. This enables resume from the exact agent where generation was interrupted (NFR9).

8. **Module directory structure follows existing patterns** — Reference Gyre at `_bmad/bme/_gyre/` for directory layout: `agents/`, `workflows/{workflow-name}/`, `contracts/` (Sequential), `config.yaml`, `README.md`, `compass-routing-reference.md` (Sequential).

9. **Contract files are generated in this step (not 2.7)** — Contract content is team-specific artifact content (BMB's domain), not integration wiring. Story 2.7 handles config.yaml, module-help.csv, and activation validation. Story 2.8 handles agent-registry.js.

### What NOT to Do

- Do NOT create JS modules (`manifest-tracker.js`, `naming-enforcer.js`, `cascade-logic.js`, `collision-detector.js`, any writers/) — those are for later stories
- Do NOT create JSON Schema files (`schema-independent.json`, `schema-sequential.json`)
- Do NOT create shared template files in `_bmad/core/resources/templates/` — P1/P6 prerequisite not met
- Do NOT create `config.yaml` or `module-help.csv` for generated teams — that's Story 2.7
- Do NOT write to `agent-registry.js` — that's Story 2.8
- Do NOT create test files or fixtures — no JS code exists to test
- Do NOT modify step-00-route.md, step-01-scope.md, or step-02-connect.md
- Do NOT generate actual team artifacts — Step 4 is LLM instructions for HOW to generate, not the generation itself
- Do NOT exceed 3 concepts in visibility checklist (NFR2)

### Context Variables Consumed from Step 3

- `team_name`: display name
- `team_name_kebab`: kebab-case for file/directory naming
- `spec_file_path`: path to the YAML spec file
- `spec_file_written`: boolean confirmation
- `resume_point`: should be "generate"

### Context Variables from Spec File (loaded in PART 1)

- `composition_pattern`: "Sequential" or "Independent"
- `agents[]`: array with id, role, capabilities, pipeline_position
- `contracts[]`: array with id, source_agent, target_agents, artifact_title, key_sections, file_name
- `feedback_contracts[]`: reverse-flow contracts (may be empty)
- `integration.output_directory`: artifact output path
- `integration.compass_routing`: routing decision
- `integration.contract_prefix`: prefix string (Sequential only)
- `progress`: step-level completion status

### Existing Team Module Structure Reference (Gyre)

```
_bmad/bme/_gyre/
├── README.md
├── config.yaml
├── compass-routing-reference.md
├── agents/
│   ├── stack-detective.md
│   ├── model-curator.md
│   ├── readiness-analyst.md
│   └── review-coach.md
├── workflows/
│   ├── stack-detection/
│   ├── model-generation/
│   ├── gap-analysis/
│   ├── accuracy-validation/
│   ├── full-analysis/
│   ├── model-review/
│   └── delta-report/
├── contracts/
│   ├── gc1-stack-profile.md
│   ├── gc2-capabilities-manifest.md
│   ├── gc3-findings-report.md
│   └── gc4-feedback-loop.md
└── guides/
```

### File Generation Summary

| File | Location | Pattern |
|------|----------|---------|
| step-04-generate.md | `.claude/skills/bmad-team-factory/step-04-generate.md` | CREATE |
| workflow.md | `.claude/skills/bmad-team-factory/workflow.md` | MODIFY |
| step-03-review.md | `.claude/skills/bmad-team-factory/step-03-review.md` | MODIFY |

### Previous Story Intelligence (from tf-2-5)

- Step files follow consistent pattern: PURPOSE → RULES → PARTs → STEP VALIDATION → Visibility Checklist → CHECKPOINT → NEXT
- Each PART is self-contained with clear conditional branching for Sequential vs Independent
- Visibility checklist at exactly 3/3 concept budget with "Colleague sees" and "Runs silently" sections
- CHECKPOINT includes progress table and explicit "Ready to proceed?" prompt
- NEXT section includes fallback note when the following step doesn't exist yet
- Context variables are recorded at the end for downstream consumption
- Spec file uses 2-space YAML indentation (BMAD standard)
- Resume detection checks spec file progress section for step completion status
- Code review found: cold-resume needs fallback, Section E should cover all non-default decisions, contract_prefix conditional on contract_count > 0, validation key list must be complete

### References

- [Epic file: Story 2.6](/_bmad-output/planning-artifacts/epic-team-factory.md) — lines 385-402
- [Architecture: LLM/JS Boundary](/_bmad-output/planning-artifacts/architecture-team-factory.md) — lines 757-768
- [Architecture: Write Boundaries](/_bmad-output/planning-artifacts/architecture-team-factory.md) — lines 781-788
- [Architecture: Directory Structure](/_bmad-output/planning-artifacts/architecture-team-factory.md) — lines 669-738
- [Architecture: D-TL Template Location](/_bmad-output/planning-artifacts/architecture-team-factory.md) — lines 436-452
- [Architecture Reference: Team Validity Checklists](/_bmad-output/planning-artifacts/architecture-reference-teams.md) — quality properties × composition patterns
- [Gyre module structure](/_bmad/bme/_gyre/) — reference for directory layout
- [step-03-review.md](/.claude/skills/bmad-team-factory/step-03-review.md) — spec file structure, progress tracking, context variables
- [Previous story: tf-2-5](/_bmad-output/implementation-artifacts/tf-2-5-decision-summary-spec-file-persistence.md) — step-file authoring patterns, code review findings

## Dev Agent Record

### Agent Model Used

### Completion Notes List

### Change Log

### File List
