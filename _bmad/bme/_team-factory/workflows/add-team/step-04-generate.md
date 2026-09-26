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
| `{project-root}` | absolute path to the repository root. Framework-wide convention, listed here because line above claims this table is complete |
| `{spec_path}` | **a PATH, not an object.** `{project-root}/_bmad-output/planning-artifacts/team-spec-{team_name_kebab}.yaml` — the file `step-01` §5 already wrote. Blocks parse it themselves via `run-context.js::loadSpec`, which wraps `spec-parser.js::parseSpec` and throws rather than handing a writer `undefined`. **There is no second copy of the spec**: duplicating on-disk state is the drift class this module keeps paying for |
| `{team_name_kebab}` | the team's kebab name, e.g. `pilot-test` |
| `{module_root}` | `{project-root}/_bmad/bme/_{team_name_kebab}`. Written `{project-root}`-prefixed because `createConfig` and `createCsv` echo this path back into the context file, and `end-to-end-validator.js` then `existsSync`es it raw in step 5 — a relative value there is two different answers from two directories (T168) |
| `{config_path}` | the config reference **as agents write it**: `{project-root}/_bmad/bme/_{team_name_kebab}/config.yaml`. Pass this placeholder form, not a resolved path — `activation-validator.js` check 2 requires it of every occurrence: if the block names `_bmad/bme/_{team_name_kebab}/config.yaml` anywhere without the `{project-root}/` prefix, §5c fails — in the load step or in the error boilerplate, both directions (T214). **What it does NOT check is that your LOAD step names the config at all** (T138): a step reading `Load config to get {user_name}…` or `Load ./config.yaml` spells no full path, so the check sees nothing and the prefixed mentions in your boilerplate satisfy it. Write the full prefixed path in the load step because the agent needs it, not because the gate will catch you |
| ~~`{agent_file_paths}`~~ | **Removed.** It was a second name for the context file's `agent_files`, and the two could disagree. Blocks now read `rc.readContext('{context_path}').agent_files`. `validateActivation` takes an array; a bare string iterates character-by-character, which is why the value must come from one place |
| `{registry_path}` | `{project-root}/scripts/update/lib/agent-registry.js` |
| `{context_path}` | **a PATH, not an object.** `{project-root}/_bmad-output/planning-artifacts/.factory-context-{team_name_kebab}.json`. A JSON file holding the generation context, created by the §1 block above and updated as the run proceeds. **`{project-root}`-prefixed, like every repo path in this table:** `run-context.js` refuses a relative path outright, because the same block run from two directories would otherwise read or write two different files (T168). Deliberately NOT under the team's own output directory: the abort manifest sweeps that tree, and a run's bookkeeping must survive its own abort. Previously the context lived only in the executor's head, which `step-05-validate.md` recorded as a live hazard — run steps 4 and 5 in separate sessions and it was gone, and `checkConfig`/`checkActivation`/`checkRegistryWiring` then reported **false failures on a correctly generated team**. Blocks read it with `run-context.js::readContext`, which **throws when the file is absent** rather than returning `{}`, because `{}` is what produced those false failures. **Keep it after step-05 completes:** `[VT] Validate Team` re-runs step-05 against an existing team and reads this file, so deleting it makes VT unusable for that team. Remove it only when that team no longer needs validating |

### Context keys — and the section that must write each one

**Every key below is read by at least one consumer. A key with no writer does not raise — it silently drops checks or drops files from the abort manifest.** That is why this table names an owner rather than only a reader.

