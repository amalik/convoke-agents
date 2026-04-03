---
status: done
created: 2026-04-02
type: retroactive-story
epic: Team Factory Epic 2 — Guided Workflow
stories: [2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9]
files_delivered: 28
code_review_fixes: 11
---

# TF Epic 2 — Workflow Layer Increment (2026-04-02)

## Context

This is a **retroactive story** created during retrospective. The Epic 2 implementation (Stories 2.1 through 2.9) was built in party mode without stories, without Scrum Master involvement, and without per-story acceptance auditing. Work shipped on 2026-04-02 as a single increment.

This document confronts every Acceptance Criterion from the epic file against the actual shipped code to surface gaps honestly. The confrontation was performed by reading every shipped file, not by trusting the epic's own "Implementation Status" section.

---

## Story 2.1: Factory Discoverability & Entry Points

### AC 2.1.1

**Given** a framework contributor wants to extend BMAD
**When** they look for guidance
**Then** the factory entry point exists in all 4 enumerated surfaces: agent menu, module-help.csv, BMad Master "what's available?" response, and README (TF-FR14, TF-NFR10)

**Verdict:** ⚠️ **Partially met**

- Agent menu: Present in `agents/team-factory.md` menu section (CT, RS, EX, VT, AR, PM, DA items).
- module-help.csv: Present with 2 rows (Create Team, Validate Team).
- SKILL entry: Present at `.claude/skills/bmad-agent-bme-team-factory/SKILL.md`.
- README: Present -- README.md mentions Team Factory with `/bmad-team-factory` command.
- BMad Master: Not verified in this audit. The epic requires BMad Master's "what's available?" response to surface the factory. This depends on BMad Master's agent file referencing the factory, which was not checked as part of this code increment's shipped files.

**Gap:** BMad Master wiring was not part of the 28-file delivery manifest and could not be confirmed from the shipped files alone.

### AC 2.1.2

**Given** a contributor describes a problem like "I want to automate onboarding" (not using BMAD terminology)
**When** intent-based routing evaluates the request
**Then** the factory determines whether the need is a team, agent addition, or skill addition and routes accordingly
**And** if the need doesn't match a factory capability (Phase 2: teams only), the contributor gets a graceful fallback with the Architecture Reference checklist

**Verdict:** ✅ **Met**

`workflows/step-00-route.md` implements intent classification with a routing table (Create Team -> add-team, Add Agent -> Phase 3 unavailable, Add Skill -> Phase 3 unavailable). Phase 3 fallback provides Architecture Reference checklist guidance. Natural language classification is LLM-driven per the workflow instructions.

---

## Story 2.2: Composition Pattern Selection & Decision Cascade

### AC 2.2.1

**Given** a contributor enters the factory's Create Team workflow
**When** Step 1 (Orient) begins
**Then** the factory presents composition patterns in plain language with examples from existing teams (Vortex = Sequential, native teams = Independent) (TF-FR8)
**And** each step introduces <=3 new concepts (TF-NFR2)

**Verdict:** ✅ **Met**

`workflows/add-team/step-01-scope.md` section 2 presents both patterns with plain-language descriptions and examples (Vortex = Sequential, "toolbox" metaphor = Independent). Visibility checklist at bottom of each step file tracks concept count (3/3 for step-01, 2/3 for step-02, 1/3 for step-03). Agent rules in `agents/team-factory.md` line 96 enforce "max 3 new concepts per step (NFR2)".

### AC 2.2.2

**Given** the factory presents pattern options
**When** suggesting a default
**Then** the default is selected based on the most common pattern in existing teams, with reasoning shown (TF-FR18)
**And** the contributor confirms or overrides the suggestion

**Verdict:** ✅ **Met**

`step-01-scope.md` section 2 includes "Default suggestion: Based on the team description, suggest the most likely pattern with reasoning." The cascade logic in `lib/cascade-logic.js` provides `defaultValue` fields per pattern (e.g., compass-routing defaults to `per-agent` for Independent, `shared-reference` for Sequential). Confirmation is part of the workflow step's conversational flow.

