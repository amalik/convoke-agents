# Story 1.4: Bidirectional Gyre Validation

Status: ready-for-dev

## Story

As a framework contributor,
I want the Architecture Reference validated against the real Gyre module in both directions,
So that I have confidence the four quality properties and two composition patterns are correct and sufficient — not just theoretical constructs.

## Acceptance Criteria

1. **Given** the completed Architecture Reference
   **When** validated against the Gyre module at `_bmad/bme/_gyre/`
   **Then** every Sequential check in the reference can be evaluated against Gyre's actual file structure, registration, and configuration (TF-FR6 — predicts structure)
   **And** Gyre passes all applicable checks for its composition pattern

2. **Given** a hypothetical "build Gyre from scratch" scenario
   **When** a contributor follows only the Architecture Reference
   **Then** the reference provides sufficient information to recreate Gyre's directory structure, agent files, workflow layout, contract definitions, registration entries, and config (TF-FR6 — guides building)
   **And** any gaps discovered during validation are addressed in the reference or documented as intentional design decisions

3. **Given** the reference serves as hypothesis test for A5' (four quality properties) and A6' (two composition patterns)
   **When** Gyre validation reveals structural patterns that don't fit the four properties or two patterns
   **Then** the finding is documented as evidence for or against the hypotheses — the reference is the formal test, not just a prerequisite

## Tasks / Subtasks