| Key | Written by | Read by |
|---|---|---|
| `module_root` | §1 (the `initContext` block) | `manifest-tracker.js` |
| `config_yaml_path` | §5a (the block records it) | `checkConfig` |
| `module_help_csv_path` | §5b (the block records it) | `checkCsv` |
| `output_directory_path` | §5a-ii (the block records it) | `manifest-tracker.js`; the abort path removes it |
| `activation_validation_results` | §5c (the block records it — the WHOLE `{valid, results}` object) | `checkActivation` reads `.valid` |
| `registry_wiring_result` | §5d (the block records it — the whole object) | `checkRegistryWiring` |
| `registry_path` | §5d (the block records the path it wrote to) | `checkPersonaCoverage` — it inspects the file the writer TOUCHED, not one re-derived by convention |
| `agent_files` | **§3 — you record it** after BMB writes the agent files | `checkAgentFiles`, `manifest-tracker.js`, and §5c/§5d read it as `agentFiles` |
| `workflow_dirs` | **§3 — you record it** | `checkWorkflowDirs`; absent ⇒ **zero checks emitted** |
| `workflow_step_files` | **§3 — you record it** | `manifest-tracker.js`; absent ⇒ files left behind on abort |
| `contract_files` | **§4 — you record it** (Sequential only) | `checkContractFiles`; absent ⇒ **zero checks emitted** |
| `guide_files` | **§3 — you record it** | `manifest-tracker.js` |
| `readme_path` | **§7 — you record it** | `manifest-tracker.js` |
| `generated_files` | **§3/§6/§7 — you record it** | `manifest-tracker.js` |

**Every path you record here is absolute, `{project-root}`-prefixed.** `recordContext` guards the
context file's own path, not the values written into it, and step 5 hands these straight to
`fs.existsSync` (`end-to-end-validator.js::checkAgentFiles`, `::checkWorkflowDirs`) and to the abort
manifest. A relative value recorded here is the T168 failure one level in: it reads as present from the
directory step 4 ran in and absent from anywhere else.

## Execution Sequence

### 1. Load Spec & Plan Generation

Read the spec file. Build the generation plan:

**Files to generate (per agent):**
1. Agent definition file: `_bmad/bme/_{team}/agents/{agent_id}.md`
2. Workflow files: `_bmad/bme/_{team}/workflows/{workflow_name}/workflow.md` + step files
3. Contract files (Sequential): `_bmad/bme/_{team}/contracts/{contract_id}.md`
4. User guide: `_bmad/bme/_{team}/guides/{NAME}-USER-GUIDE.md`

**Integration files (whole team):**
5. Config: `{project-root}/_bmad/bme/_{team_name_kebab}/config.yaml`
6. Module help CSV: `_bmad/bme/_{team}/module-help.csv`
7. README: `_bmad/bme/_{team}/README.md`
8. Compass routing (Sequential): `_bmad/bme/_{team}/compass-routing-reference.md`

**Shared file modifications:**
9. Registry block in `scripts/update/lib/agent-registry.js`

Display the plan: "{N} files to create, 1 shared file to modify."

**Create the generation context — nothing else does.** Every later block reads it, and `readContext` throws when it is absent rather than returning `{}`, so this block is not optional:

```
run: node -e "require('{project-root}/_bmad/bme/_team-factory/lib/utils/run-context.js').initContext('{context_path}', { module_root: '{module_root}' })"
expect: the file exists at {context_path}. It is REPLACED on each run — a context left from an abandoned run would carry stale paths into the abort manifest, which emits removal instructions against every `created` entry
```

**You record what you generate.** §3, §4, §6 and §7 delegate file creation to BMB; the factory never sees those paths, so it cannot record them for you. After each of those sections, write what it produced into the context with the same command shape:

```
run: node -e "require('{project-root}/_bmad/bme/_team-factory/lib/utils/run-context.js').recordContext('{context_path}', '<key>', <value>)"
```

The §Placeholders table names which section owns each key. **A key nobody writes does not fail loudly — it silently removes checks**: `checkWorkflowDirs` and `checkContractFiles` iterate `(ctx.<key> || [])` and emit ZERO checks when the key is absent, and `buildManifest` omits every file it never heard about, so the abort path leaves them on disk.

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
- Config path: `{project-root}/_bmad/bme/_{team_name_kebab}/config.yaml` — the `{project-root}`-prefixed convention form, which is what every shipped agent file contains. An unprefixed reference resolves against wherever the agent is activated from, and §5c checks every occurrence of it, in the load step AND in the error boilerplate — an unprefixed reference in either fails (T214). It cannot check a load step that spells no path at all, which is BMB's compiler default, so the full prefixed path must be in the load step itself (T138)
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
Update spec file: `progress.generate.{agent_id}: "generated"` — **not `"complete"`**.

