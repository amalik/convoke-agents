# Step 05: Validate — End-to-End Verification & Completion

## Purpose
Run comprehensive validation on the generated team, produce a file manifest, collect metrics, and conclude the factory run.

## Prerequisites
- Step 04 (Generate) completed — all files created and wired
- Spec file has progress.generate = "complete" (or all agent sub-entries complete)

> **Reached from `[VT] Validate Team`?** VT runs this step directly, so everything above must already exist: it validates a team that `add-team` generated **in this repository**, using that run's spec file and context file (`{context_path}`). Two of its checks, `REGISTRY-WIRING` and `ACTIVATION-VALID`, trust the results step-04 recorded in that file rather than re-checking them — so on a hand-built team they either fail or repeat whatever a hand-written context claims. That is why VT is a check on a team `add-team` generated, not on a hand-built one. Without the file, `readContext` throws; that is deliberate, so a missing context fails loudly instead of reading as a broken team.

> **`{context_path}`** is the path to the generation context Step 4 accumulated. Its shape, and which consumer reads each key, is defined in `step-04-generate.md` §Placeholders — including **`contract_files`**, which `end-to-end-validator.js::checkContractFiles` iterates and which passes **vacuously** when absent.
>
> **It persists.** This paragraph used to say the context was an in-memory Step-4 value with no persistence mechanism — gone if Steps 4 and 5 ran in separate sessions, with `checkConfig`/`checkActivation`/`checkRegistryWiring` reporting false failures on a correctly generated team, and the only remedy being to re-run Step 4's §5 wiring. Since tfr-1-1 it is a JSON file on disk, so Step 5 reads what Step 4 wrote regardless of session. **Never pass `{}`**: `run-context.js::readContext` throws when the file is absent precisely so a lost context fails loudly instead of masquerading as a broken team.

## Placeholders used in this step

Every `run:` block below substitutes these. Every placeholder a `run:` block PASSES TO A COMMAND is
defined here — narration slots in prose and in the display blocks are not, and `{team}`, `{path}` and
`{output_directory}` are used in this workflow but DEFINED nowhere in it (T213).

| Placeholder | Resolves to |
|---|---|
| `{project-root}` | absolute path to the repository root. Framework-wide convention |
| `{spec_path}` | **a PATH, not an object.** `{project-root}/_bmad-output/planning-artifacts/team-spec-{team_name_kebab}.yaml`, parsed via `run-context.js::loadSpec` |
| `{context_path}` | **a PATH, not an object.** `{project-root}/_bmad-output/planning-artifacts/.factory-context-{team_name_kebab}.json` — the generation context Step 4 accumulated, read with `run-context.js::readContext`, which throws when it is absent rather than returning `{}`. **Do not delete it when this step completes:** `[VT] Validate Team` runs this step directly against an existing team and reads this file, so deleting it makes VT unusable for that team. Step 04's table is the one that governs its lifetime |
| `{team_name_kebab}` | the team's kebab name, e.g. `pilot-test` |

## Execution Sequence

### 1. Load Spec & Manifest

Read the spec file and the generation manifest (list of all created/modified files).

### 2. End-to-End Validation

Run the full validation suite:

```
run: node -e "const rc = require('{project-root}/_bmad/bme/_team-factory/lib/utils/run-context.js'), v = require('{project-root}/_bmad/bme/_team-factory/lib/validators/end-to-end-validator.js'); rc.loadSpec('{spec_path}').then(s => v.validateTeam(s, rc.readContext('{context_path}'), '{project-root}')).then(r => console.log(JSON.stringify(r, null, 2)))"
expect: result.valid === true → all checks passed
        result.valid === false → display failing checks with details
```

The end-to-end validator checks:

**Structural checks:**
- Config.yaml exists and parses correctly
- Every agent file declared in config exists
- Every workflow has a workflow.md entry point
- Contract files exist (Sequential only)
- README exists

