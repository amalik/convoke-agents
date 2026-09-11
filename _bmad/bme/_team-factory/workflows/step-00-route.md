# Step 00: Intent Routing

## Purpose
Classify the contributor's intent and route to the correct factory workflow.
This step is LLM-heavy — a colleague saying "I want to automate onboarding" requires reasoning about whether that's a team, an agent addition, or a skill addition.

## Execution

### Mode Detection

Check if this was invoked with data context:
- **data="resume"** → Load existing spec file, run `spec-differ.js` to find resume point, jump to that step
- **data="express"** → Ask for spec file path, load it, validate with `spec-parser.js`, jump to step-03-review
- **No data** → Proceed with intent classification below

### Intent Classification

Ask the contributor what they want to do. Listen for natural language descriptions and classify:

| Intent Signal | Route To |
|---------------|----------|
| "Create a new team", "build a team", "add a team module" | **add-team** workflow → step-01-scope.md |
| "Add an agent to [existing team]", "extend [team] with a new agent" | **add-agent** workflow (Phase 3 — not yet available) |
| "Add a skill/workflow to [agent]", "extend [agent]" | **add-skill** workflow (Phase 3 — not yet available) |
| Unclear / doesn't match | Ask clarifying question: "Are you looking to create an entirely new team, add an agent to an existing team, or add a workflow to an existing agent?" |

### For "Create Team" (Primary Flow)

1. Confirm the contributor wants to create a new team
2. Brief them on what the factory will do:
   > "We'll walk through 5 steps together:
   > 1. **Scope** — Define your team's agents, their roles, and how they work together
   > 2. **Connect** — Design integration wiring (contracts, config, routing)
   > 3. **Review** — Summary of all decisions for your approval
   > 4. **Generate** — Create all files via BMB delegation + integration wiring
   > 5. **Validate** — End-to-end validation confirming everything works
   >
   > At any point you can save progress and resume later."

3. Proceed to: `{project-root}/_bmad/bme/_team-factory/workflows/add-team/step-01-scope.md`

### For Phase 3 Workflows (Not Yet Available)

Display:
> "Add Agent and Add Skill workflows are planned for Phase 3 of the Team Factory. They do not ship yet,
> and there is no supported path that does the wiring for you.
>
> To extend a team by hand, work from an existing agent in the team you are extending — copy its file,
> its registry entry and its contract, and follow the same shape. `_bmad/bme/_vortex/` and
> `_bmad/bme/_gyre/` are the two worked examples that ship with the package."

### Resume Mode

1. Ask for the path to an existing `team-spec-*.yaml` file
2. Run: `node {project-root}/_bmad/bme/_team-factory/lib/spec-differ.js` logic:
   - Parse the spec file
   - Find the first non-complete step in the progress section
   - Display: "Found spec for team **{team_name}**. Progress: {completed steps}. Resuming from **{resume_step}**."
3. Jump to the appropriate step file

### Express Mode

1. Ask for the path to a completed `team-spec-*.yaml` file
2. Run: `node {project-root}/_bmad/bme/_team-factory/lib/spec-parser.js` logic:
   - Parse and validate the spec file against the appropriate schema
   - If validation fails: display errors, ask contributor to fix the spec file
   - If validation passes: display decision summary and jump to step-03-review.md

## Visibility Checklist — Step 0
Colleague sees:
  - [ ] Intent classification question or mode confirmation
  - [ ] Brief overview of factory steps (for Create Team)
  - [ ] Resume point summary (for Resume mode)
Runs silently:
  - [ ] Spec file parsing and validation (Resume/Express)
  - [ ] Resume point detection (Resume)
Concept count: 2/3
Approval prompt: "Ready to start creating your team?"
