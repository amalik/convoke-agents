# Step 04: Generate — File Creation & Integration Wiring

## Purpose
Generate all team files through BMB delegation for content artifacts and factory JS utilities for integration wiring. This is the step where decisions become files.

## Prerequisites
- Step 03 (Review) completed — contributor approved all decisions
- Spec file has progress.review = "complete"

## Placeholders used in this step

Every `run:` block below substitutes these. They are listed because a name that appears in exactly one command and is defined nowhere cannot be resolved by whoever drives the flow — which is the same class of defect tf-2-12 exists to remove.

| Placeholder | Resolves to |
|---|---|
| `{spec_data}` | the parsed spec object from `team-spec-{team_name_kebab}.yaml` (see `spec-parser.js::parseSpec` → `.spec`) |
| `{team_name_kebab}` | the team's kebab name, e.g. `pilot-test` |
| `{module_root}` | absolute path to `_bmad/bme/_{team_name_kebab}` |
| `{config_path}` | the config reference **as agents write it**: `{project-root}/_bmad/bme/_{team_name_kebab}/config.yaml`. Pass this placeholder form, not a resolved path — `activation-validator.js` check 2 accepts either, but the convention form is what agent files contain |
| `{agent_file_paths}` | a JS **array** of absolute paths to the generated agent `.md` files. `validateActivation` takes an array; a bare string iterates character-by-character |
| `{registry_path}` | absolute path to `scripts/update/lib/agent-registry.js` |
| `{generation_context}` | object accumulated across §3-§5: `{ module_root, agent_files, workflow_dirs, generated_files, config_yaml_path, module_help_csv_path, activation_validation_results, registry_wiring_result }`. Consumed by §8 `buildManifest` and by `step-05`'s `validateTeam` |

## Execution Sequence

### 1. Load Spec & Plan Generation

Read the spec file. Build the generation plan:

**Files to generate (per agent):**
1. Agent definition file: `_bmad/bme/_{team}/agents/{agent_id}.md`
2. Workflow files: `_bmad/bme/_{team}/workflows/{workflow_name}/workflow.md` + step files
3. Contract files (Sequential): `_bmad/bme/_{team}/contracts/{contract_id}.md`
4. User guide: `_bmad/bme/_{team}/guides/{NAME}-USER-GUIDE.md`

**Integration files (whole team):**
5. Config: `_bmad/bme/_{team}/config.yaml`
6. Module help CSV: `_bmad/bme/_{team}/module-help.csv`
7. README: `_bmad/bme/_{team}/README.md`
8. Compass routing (Sequential): `_bmad/bme/_{team}/compass-routing-reference.md`

**Shared file modifications:**
9. Registry block in `scripts/update/lib/agent-registry.js`

Display the plan: "{N} files to create, 1 shared file to modify."

### 2. Directory Structure

Create the module directory tree:
```
_bmad/bme/_{team_name_kebab}/
  agents/
  workflows/
  contracts/        (Sequential only)
  guides/
  config.yaml
  module-help.csv
  README.md
```

### 3. Agent Generation (Sequential, Per-Agent)

For each agent in pipeline order:

**3a. Agent Definition (BMB Delegation)**
Delegate to BMB (Bond) to generate the agent `.md` file. Provide full context:
- Agent ID, name, icon, role, title, capabilities
- Team name and composition pattern
- Config path: `_bmad/bme/_{team}/config.yaml`
- Communication style guidance from spec

The agent file must follow the standard BMAD agent template:
- Frontmatter with name and description
- Activation XML with config loading, menu, handlers, rules
- Persona section (role, identity, communication_style, principles)
- Menu items pointing to the agent's workflows

**3b. Workflow Generation (BMB Delegation)**
For each agent's workflows, delegate to BMB to generate:
- `workflow.md` — entry point with step sequence
- Step files — one per workflow step

**3c. Defer activation validation**
Activation validation does NOT run here. It requires `config.yaml` on disk, and this section executes *before* §5a creates it — validating here failed on a precondition the flow had not yet built. Moved to **§5c** per the tf-2-12 operator ruling (Decision 2, option (a)).

**3d. Update Progress**
Update spec file: `progress.generate.{agent_id}: "complete"`

### 4. Contract Generation (Sequential Only)

