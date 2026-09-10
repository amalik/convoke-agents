# Step 02: Connect — Integration Design

## Purpose
Guide the contributor through integration decisions: contracts (Sequential only), output directory, compass routing, and config field design. This step produces the integration section of the spec file.

## Prerequisites
- Step 01 (Scope) completed — team identity, pattern, and agents defined
- Spec file exists with progress.scope = "complete"

## Execution Sequence

### 1. Load Context

Read the spec file to get the team's composition pattern and agents.

### 2. Contract Design (Sequential Only)

> Skip this section entirely for Independent teams — cascade logic eliminated it.

For Sequential teams, guide through handoff contract design:

**Contract prefix:**
- Ask: "What prefix should your contracts use? Examples: HC (Vortex), GC (Gyre). This prefix + number becomes the contract ID (e.g., HC1, HC2)."
- Default suggestion based on team name initials

**Forward contracts (required):**
For each adjacent pair of agents in pipeline order:
- "Agent **{source}** (position {N}) passes output to **{target}** (position {N+1})"
- Ask for each contract:
  - **Artifact title** — What is this artifact called?
  - **Artifact description** — What does it contain? (1-2 sentences)
  - **Key sections** — What are the main sections of this artifact?
  - **File naming** — Default: `{prefix}{N}-{artifact-kebab}.md`

Present each contract for confirmation before moving to the next.

**Feedback contracts (optional):**
- "Does any downstream agent need to send structured feedback back upstream?"
- If yes: guide through the same contract template
- If no: skip — "No feedback contracts. You can add them later."

**Contract validation (B-lite semantic check):**
For each contract, verify:
- Source agent exists in the agent list
- Target agent(s) exist in the agent list
- No duplicate contract IDs

### 3. Output Directory

- Default: `_bmad-output/{team_name_kebab}-artifacts`
- Ask: "Where should your team's output artifacts be saved?"
- Validate: path should start with `_bmad-output/`

### 4. Compass Routing

**Sequential teams:**
- Required. "Your team needs a compass routing reference — a navigation table that helps users know what to do next after each workflow."
- Default: `shared-reference` (single file, like Vortex's `compass-routing-reference.md`)

**Independent teams:**
- Optional. "Would you like per-agent compass routing? This is optional for Independent teams since agents operate standalone."
- Default: `per-agent` or `optional`

### 5. Config Field Review

Summarize what will go into the team's `config.yaml`:
```
submodule_name: _{team_name_kebab}
description: {description}
module: bme
output_folder: '{project-root}/{output_directory}'
agents: [{agent_ids}]
workflows: [{workflow_names}]
version: 1.0.0
user_name: '{user}'
communication_language: en
party_mode_enabled: true
core_module: bme
```

Run config field collision detection:
```
run: node -e "const cc = require('{project-root}/_bmad/bme/_team-factory/lib/writers/config-creator.js'); cc.detectCollisions({spec_data}, '{project-root}/_bmad/bme/').then(c => console.log(JSON.stringify(c)))"
expect: result.length === 0 → no collisions, proceed
        result.length > 0  → display each {field, value, existingModule}, ask contributor to rename before continuing
```

### 6. Save Progress

Update the spec file:
- Add contracts, feedback_contracts, integration section
- Set progress: `connect: complete`

Display summary:
- "{N} forward contracts, {M} feedback contracts defined" (Sequential)
- "Output: {output_directory}, Compass routing: {routing_mode}"
- "Moving to decision review."

Proceed to: `{project-root}/_bmad/bme/_team-factory/workflows/add-team/step-03-review.md`

## Visibility Checklist — Step 2
Colleague sees:
  - [ ] Contract design prompts (Sequential only, one at a time)
  - [ ] Output directory confirmation
  - [ ] Config field summary
Runs silently:
  - [ ] Contract validation (source/target exist, no duplicate IDs)
  - [ ] Config field collision detection
  - [ ] Cascade elimination check (contracts skipped for Independent)
Concept count: 2/3 (contracts, integration settings) — or 1/3 for Independent (integration only)
Approval prompt: "Integration design complete. Ready for the full decision review?"