Nothing has validated these files yet: the activation gate moved to §5c (see §3c). Writing `"complete"` here made `spec-differ.js::findResumePoint` treat the generate phase as finished, so a run aborted at §5c resumed straight into `step-05` carrying an unvalidated agent, with no route back to §3. Promote each agent to `"complete"` only after §5c passes.

**Abort note.** §5a and §5b write to disk before §5c runs. If §5c fails, do NOT simply re-run step-04 from the top — `config-creator.js::createConfig` and `csv-creator.js::createCsv` are additive-only and will refuse with `already exists at target path`, failing their own `expect: result.success === true`. Remove `{module_root}/config.yaml` and `{module_root}/module-help.csv` first, or fix the agent files in place and re-run §5c alone. This is the ordering cost of the tf-2-12 Decision 2 gate move; it is recorded rather than hidden.

### 4. Contract Generation (Sequential Only)

For each contract in the spec:
- Generate contract file at `_bmad/bme/_{team}/contracts/{contract_id}.md`
- Include: frontmatter (contract ID, source, targets, type), artifact schema, key sections
- Follow existing contract patterns (Vortex HC1-HC10, Gyre GC1-GC4)

### 5. Integration Wiring (Factory-Owned)

**5a. Config Creation**
```
run: node -e "const rc = require('{project-root}/_bmad/bme/_team-factory/lib/utils/run-context.js'), cc = require('{project-root}/_bmad/bme/_team-factory/lib/writers/config-creator.js'); rc.loadSpec('{spec_path}').then(s => cc.createConfig(s, '{module_root}/config.yaml', '{project-root}/_bmad/bme/')).then(r => { if (r.success) rc.recordContext('{context_path}', 'config_yaml_path', r.filePath); console.log(JSON.stringify(r)); })"
expect: result.success === true
```

**5a-ii. Output Directory Creation**
The team's artifact directory is NOT created by any writer — each `ensureDir` above makes only the parent of the file it is writing. Create it explicitly, or the first workflow to produce an artifact fails on a missing path (tf-2-13, T133e; predicted by tf-2-11 Risk #3).
```
run: node -e "const rc = require('{project-root}/_bmad/bme/_team-factory/lib/utils/run-context.js'), cc = require('{project-root}/_bmad/bme/_team-factory/lib/writers/config-creator.js'); rc.loadSpec('{spec_path}').then(s => cc.ensureOutputDirectory(s, '{project-root}')).then(r => { if (r.success) rc.recordContext('{context_path}', 'output_directory_path', r.path); console.log(JSON.stringify(r)); })"
expect: result.success === true → the block has already written `output_directory_path` into `{context_path}`, so §8's manifest lists it and the abort path removes it. Confirm with `node -e "console.log(require('{project-root}/_bmad/bme/_team-factory/lib/utils/run-context.js').readContext('{context_path}').output_directory_path)"` — `readContext`, not `require`, which would impose a `.json` extension the path is not required to have
        result.success === false → display result.errors, fix before continuing
```

**5b. CSV Creation**
```
run: node -e "const rc = require('{project-root}/_bmad/bme/_team-factory/lib/utils/run-context.js'), csv = require('{project-root}/_bmad/bme/_team-factory/lib/writers/csv-creator.js'); rc.loadSpec('{spec_path}').then(s => csv.createCsv(s, '{module_root}/module-help.csv')).then(r => { if (r.success) rc.recordContext('{context_path}', 'module_help_csv_path', r.filePath); console.log(JSON.stringify(r)); })"
expect: result.success === true
```

