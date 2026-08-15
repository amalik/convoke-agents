# Step 05: Validate — End-to-End Verification & Completion

## Purpose
Run comprehensive validation on the generated team, produce a file manifest, collect metrics, and conclude the factory run.

## Prerequisites
- Step 04 (Generate) completed — all files created and wired
- Spec file has progress.generate = "complete" (or all agent sub-entries complete)

## Execution Sequence

### 1. Load Spec & Manifest

Read the spec file and the generation manifest (list of all created/modified files).

### 2. End-to-End Validation

Run the full validation suite:

```
run: node -e "const v = require('{project-root}/_bmad/bme/_team-factory/lib/validators/end-to-end-validator.js'); v.validateTeam({spec_data}, '{project-root}').then(r => console.log(JSON.stringify(r, null, 2)))"
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

**Naming checks:**
- Module directory matches `_{team_name_kebab}`
- Agent file names match agent IDs
- All names conform to naming conventions

**Pattern-specific checks (Sequential only):**
- At least one handoff contract exists
- Contract source/target agents match agent list
- Compass routing reference exists

### 3. Regression Check

Verify that existing teams still pass validation:
```
run: node -e "require('{project-root}/scripts/update/lib/validator.js')" logic
```

This confirms the factory's changes to shared files (agent-registry.js) didn't break existing teams.

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
  ├── _bmad/bme/_{team}/config.yaml
  ├── _bmad/bme/_{team}/module-help.csv
  ├── _bmad/bme/_{team}/README.md
  ├── _bmad/bme/_{team}/agents/{agent_id}.md
  ├── _bmad/bme/_{team}/workflows/...
  ├── _bmad/bme/_{team}/contracts/...     [Sequential]
  └── _bmad/bme/_{team}/guides/...

  FILES MODIFIED:
  └── scripts/update/lib/agent-registry.js

  Spec file: _bmad-output/planning-artifacts/team-spec-{team}.yaml

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
> Spec file saved at: `_bmad-output/planning-artifacts/team-spec-{team}.yaml`
> This file is your audit trail and can be used with Express Mode to recreate the team."

### 8. Abort Path (If Requested)

If the contributor requests abort at any point:
- Display the file manifest: "The following files were created during this factory run:"
- List each file with its path
- Provide removal instructions: "To remove all generated files, delete the following paths:"
- Note: "The spec file at {path} will be preserved for your records."

## Visibility Checklist — Step 5
Colleague sees:
  - [ ] Validation results summary (pass/fail per check)
  - [ ] Complete file manifest
  - [ ] Next steps guidance
Runs silently:
  - [ ] End-to-end validation suite
  - [ ] Regression check on existing teams
  - [ ] Manifest generation
Concept count: 2/3 (validation results, next steps)
Approval prompt: N/A — this is the final step