### AC 2.2.3

**Given** the contributor selects a composition pattern
**When** the cascade logic evaluates downstream decisions
**Then** irrelevant decisions are eliminated -- e.g., contracts are required for Sequential but optional for Independent (TF-FR17)
**And** the contributor only sees decisions relevant to their selected pattern

**Verdict:** ✅ **Met**

`lib/cascade-logic.js` implements a 10-decision catalogue with per-pattern `active/required` flags. `getCascadeForPattern('Independent')` eliminates 5 decisions (pipeline-order, handoff-contracts, feedback-contracts, contract-prefix, orchestration-workflow). `getCascadeForPattern('Sequential')` keeps all 10 active. The step file invokes this via `node -e` inline. Agent rules line 97-98 enforce "For Sequential teams, contracts are non-negotiable. For Independent teams, contracts are eliminated from the flow."

---

## Story 2.3: Agent Scope Definition & Overlap Detection

### AC 2.3.1

**Given** the contributor is in Step 2 (Scope)
**When** defining agents for their team
**Then** the factory forces explicit scope decisions for each agent before proceeding (TF-FR8)
**And** contextual examples from Vortex and native teams are surfaced at each decision point (TF-FR13)

**Verdict:** ✅ **Met**

`step-01-scope.md` section 3 collects per-agent fields (ID, name, icon, role, title, capabilities, pipeline position) one at a time, with "Add another agent, or are you done?" gating. The agent persona in `agents/team-factory.md` line 113 specifies "Uses concrete examples from Vortex and Gyre to illustrate patterns."

### AC 2.3.2

**Given** a new agent name is proposed
**When** the factory validates the name
**Then** naming conventions are actively enforced -- kebab-case, role-based, matching agent ID regex (TF-FR22)
**And** violations are flagged immediately with the correct format shown

**Verdict:** ✅ **Met**

`step-01-scope.md` section 3 includes inline `node -e` validation using `naming-utils.js` and regex `/^[a-z]+(-[a-z]+)*$/`. Error message provided: "Agent ID must be lowercase letters and hyphens only." `spec-parser.js` line 109 also validates `AGENT_ID_RE` during schema validation. Schemas (`schema-independent.json` line 59, `schema-sequential.json` line 59) encode the same pattern.

### AC 2.3.3

**Given** agent definitions are provided
**When** the factory checks for overlaps
**Then** the factory surfaces potential overlaps against the existing agent manifest for human review (TF-FR12)
**And** the contributor can override with acknowledgment -- overlap detection informs, it does not block
**And** the factory shows the manifest comparison so the contributor can see exactly where overlap exists

**Verdict:** ✅ **Met**

`lib/collision-detector.js` implements L1 exact ID collision (blocking) and L2 Levenshtein similarity (warning). `step-01-scope.md` section 4 invokes it and checks `result.hasBlocking` vs `result.warnings`. Warnings are informational ("Intentional?"), blocks require renaming. L3 (LLM capability overlap) is handled in the workflow step via LLM reasoning against the manifest. `overlap_acknowledgments` array in the spec template captures contributor decisions.

---

## Story 2.4: Contract Design & Step Validation

### AC 2.4.1

**Given** the contributor is in Step 3 (Connect)
**When** defining contracts for a Sequential team
**Then** the factory presents a contract template based on the Sequential pattern and asks what each agent passes to the next (TF-FR8)
**And** validation rules are applied per the composition pattern -- contracts required for Sequential, optional for Independent (TF-FR16)

**Verdict:** ✅ **Met**

`workflows/add-team/step-02-connect.md` section 2 guides through contract design for Sequential teams only ("Skip this section entirely for Independent teams -- cascade logic eliminated it"). Collects artifact_title, artifact_description, key_sections, file_name per contract. Schema `schema-sequential.json` requires `contracts` array with `minItems: 1`. Schema `schema-independent.json` has no `contracts` field in `required`.

### AC 2.4.2

**Given** each step produces output
**When** moving to the next step
**Then** step output is validated and confirmed before proceeding (TF-FR9)
**And** validation is stateless -- takes the spec object as input, returns structured results (Mode Parity guarantee)