For each contract in the spec:
- Generate contract file at `_bmad/bme/_{team}/contracts/{contract_id}.md`
- Include: frontmatter (contract ID, source, targets, type), artifact schema, key sections
- Follow existing contract patterns (Vortex HC1-HC10, Gyre GC1-GC4)

### 5. Integration Wiring (Factory-Owned)

**5a. Config Creation**
```
run: node -e "const cc = require('{project-root}/_bmad/bme/_team-factory/lib/writers/config-creator.js'); cc.createConfig({spec_data}, '{module_root}/config.yaml', '{project-root}/_bmad/bme/').then(r => console.log(JSON.stringify(r)))"
expect: result.success === true
```

**5b. CSV Creation**
```
run: node -e "const csv = require('{project-root}/_bmad/bme/_team-factory/lib/writers/csv-creator.js'); csv.createCsv({spec_data}, '{module_root}/module-help.csv').then(r => console.log(JSON.stringify(r)))"
expect: result.success === true
```

**5c. Activation Validation (all agents)**
Runs here, not in §3, because `activation-validator.js` check 3 requires `config.yaml` to exist and §5a has just created it.
```
run: node -e "const av = require('{project-root}/_bmad/bme/_team-factory/lib/writers/activation-validator.js'); av.validateActivation({agent_file_paths}, { configPath: '{config_path}', modulePath: 'bme/_{team_name_kebab}', moduleDir: '{module_root}' }).then(r => console.log(JSON.stringify(r)))"
expect: result.valid === true → proceed to registry wiring (§5d)
        result.valid === false → display result.results[].errors, fix before continuing
```
**Accepted cost of the move (tf-2-12 Decision 2):** feedback is now per-team rather than per-agent — a malformed agent surfaces after all agents are generated instead of immediately after its own. This is a deliberate trade, not a regression; do not "fix" it by moving the gate back without also solving the config-ordering problem.

**5d. Registry Block (Full Write Safety Protocol)**
```
run: node -e "const rw = require('{project-root}/_bmad/bme/_team-factory/lib/writers/registry-writer.js'); rw.writeRegistryBlock({spec_data}, '{registry_path}').then(r => console.log(JSON.stringify(r)))"
expect: result.success === true → proceed
        result.dirty === true → warn contributor, ask for confirmation
        result.success === false → display errors, attempt rollback
```

**IMPORTANT:** The registry write uses the Full Write Safety Protocol:
1. **Stage** — Build module block in memory
2. **Validate** — Syntax check, prefix uniqueness, additive-only
3. **Check** — Dirty-tree detection (git diff on agent-registry.js)
4. **Apply** — Backup → write → verify
5. **Verify** — Re-read + `node require()` post-write validation

Show contributor: "Here's what will be added to agent-registry.js: [preview block]. Approve?"

### 6. Compass Routing (Sequential Only)

Generate `compass-routing-reference.md` with:
- Navigation table mapping workflows to agents
- "What do I do next?" routing for each workflow completion
- Cross-team routing suggestions if applicable

### 7. README Generation

Generate `README.md` with:
- Team description and purpose
- Agent roster with roles
- Quick start instructions
- Workflow overview

### 8. Manifest Tracking

Track all created and modified files:
```
run: node -e "const mt = require('{project-root}/_bmad/bme/_team-factory/lib/manifest-tracker.js'); console.log(JSON.stringify(mt.buildManifest({spec_data}, {generation_context})))"
```

### 9. Save Progress

Update spec file: `progress.generate: "complete"` (all agents done)

Display: "Generation complete. {N} files created, 1 file modified. Moving to validation."

Proceed to: `{project-root}/_bmad/bme/_team-factory/workflows/add-team/step-05-validate.md`

## Visibility Checklist — Step 4
Colleague sees:
  - [ ] Generation plan (file count and list)
  - [ ] Per-agent progress ("Generating agent {name}...")
  - [ ] Registry block preview + approval prompt
Runs silently:
  - [ ] BMB delegation calls
  - [ ] Activation validation, all agents at once after config exists (§5c — moved from §3c, tf-2-12 Decision 2)
  - [ ] Config/CSV creation
  - [ ] Write Safety Protocol (registry)
  - [ ] Manifest tracking
Concept count: 2/3 (generation progress, registry approval) — unchanged by the tf-2-12 §3c→§5c gate move: activation validation runs silently and was never a surfaced concept, so NFR2's ≤3 ceiling is not approached.
Approval prompt: "Here's what will be added to agent-registry.js — approve?"