**5c. Activation Validation (all agents)**
Runs here, not in §3, because `activation-validator.js` check 3 requires `config.yaml` to exist and §5a has just created it.
```
run: node -e "const rc = require('{project-root}/_bmad/bme/_team-factory/lib/utils/run-context.js'), av = require('{project-root}/_bmad/bme/_team-factory/lib/writers/activation-validator.js'); av.validateActivation(rc.readContext('{context_path}').agent_files, { configPath: '{config_path}', modulePath: 'bme/_{team_name_kebab}', moduleDir: '{module_root}' }).then(r => { rc.recordContext('{context_path}', 'activation_validation_results', r); console.log(JSON.stringify(r)); })"
expect: result.valid === true → the block has already written the WHOLE `{valid, results}` object into `{context_path}` as `activation_validation_results` (`end-to-end-validator.js::checkActivation` reads `.valid`). Set each `progress.generate.{agent_id}: "complete"`, then proceed to §5d
        result.valid === false → display result.results[].errors, fix before continuing; leave progress at "generated" so a resume returns here
```
**Accepted cost of the move (tf-2-12 Decision 2):** feedback is now per-team rather than per-agent — a malformed agent surfaces after all agents are generated instead of immediately after its own. This is a deliberate trade, not a regression; do not "fix" it by moving the gate back without also solving the config-ordering problem.

**5d. Registry Block (Full Write Safety Protocol)**
```
run: node -e "const rc = require('{project-root}/_bmad/bme/_team-factory/lib/utils/run-context.js'), rw = require('{project-root}/_bmad/bme/_team-factory/lib/writers/registry-writer.js'); rc.loadSpec('{spec_path}').then(s => rw.writeRegistryBlock(s, '{registry_path}', { agentFiles: rc.readContext('{context_path}').agent_files })).then(r => { rc.recordContext('{context_path}', 'registry_wiring_result', r); rc.recordContext('{context_path}', 'registry_path', '{registry_path}'); console.log(JSON.stringify(r)); })"
expect: the block has already written the WHOLE result object into `{context_path}` as `registry_wiring_result` (`end-to-end-validator.js::checkRegistryWiring` reads `.success` and `.written`), and the ABSOLUTE path it wrote to as `registry_path` (`checkPersonaCoverage` rejects a relative one; `{registry_path}` is `{project-root}`-prefixed, so it is already absolute and nothing is resolved against a cwd). Then, in THIS order — `personaCoverage` is `null` on every path except a completed write, so it cannot tell you which path you are on:
        result.dirty === true → NOTHING was written: `agent-registry.js` already had uncommitted changes. Show the contributor `result.diff` and ask how to proceed. Do NOT roll anything back — the only restore command in this flow, `git checkout --`, would discard exactly the uncommitted edits this check exists to protect. (A dirty result also has `success: false`, which is why this line comes first)
        result.success === false → display errors. If `result.rollbackApplied` is true the writer has already restored the file; otherwise nothing was written. Either way `personaCoverage` is null
        result.skipped includes "block already exists" → nothing was written and no coverage was computed. If an earlier run of this block wrote a hollow team, re-running cannot repair it — see step-05 §2, PERSONA-COVERAGE
        result.success === true with `written` non-empty → the write completed. NOW read `personaCoverage`: if `.empty` is non-empty, those agents are hollow — do not proceed on `success` alone, step-05's PERSONA-COVERAGE gate will refuse them. `.agentFilesIssues` and `.missingAgentFiles` list `agentFiles` entries that could not be used; they explain an empty `.empty` entry, but on their own they do not make the team hollow (an agent can still be covered by another entry or by its spec)
```

**Pass `agentFiles`.** Each agent's `persona.identity`, `.communication_style` and `.expertise` are extracted from the file BMB authored in §3a — the factory already commissions that content and previously discarded it, leaving every generated agent hollow beside the hand-written ones (tf-2-13, T131). Omitting `agentFiles` still succeeds; what changed in tfr-1-1 (T164a) is that it no longer succeeds *silently*. A value that is present but unusable — a bare string, an object, a path that does not exist or cannot be read — is reported in `result.personaCoverage.agentFilesIssues` or `.missingAgentFiles` instead of being coerced to `[]`. Whether the team is hollow is a separate question: `step-05`'s `PERSONA-COVERAGE` check reads the registry on disk and fails the run for any agent left without persona evidence. `success` deliberately still means "the write completed": coverage is a different fact, reported as its own field.

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
run: node -e "const rc = require('{project-root}/_bmad/bme/_team-factory/lib/utils/run-context.js'), mt = require('{project-root}/_bmad/bme/_team-factory/lib/manifest-tracker.js'); rc.loadSpec('{spec_path}').then(s => console.log(JSON.stringify(mt.buildManifest(s, rc.readContext('{context_path}')))))"
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