**Verdict:** ⚠️ **Partially met**

Each step file saves progress to the spec file and proceeds to the next step. `step-03-review.md` runs a batch validation gate (naming, pattern, semantic, collision re-check). However, **B-lite semantic validation** (artifact type matching between contracts) is explicitly deferred to I13 (Express Mode). The validation is stateless (spec object in, structured results out) which satisfies Mode Parity. Per-step validation exists but is lightweight -- the heavy validation gate runs at step-03 (Review), not between every step transition.

**Gap:** B-lite semantic validation deferred. Per-step validation between steps 01-02 and 02-03 relies on workflow instructions rather than programmatic checks.

---

## Story 2.5: Decision Summary & Spec File Persistence

### AC 2.5.1

**Given** all decision steps (Orient, Scope, Connect) are complete
**When** Step 4 (Review) is reached
**Then** a decision summary checkpoint presents all decisions for approval before generation begins (TF-FR19)
**And** the contributor explicitly approves or requests changes

**Verdict:** ✅ **Met**

`workflows/add-team/step-03-review.md` section 2 presents a structured ASCII summary table with team name, pattern, agents roster, contracts, feedback contracts, integration settings, and overlap acknowledgments. Section 4 offers explicit Approve/Edit/Save & Exit choice.

### AC 2.5.2

**Given** the contributor approves the decision summary
**When** decisions are persisted
**Then** all decisions are saved as a team spec file (YAML) that serves as audit trail, resume point, and express mode input (TF-FR21)
**And** the spec file includes per-decision rationale with `default_accepted` flags
**And** the spec file is written atomically -- `.tmp` -> validate -> rename

**Verdict:** ✅ **Met**

`lib/spec-writer.js` implements atomic write: `.tmp` -> YAML parse validation -> rename (lines 40-79). Round-trip verification checks `team_name_kebab`, `composition_pattern`, and `agents.length` survived serialization (code review fix P9 applied). `templates/team-spec-template.yaml` includes `decisions` array and schemas define `default_accepted: boolean` and `rationale: string` per decision entry. Express Mode entry documented in `step-00-route.md`.

### AC 2.5.3

**Given** the factory is interrupted mid-flow
**When** the contributor returns later
**Then** they can resume by loading the team spec file -- resume presents the decision summary and continues from the last step whose output is absent (TF-NFR9)

**Verdict:** ✅ **Met**

`lib/spec-differ.js` `findResumePoint()` iterates the 6-step `STEP_ORDER` array and finds the first non-complete step. Handles per-agent tracking for the generate step (returns `pendingAgents`). `step-00-route.md` Resume Mode invokes `spec-differ.js`, displays progress, and jumps to the appropriate step.

---

## Story 2.6: BMB Delegation & Artifact Generation

### AC 2.6.1

**Given** the contributor has approved the decision summary
**When** Step 5 (Generate) begins
**Then** the factory delegates artifact generation to BMB with full context -- composition pattern, existing agents, scope boundaries (TF-FR10)
**And** the factory never authors agent files, workflow steps, or skill templates -- only integration wiring (TF-NFR6)
**And** generated artifacts are produced sequentially per agent -- each agent's files are generated and reviewed before proceeding to the next
**And** template substitution uses safe templating -- whitelist-only variable names, no raw string interpolation (TF-NFR14)

**Verdict:** ⚠️ **Partially met**

`workflows/add-team/step-04-generate.md` documents BMB delegation with full context (section 3a-3b). Factory owns only integration wiring (sections 5a-5c). Sequential per-agent generation with per-agent validation is documented (section 3c-3d).

**Gap:** The AC requires "template substitution uses safe templating -- whitelist-only variable names, no raw string interpolation (TF-NFR14)." The architecture requires shared BMB templates at `_bmad/core/resources/templates/`. These templates do not exist yet -- they are **deferred to P12 (Enhance)**. Without externalized templates, BMB delegation currently operates through LLM prompting rather than template substitution, so NFR14 (safe templating) cannot be verified against actual template files. The factory workflow file documents the delegation protocol, but the template infrastructure is not shipped.