**Wiring checks:**
- Agent registry block exists with correct prefix
- All agents appear in the registry AGENTS array
- All workflows appear in the registry WORKFLOWS array
- Derived lists (AGENT_FILES, AGENT_IDS, WORKFLOW_NAMES) are correct
- Registry file passes `node require()` verification
- **`PERSONA-COVERAGE`** — every agent the spec declares carries at least one of `identity`, `communication_style` or `expertise` in its registry entry. These normally come from the agent file BMB authored; a spec that declares them explicitly under `persona:` also satisfies the check. It reads `agent-registry.js` **on disk**, at the `registry_path` §5d recorded, rather than trusting `registry_wiring_result.success`: for the whole of tf-2-13 the writer returned `success: true` over a registry of empty personas, and a gate that asks the writer whether the writer did its job reproduces exactly that. A hollow team fails here, named agent by agent.

  **`persona.role` is deliberately not counted.** Every agent must have a `role`, and `buildAgentEntry` copies it from the spec, so it is present whether or not extraction ever ran. Counting it made the check unable to fail.

  **A red `PERSONA-COVERAGE` on a team whose agents plainly have roles is the check working.** There are three causes, and they need different fixes:

  1. **§5d ran without a usable `agentFiles`.** Its output shows `personaCoverage.agentFilesIssues` or `.missingAgentFiles`, or the context has no `agent_files` key. **Re-running §5d alone does not repair this:** the block already exists, so the writer skips (`skipped: ["block already exists"]`) and the hollow block stays. First run `git diff scripts/update/lib/agent-registry.js` and confirm the diff is **only** this team's `<PREFIX>_*` block — `git checkout --` discards every uncommitted change in the file, not just yours. Then restore it with `git checkout -- scripts/update/lib/agent-registry.js`, record `agent_files` (step-04 §3), and re-run §5d.
  2. **The agent files are there, but the extractor does not recognise their persona markup.** It reads `<identity>`, `<communication_style>` and `<principles>` XML tags written exactly like that, or `## Identity`, `## Communication Style` and `## Principles` headings. A YAML `persona:` block, `### Identity`, or a tag with attributes (`<identity lang="en">`) extracts nothing. Fix the agent files to one of the two recognised shapes, then recover as in (1).
  3. **An agent file's name does not match its agent id.** Extracted personas are keyed by the file's basename (`agents/<id>.md`, or the directory name for `agents/<id>/SKILL.md`), so `agents/alpha.md` gives nothing to agent `alpha-analyzer` — with no entry in `agentFilesIssues` or `.missingAgentFiles`, and `AGENT-FILE-EXISTS` still green. Rename the file to the agent id, re-record `agent_files`, then recover as in (1).

**Naming checks:**
- Module directory matches `_{team_name_kebab}`
- Agent file names match agent IDs
- All names conform to naming conventions

**Pattern-specific checks (Sequential only):**
- At least one handoff contract exists
- Contract source/target agents match agent list
- Compass routing reference exists

### 3. Regression Check

Run by `validateTeam` in §2 — there is no separate command here.

**A block was deleted from this section (tfr-1-1).** It read `run: node -e "require('{project-root}/scripts/update/lib/validator.js')" logic`: it `require`d a module, called nothing, asserted nothing, and trailed a bare `logic` token that is not part of any command. It asserted nothing: loading `validator.js` exits non-zero only when `agent-registry.js` fails to load, and nothing read that exit — a regression check in name only. Nothing replaces it here: the regression check that exists runs inside §2's `validateTeam`.

**`REGISTRY-REGRESSION` is the regression check.** Generation modifies one shared file, `scripts/update/lib/agent-registry.js`, and this check proves it still loads with `require()`; it fails on a registry that does not load, and that alone makes the team invalid. It proves no more than that. A registry that loads can still change what its consumers report — a team whose prefix collides with a consumer's naming convention loads fine and changes a count (`T151`). And the claim that generation touches no other shared file holds only when step-01's collision check has run on the team's name as it stands — it stops a team named after an existing module before anything is written. Express Mode skips step-01, and a name edited at step-03 or between sessions reaches step-04 unchecked (`T177`).

