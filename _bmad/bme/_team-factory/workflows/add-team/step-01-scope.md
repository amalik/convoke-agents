# Step 01: Scope — Team Definition & Agent Inventory

## Purpose
Guide the contributor through defining their team's composition pattern, agents, and their roles. This is where architectural thinking happens — before any files are generated.

## Prerequisites
- Step 00 (Route) completed — contributor confirmed "Create Team"

## Placeholders used in this step

`step-04-generate.md` carries this table because *"a name that appears in exactly one command and is defined nowhere cannot be resolved by whoever drives the flow"*. This step had no table and two such names: the collision block used `{kebab}` and `{id1}`, neither defined anywhere, alongside a literal `...` that is not valid JavaScript. Both are gone.

| Placeholder | Resolves to |
|---|---|
| `{project-root}` | absolute path to the repository root |
| `{team_name_kebab}` | the team's kebab name, e.g. `pilot-test`. **Not `{kebab}`** — that spelling appeared once, in one command, defined nowhere |
| `{agent_id}` | one agent's kebab id, as collected in §3 |
| `{role}` | that agent's one-sentence role, as collected in §3 |
| `{capabilities}` | that agent's capabilities, **pipe-separated** (`a\|b\|c`). Pipes rather than commas so a comma inside a capability cannot split the list |
| `{pattern}` | `Independent` or `Sequential`, as chosen in §2 |
| `{scope_path}` | a PATH to the scoping scratch file this step writes in §4. It exists because §4 runs **before** §5 creates the spec, so there is nothing else on disk to read, and because §5 consumes the acknowledgments §4 produces — the order cannot be inverted |

## Execution Sequence

### 1. Team Identity

Ask the contributor for:
- **Team name** (human-readable, e.g., "Loom", "Gyre", "Sentinel")
- **What does this team do?** (1-2 sentence description)
- **Who uses it?** (target user persona)

Derive `team_name_kebab` from the team name using naming conventions:
- Lowercase, hyphens between words
- Must match: `/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/`
- Confirm with contributor: "Your team module will be at `_bmad/bme/_{team_name_kebab}/`"

### 2. Composition Pattern Selection

Present the two patterns with plain-language descriptions and examples:

> **Independent Pattern**
> Agents operate standalone — each handles a separate concern. No handoff contracts between them.
> _Think: a toolbox where each tool works on its own._
> Example: A team with a "documentation auditor" and a "dependency checker" — related but independent tasks.
>
> **Sequential Pattern**
> Agents form a pipeline — each one's output feeds the next. Handoff contracts define what gets passed.
> _Think: an assembly line where each station adds something._
> Examples: Vortex (7-agent discovery pipeline), Gyre (4-agent readiness analysis)

**Default suggestion:** Based on the team description, suggest the most likely pattern with reasoning.

**Cascade effect:** Once selected, the factory eliminates irrelevant decisions:
- **Independent selected** → Skip: contract design, pipeline ordering, feedback contracts, contract prefix, compass routing (mark as optional)
- **Sequential selected** → All decisions remain active

Load cascade logic:
```
run: node -e "const c = require('{project-root}/_bmad/bme/_team-factory/lib/cascade-logic.js'); console.log(JSON.stringify(c.getCascadeForPattern('{pattern}'), null, 2))"
expect: result.decisions → active decisions for this pattern
        result.eliminated → decisions removed by pattern selection
```

### 3. Agent Inventory

For each agent, collect:
- **Agent ID** (kebab-case, e.g., `knowledge-surveyor`) — enforce: `/^[a-z]+(-[a-z]+)*$/`
- **Display name** (first name persona, e.g., "Silo")
- **Icon** (single emoji)
- **Role** (what does this agent do — 1 sentence)
- **Title** (formal title, e.g., "Knowledge Survey Specialist")
- **Capabilities** (list of 2-5 key capabilities)
- **Pipeline position** (Sequential only — integer, 1-based)

Present agents one at a time. After each agent, ask: "Add another agent, or are you done?"

**Naming enforcement per agent:**
```
run: node -e "const n = require('{project-root}/_bmad/bme/_team-factory/lib/utils/naming-utils.js'); const id = '{agent_id}'; console.log(JSON.stringify({ valid: /^[a-z]+(-[a-z]+)*$/.test(id), id }))"
expect: result.valid === true → proceed
        result.valid === false → "Agent ID must be lowercase letters and hyphens only (e.g., 'knowledge-surveyor'). Got: '{agent_id}'"
```

### 4. Overlap Detection

After all agents are defined, run collision detection.

**Write the inventory to a file first.** The spec does not exist yet — §5 *Save Progress* creates it, and §5 needs the overlap acknowledgments this section produces, so the order cannot be inverted. Write what you have just collected to a scratch file:

```
run: node -e "require('{project-root}/_bmad/bme/_team-factory/lib/utils/run-context.js').initContext('{scope_path}', { team_name_kebab: '{team_name_kebab}', agents: [] })"
expect: the file exists — it is overwritten on each run, so a re-scope never inherits a previous inventory
```

Then append each agent you collected in §3, one command per agent, so no JSON is ever pasted:

```
run: node -e "const rc = require('{project-root}/_bmad/bme/_team-factory/lib/utils/run-context.js'), c = rc.readContext('{scope_path}'); c.agents.push({ id: '{agent_id}', role: '{role}', capabilities: '{capabilities}'.split('|') }); rc.recordContext('{scope_path}', 'agents', c.agents)"
expect: repeat once per agent; `{capabilities}` is pipe-separated so a comma inside a capability cannot split it
```

Now detect collisions against the file:

```
run: node -e "const rc = require('{project-root}/_bmad/bme/_team-factory/lib/utils/run-context.js'), cd = require('{project-root}/_bmad/bme/_team-factory/lib/collision-detector.js'); cd.detectCollisions(rc.readContext('{scope_path}'), '{project-root}/_bmad/_config/agent-manifest.csv', '{project-root}/_bmad/bme/').then(r => console.log(JSON.stringify(r, null, 2)))"
expect: result.hasBlocking === false → proceed with optional warnings
        result.hasBlocking === true → display blocks, ask contributor to rename
        result.warnings.length > 0 → display warnings, ask contributor to acknowledge or rename
```

**Level 3 (LLM capability overlap):** After JS detection, review each agent's role and capabilities against the existing agent manifest. Flag potential functional overlaps:
- "Your agent `{id}` with role '{role}' may overlap with existing agent `{existing_id}` ({existing_role}) in the {existing_module} module."
- Ask: "Is this intentional? If so, I'll note the acknowledgment."

### 5. Save Progress

Initialize the spec file:
- Create `team-spec-{team_name_kebab}.yaml` in `_bmad-output/planning-artifacts/`
- Populate: team identity, composition pattern, agents, overlap acknowledgments
- Set progress: `orient: complete, scope: complete, connect: pending, ...`

Display: "Scope complete. {N} agents defined for team **{team_name}** ({pattern} pattern). Moving to integration design."

Proceed to: `{project-root}/_bmad/bme/_team-factory/workflows/add-team/step-02-connect.md`

## Visibility Checklist — Step 1
Colleague sees:
  - [ ] Team identity questions (name, description, users)
  - [ ] Pattern selection with examples and recommendation
  - [ ] Agent definition prompts (one at a time)
Runs silently:
  - [ ] Naming validation (per agent)
  - [ ] Cascade logic (pattern → eliminated decisions)
  - [ ] Collision detection (JS Level 1-2)
Concept count: 3/3 (team identity, pattern, agents)
Approval prompt: "Here's your team scope: {summary}. Ready to design integration?"