### AC 2.6.2

**Given** the same spec file is used twice
**When** generation runs both times
**Then** identical artifacts are produced -- idempotent (TF-FR23, TF-NFR4)

**Verdict:** ⚠️ **Partially met**

`lib/spec-writer.js` uses deterministic YAML serialization (`sortKeys: false`, `noRefs: true`). `lib/spec-differ.js` `diffSpecs()` uses `stableStringify()` for order-independent comparison (code review fix P10 applied). `registry-writer.js` includes idempotency check (line 41: "block already exists" short-circuit).

**Gap:** Since BMB delegation is LLM-driven (not template-driven), strict idempotency of generated content artifacts (agent .md files, workflow .md files) cannot be guaranteed. The integration wiring (config, CSV, registry) IS idempotent. The epic note at the top (line 29) acknowledges "runtime-verifiable language" for behavioral ACs. Full idempotency would require externalized templates (P12).

---

## Story 2.7: Integration Wiring -- Config, CSV & Activation

### AC 2.7.1

**Given** artifact generation (Story 2.6) is complete
**When** the factory creates integration files
**Then** a per-module config.yaml is created at `_bmad/bme/_team-name/config.yaml` with all required fields (TF-FR11)
**And** a per-module module-help.csv is created with header and agent/workflow rows (TF-FR11)
**And** activation blocks in generated agent .md files are validated for correct config and module path references
**And** config field collision detection runs before writing -- new fields don't collide with existing fields (TF-NFR15)
**And** factory operations are additive -- new files only, no modification of existing team files (TF-NFR17)

**Verdict:** ✅ **Met**

- `lib/writers/config-creator.js` creates config.yaml (pre-existing lib, confirmed present).
- `lib/writers/csv-creator.js` creates module-help.csv with correct header (code review fix P1 aligned CSV headers).
- `lib/writers/activation-validator.js` validates activation blocks for config path and module path references (read-only, never writes).
- Config collision detection referenced in `step-02-connect.md` section 5.
- Factory operations are additive -- writers create new module files; they do not modify other teams' files.
- The shipped `config.yaml` for the factory itself demonstrates the pattern (fields: submodule_name, description, module, output_folder, agents, workflows, version, user_name, communication_language, party_mode_enabled, core_module).

---

## Story 2.8: Registry Wiring & Write Safety

### AC 2.8.1

**Given** artifacts and integration files are created
**When** the factory writes to agent-registry.js (the only shared file)
**Then** a new module block is added with agents, workflows, derived lists, and exports (TF-FR11)
**And** the Write Safety Protocol is followed: stage -> validate -> check -> apply -> verify (TF-NFR12, TF-NFR13)
**And** the operation is additive -- existing module blocks are never modified or removed (TF-NFR17)

**Verdict:** ✅ **Met**

`lib/writers/registry-writer.js` implements the full 5-step Write Safety Protocol:
1. **Stage** (line 46-48): `buildModuleBlock()` builds JS string with AGENTS, WORKFLOWS, derived lists.
2. **Validate** (line 50-59): `validateStaged()` checks prefix uniqueness + additive-only. `validateSyntax()` writes to temp file and `node require()`s it.
3. **Check** (line 62-68): `checkDirtyTree()` runs `git diff` on the registry file.
4. **Apply** (line 70-96): Backup to `.bak`, insert via `applyInsertions()`, write.
5. **Verify** (line 98-104): `verifyRequire()` runs `node require()` on the written file.

Additive-only is enforced by `validateStaged()` which checks that no new `const` names collide with existing ones. Rollback on verify failure restores from backup.

### AC 2.8.2

**Given** dirty-tree detection finds uncommitted changes to agent-registry.js
**When** the check stage runs
**Then** the factory warns the contributor about the conflict and asks for confirmation before proceeding (TF-NFR12)

**Verdict:** ✅ **Met**