- [ ] Task 1: Forward Validation — Reference Predicts Gyre (AC: #1)
  - [ ] 1.1 Evaluate all 7 Discoverable — Sequential checks (DISC-S-01 through DISC-S-07) against Gyre's actual files, recording pass/fail and evidence for each
  - [ ] 1.2 Evaluate all 8 Installable — Sequential checks (INST-S-01 through INST-S-08) against Gyre's actual registration, refresh, validator, and file structure
  - [ ] 1.3 Evaluate all 8 Configurable — Sequential checks (CONF-S-01 through CONF-S-08) against Gyre's config.yaml, agent files, naming conventions, and contract frontmatter
  - [ ] 1.4 Evaluate all 6 Composable — Sequential checks (COMP-S-01 through COMP-S-06) against Gyre's manifest entries, contracts, compass routing, and skill IDs

- [ ] Task 2: Reverse Validation — Reference Guides Building (AC: #2)
  - [ ] 2.1 Walk through the Architecture Reference as if building Gyre from scratch — for each quality property, determine whether the reference alone (without examining Gyre source code) provides enough information to know WHAT to create
  - [ ] 2.2 Document any gaps where the reference is insufficient: missing instructions, ambiguous rules, or unstated conventions that a contributor would need to discover independently
  - [ ] 2.3 For each gap found, classify as: (a) reference should be updated (actionable — fix in this story), (b) intentionally left to team-specific decisions (document as design note), or (c) Epic 2 factory scope (defer)

- [ ] Task 3: Hypothesis Evidence Collection (AC: #3)
  - [ ] 3.1 Review forward validation results for A5' evidence: do the four properties (Discoverable, Installable, Configurable, Composable) fully cover Gyre's structural requirements, or does Gyre have requirements that don't fit any property?
  - [ ] 3.2 Review forward validation results for A6' evidence: does the Sequential pattern accurately describe Gyre's composition, or does Gyre exhibit patterns (e.g., partial independence, conditional pipelines) that suggest a third pattern is needed?
  - [ ] 3.3 Write A5'/A6' evidence conclusions — explicitly state whether hypotheses are supported, partially supported, or falsified, with specific check results as evidence

- [ ] Task 4: Create Gyre Validation Report (AC: #1, #2, #3)
  - [ ] 4.1 Create `_bmad-output/planning-artifacts/gyre-validation-report.md` with three sections per FR6 spec: (1) Check Results, (2) Surprising Findings, (3) A5'/A6' Evidence Conclusions
  - [ ] 4.2 Section 1 — Check Results: table with columns [Check ID, Rule (brief), Pass/Fail, Evidence/Notes] covering all 29 Sequential checks
  - [ ] 4.3 Section 2 — Surprising Findings: document edge cases, near-misses, and structural patterns that were unexpected — whether they passed or failed
  - [ ] 4.4 Section 3 — A5'/A6' Evidence Conclusions: formal hypothesis assessment with specific check IDs as evidence references

- [ ] Task 5: Address Reference Gaps (AC: #2)
  - [ ] 5.1 For any gaps classified as "reference should be updated" in Task 2.3, apply fixes to `_bmad-output/planning-artifacts/architecture-reference-teams.md`
  - [ ] 5.2 Do NOT add new YAML checks — only update prose, fix validation descriptions, or clarify ambiguous rules
  - [ ] 5.3 Document all changes in the validation report's Surprising Findings section

- [ ] Task 6: Final Validation (AC: #1, #2, #3)
  - [ ] 6.1 Verify validation report has all 3 required sections per FR6 spec
  - [ ] 6.2 Verify all 29 Sequential check IDs appear in the Check Results table
  - [ ] 6.3 Verify A5'/A6' evidence conclusions reference specific check results
  - [ ] 6.4 Verify any reference updates (Task 5) do not modify YAML data blocks

## Dev Notes

### This is a VALIDATION story — not creation or modification

Stories 1.1-1.3 created the Architecture Reference content. This story validates it against the real Gyre module. The primary deliverable is `gyre-validation-report.md`, not changes to the reference (though minor fixes are allowed per AC#2).

### FR6 Output Specification

From `architecture-team-factory.md`:
> Gyre Validation Report (`gyre-validation-report.md`) in `_bmad-output/planning-artifacts/`. Three sections: (1) check results — pass/fail per check ID, (2) **surprising findings** — edge cases, near-misses, model limitation signals, (3) A5'/A6' evidence conclusions. Manual analysis, structured output.

### Which Checks Apply

Gyre is a **Sequential** team (4-agent pipeline with handoff contracts). Only the 4 Sequential checklist sections apply:

| Section | Check IDs | Count |
|---------|-----------|-------|
| Discoverable — Sequential | DISC-S-01 through DISC-S-07 | 7 |
| Installable — Sequential | INST-S-01 through INST-S-08 | 8 |
| Configurable — Sequential | CONF-S-01 through CONF-S-08 | 8 |
| Composable — Sequential | COMP-S-01 through COMP-S-06 | 6 |
| **Total** | | **29** |

### Gyre Module Structure (Validation Target)

**Location:** `_bmad/bme/_gyre/`

**Agents (4):** stack-detective, model-curator, readiness-analyst, review-coach
**Short names (from registry):** Scout, Atlas, Lens, Coach
**Contract short names (frontmatter):** scout, atlas, lens, coach

**Workflows (7):** full-analysis, stack-detection, model-generation, model-review, gap-analysis, delta-report, accuracy-validation

**Contracts (4):** gc1-stack-profile, gc2-capabilities-manifest, gc3-findings-report, gc4-feedback-loop

**Other files:** README.md, config.yaml, compass-routing-reference.md

### Gyre Registration Surfaces

1. **agent-registry.js** — `GYRE_AGENTS` array (4 entries with id, name, icon, title, stream, persona), `GYRE_WORKFLOWS` array, derived `GYRE_AGENT_FILES`, `GYRE_AGENT_IDS`, `GYRE_WORKFLOW_NAMES`
2. **refresh-installation.js** — line ~186 copies `_bmad/bme/_gyre/` (agents, workflows, contracts, config)
3. **validator.js** — validates Gyre agent files, workflow.md files, config.yaml, contracts
4. **agent-manifest.csv** — rows for each Gyre agent with module=bme
5. **Skill directories** — `.claude/skills/bmad-agent-bme-{agent_id}/SKILL.md` for each agent

### Known Issues to Expect

- **DISC-S-05 (module-help.csv):** Known gap — existing bme submodules lack module-help.csv entries. Check has a NOTE in its validation field. Expected: FAIL with documented exception.
- **COMP-S-06 (contract chain coverage):** Gyre has 4 agents and 4 contracts (GC1-GC4). The pipeline is Scout→Atlas→Lens→Coach, but contracts may not cover every adjacent pair in the same way Vortex does. Verify carefully.

### Hypothesis Context

From `architecture-team-factory.md` cross-cutting concern #8:

- **A5' (four quality properties):** High lethality, Medium uncertainty. If falsified, reference structure, factory validation categories, and quality gate definitions need revision.
- **A6' (two composition patterns):** High lethality, Medium uncertainty. If falsified, cascade tree, pattern-aware validation rules, and spec file schema need a third branch.

The Architecture Reference IS the test for A5'. Gyre validation IS the test for A6'. Both are "Test First" priority.

### What NOT to Do (Out of Scope)

- **Do NOT add new YAML checks** — only validate existing ones
- **Do NOT create any JS utilities or workflow files** — Epic 2 scope
- **Do NOT modify the reference's YAML data blocks** — prose-only fixes allowed
- **Do NOT create or modify Gyre module files** — this is read-only validation

### Previous Story Intelligence

From Story 1.3 completion:
- All 50 check IDs have per-check "why" prose with bold inline references
- Extension Deployment Mechanism section added (~23 lines)
- Prose style: consequence-driven ("without X, Y breaks")
- Architecture reference is ~470 lines
- Code review patches applied: `DISC-01` → `DISC-I-01`, removed `convoke-help` references

From Story 1.2 completion:
- 50 checks across 8 sections (5, 7, 6, 8, 6, 8, 4, 6)
- module-help.csv gap documented in DISC-I-05/DISC-S-05
- Contract frontmatter uses agent short names (not config.yaml IDs)
- COMP-S-02 simplified to "at least one handoff contract .md file"

### Project Structure Notes

- Architecture Reference: `_bmad-output/planning-artifacts/architecture-reference-teams.md`
- Validation Report (to create): `_bmad-output/planning-artifacts/gyre-validation-report.md`
- Gyre module: `_bmad/bme/_gyre/`
- Agent registry: `scripts/update/lib/agent-registry.js`
- Refresh installation: `scripts/update/lib/refresh-installation.js`
- Validator: `scripts/update/lib/validator.js`
- Agent manifest: `_bmad/_config/agent-manifest.csv`
- Skill directories: `.claude/skills/bmad-agent-bme-{agent_id}/`

### References

- [Source: _bmad-output/planning-artifacts/epic-team-factory.md — Story 1.4 ACs]
- [Source: _bmad-output/planning-artifacts/architecture-team-factory.md — FR6 output spec, Phase 1 exit criteria, hypothesis sensitivity #8]
- [Source: _bmad-output/planning-artifacts/architecture-reference-teams.md — 29 Sequential checks to validate]
- [Source: _bmad-output/implementation-artifacts/tf-1-3-human-readable-context-extension-mechanism.md — Previous story intelligence]