**A Vortex installation check used to run here too, and was deleted (tfr-2-1, `T171`).** It compared a Vortex installation validation taken before generation with one taken after. When step-01's collision check has run on the team's name, nothing `add-team` writes changes what that validation reports, so it could only pass. Where that check was skipped (`T177`), generation can write into an existing module — a step file added to a Vortex workflow fails `Workflow step structure` — and the deleted check would have caught that. The fix for that path is the collision gate, not a regression check.

### 4. Display Results

**If all checks pass:**
```
═══════════════════════════════════════════════════
  ✅ TEAM FACTORY — Validation Complete
═══════════════════════════════════════════════════

  Team:     {team_name} (_{team_name_kebab})
  Pattern:  {composition_pattern}
  Agents:   {count}
  Checks:   {passed}/{total} passed

  FILES CREATED:
  ├── {project-root}/_bmad/bme/_{team_name_kebab}/config.yaml
  ├── _bmad/bme/_{team_name_kebab}/module-help.csv
  ├── _bmad/bme/_{team_name_kebab}/README.md
  ├── _bmad/bme/_{team_name_kebab}/agents/{agent_id}.md
  ├── _bmad/bme/_{team_name_kebab}/workflows/...
  ├── _bmad/bme/_{team_name_kebab}/contracts/...     [Sequential]
  └── _bmad/bme/_{team_name_kebab}/guides/...

  FILES MODIFIED:
  └── scripts/update/lib/agent-registry.js

  Spec file: {project-root}/_bmad-output/planning-artifacts/team-spec-{team_name_kebab}.yaml

═══════════════════════════════════════════════════
```

**If checks fail:**
Display each failing check with:
- Check name (e.g., CONFIG-EXISTS, REGISTRY-BLOCK)
- Step name (structural, wiring, naming, pattern)
- Expected vs actual values (per TF-NFR11)
- Suggested fix

Ask: "Would you like to fix these issues and re-validate, or save current state and resume later?"

### 5. Post-Completion Metrics

If validation passed, collect two brief metrics:
1. "What was the hardest step?" (orient/scope/connect/review/generate/validate)
2. "Would you use the factory again?" (yes/no/maybe)

Store in spec file metrics section. These feed self-instrumentation (concern #9).

### 6. Save Final State

Update spec file:
- progress.validate = "complete"
- metrics populated

### 7. Next Steps

Display guidance:
> "Your team **{team_name}** is ready! Here's what to do next:
>
> 1. **Review generated files** — Check agent personas, workflow steps, and contract schemas
> 2. **Fill in domain content** — The factory created structural skeletons; add your domain expertise
> 3. **Run `npx -p convoke-agents convoke-doctor`** — Verify the team passes framework-level validation
> 4. **Test with a real workflow** — Invoke one of your agents and run through a workflow
> 5. **Iterate** — Use the factory's Add Agent (Phase 3) to extend your team later
>
> Spec file saved at: `{project-root}/_bmad-output/planning-artifacts/team-spec-{team_name_kebab}.yaml`
> This file is your audit trail and can be used with Express Mode to recreate the team."

### 8. Abort Path (If Requested)

If the contributor requests abort at any point:
- Display the file manifest: "The following files were created during this factory run:"
- List each file with its path
- Provide removal instructions: "To remove all generated files, delete the following paths:"
- Note: "The spec file at `{project-root}/_bmad-output/planning-artifacts/team-spec-{team_name_kebab}.yaml` will be preserved for your records."

## Visibility Checklist — Step 5
Colleague sees:
  - [ ] Validation results summary (pass/fail per check)
  - [ ] Complete file manifest
  - [ ] Next steps guidance
Runs silently:
  - [ ] End-to-end validation suite
  - [ ] Registry regression check (`agent-registry.js` still loads)
  - [ ] Manifest generation
Concept count: 2/3 (validation results, next steps)
Approval prompt: N/A — this is the final step