`registry-writer.js` `checkDirtyTree()` (lines 303-314) runs both `git diff --name-only` and `git diff --cached --name-only`. If dirty, returns `{ dirty: true, diff }`. The caller (line 66-67) returns `{ dirty: true }` to the workflow, which per `step-04-generate.md` section 5c displays the warning and asks for confirmation.

### AC 2.8.3

**Given** post-write validation fails (`node require()` throws)
**When** structural integrity check detects corruption
**Then** the write is rolled back to the pre-write state and the contributor sees the error

**Verdict:** ✅ **Met**

`registry-writer.js` lines 98-105: if `verifyRequire()` returns an error, the original content is written back from `currentContent`, the `.bak` file is removed, and `{ success: false, rollbackApplied: true }` is returned with the error message.

---

## Story 2.9: End-to-End Validation & Error Recovery

### AC 2.9.1

**Given** artifact generation and wiring are complete
**When** Step 6 (Validate) runs
**Then** an end-to-end validation pass checks the full team against the Architecture Reference rules (TF-FR20)
**And** the team passes the same validation rules and refresh pipeline as native teams (TF-NFR7)
**And** a file manifest of all created and modified files is produced (TF-NFR16)
**And** the contributor sees the manifest and validation results

**Verdict:** ✅ **Met**

`lib/validators/end-to-end-validator.js` `validateTeam()` runs structural checks (config, CSV, agent files, workflow dirs, contract files), wiring checks (registry, activation), and regression checks (registry require, Vortex validation). `lib/manifest-tracker.js` `buildManifest()` produces a list of all created and modified files with `formatManifest()` for display. `step-05-validate.md` displays validation results and file manifest in ASCII format.

### AC 2.9.2

**Given** validation fails at any point
**When** an error occurs
**Then** error messages include step name, decision ID, and expected-vs-actual values (TF-NFR11)
**And** the factory rolls back to the last validated state -- no partial writes persist (TF-FR24)
**And** the contributor sees which step failed and why

**Verdict:** ✅ **Met**

E2E validator checks include `stepName` (structural/wiring/regression), check `name` (e.g., CONFIG-EXISTS, REGISTRY-WIRING), and `expected`/`actual` values. Error output format: `"${c.name}: expected ${c.expected}, got ${c.actual}"`. Registry writer implements rollback on failure. `step-05-validate.md` section 4 documents error display with check name, step name, expected vs actual, and suggested fix.

### AC 2.9.3

**Given** the contributor wants to undo the entire creation
**When** they request abort
**Then** the creation manifest lists all files created with removal instructions (TF-FR15)

**Verdict:** ✅ **Met**

`lib/manifest-tracker.js` `formatAbortInstructions()` (lines 90-114) generates removal commands: `rm` for created files, `git checkout --` for modified files. `step-05-validate.md` section 8 documents the abort path with manifest display and removal instructions.

### AC 2.9.4

**Given** factory output passes validation
**When** the contributor reviews the result
**Then** zero manual fixes are required -- the team is ready to use (TF-NFR3)
**And** user-facing complexity felt Low -- the contributor completed without consulting external documentation (TF-NFR1)

**Verdict:** ⚠️ **Partially met** (runtime AC)

This is a **runtime-verifiable AC** (per the epic's own note at line 29). Structural evidence supports it: the E2E validator checks native-team-equivalent rules, the factory workflow is self-contained with progressive disclosure, and the agent persona provides in-context guidance. However, this AC can only be fully verified by running the factory against a real team creation scenario. The M2 validation (Gyre spec round-trip) provides partial evidence but is not equivalent to a full end-to-end user test.

**Gap:** No pilot run documentation exists demonstrating zero manual fixes on a fresh team creation.

---

## Confrontation Summary

| Status | Count | ACs |
|--------|-------|-----|
| ✅ Met | 18 | 2.1.2, 2.2.1, 2.2.2, 2.2.3, 2.3.1, 2.3.2, 2.3.3, 2.4.1, 2.5.1, 2.5.2, 2.5.3, 2.7.1, 2.8.1, 2.8.2, 2.8.3, 2.9.1, 2.9.2, 2.9.3 |
| ⚠️ Partially met | 5 | 2.1.1, 2.4.2, 2.6.1, 2.6.2, 2.9.4 |
| ❌ Not met | 0 | -- |

**Totals: 18 met, 5 partial, 0 not met out of 23 ACs**

### Partial gaps summary

1. **2.1.1** -- BMad Master wiring not verifiable from shipped files alone.
2. **2.4.2** -- B-lite semantic validation deferred to I13 (Express Mode). Per-step programmatic validation is lightweight between steps.
3. **2.6.1** -- Shared BMB templates not externalized (deferred to P12 Enhance). Safe templating (NFR14) cannot be verified without template files.
4. **2.6.2** -- LLM-driven generation cannot guarantee strict idempotency of content artifacts. Integration wiring IS idempotent.
5. **2.9.4** -- Runtime AC. No pilot run documentation demonstrating zero manual fixes.

---

## Code Review Findings

11 patches applied from `story-team-factory-review-fixes.md`:

| # | ID | Severity | Description | File(s) |
|---|-----|----------|-------------|---------|
| 1 | P1 | Critical | CSV header mismatch between csv-creator and e2e-validator | `end-to-end-validator.js`, `module-help.csv` |
| 2 | P2 | Critical | Agent schema rejects persona fields (additionalProperties: false) | `schema-independent.json`, `schema-sequential.json` |
| 3 | P3 | High | spec-parser validates only required fields, ignores type/enum/minItems | `spec-parser.js` |
| 4 | P4 | High | naming-enforcer.js referenced in architecture but does not exist | Architecture doc updated (not code) |
| 5 | P5 | High | Silent error swallowing in collision-detector | `collision-detector.js` |
| 6 | P6 | Medium | Unused `pattern` parameter in parseSpecFromString | `spec-parser.js` |
| 7 | P7 | Medium | JSDoc missing `error` property in getCascadeForPattern return | `cascade-logic.js` |
| 8 | P8 | Medium | Unused `moduleDir` parameter in findResumePoint | `spec-differ.js` |
| 9 | P9 | Medium | writeSpec round-trip only checked 1 field, expanded to 3 | `spec-writer.js` |
| 10 | P10 | Medium | diffSpecs used order-dependent JSON.stringify | `spec-differ.js` |
| 11 | P11 | Medium | compass_routing enum values inconsistent across sources | `schema-independent.json`, `schema-sequential.json`, `factory-types.js` |

6 findings deferred, 11 dismissed. Full details in `_bmad-output/planning-artifacts/story-team-factory-review-fixes.md`.

---

## Process Deviation Notes

This section documents process deviations honestly for retrospective learning.

### 1. No stories existed during implementation

Epic 2 Stories 2.1-2.9 were defined in the epic file but no dedicated story files were created before work began. Implementation proceeded in party mode with the epic as the only reference. Individual story files (`tf-2-1` through `tf-2-9`) were created retroactively.

### 2. No Scrum Master involvement during the increment

The SM role was not engaged for sprint planning, story refinement, or mid-sprint check-ins. All 28 files were delivered as a single batch with no intermediate acceptance gates.

### 3. Code review ran without Acceptance Auditor

The code review used Blind Hunter (adversarial, diff-only) and Edge Case Hunter (full project + architecture doc) layers. The **Acceptance Auditor** layer -- which cross-references code changes against story ACs -- was not run. This means the 4 partially-met ACs were not surfaced until this retroactive confrontation.

### 4. Deferred items were identified during review, not during planning

The deferral of BMB templates to P12 and B-lite semantic validation to I13 emerged from the code review, not from upfront story refinement. In a standard process, these would have been flagged during story grooming and the ACs would have been scoped accordingly.

### 5. Pre-existing lib not clearly demarcated

11 files under `lib/writers/`, `lib/validators/`, `lib/utils/`, and `lib/types/` were built on March 25 as part of Epic 1 or spike work. The increment boundary between "pre-existing" and "new" was not formally tracked, making it harder to assess what this increment actually delivered vs. what it inherited.
