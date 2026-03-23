# Story 1.6: Ecosystem Integration — Installer, Registry, Config-Driven Doctor

Status: done

## Story

As a Convoke user,
I want to install Gyre with `convoke-install-gyre` and have it validated by `convoke-doctor`,
So that Gyre integrates cleanly with my existing Convoke setup.

## Acceptance Criteria

1. **Given** `convoke-install-gyre` script follows `install-vortex-agents.js` pattern
   **When** user runs `convoke-install-gyre`
   **Then** it copies `_bmad/bme/_gyre/` contents to the project
   **And** registers Gyre agents in `agent-manifest.csv`
   **And** bin entry `convoke-install-gyre` exists in `package.json`

2. **Given** `agent-registry.js` exports Gyre arrays
   **When** registry is loaded
   **Then** it exports GYRE_AGENTS (4 agents) and GYRE_WORKFLOWS (7 workflows) arrays
   **And** derived lists (GYRE_AGENT_FILES, GYRE_AGENT_IDS, GYRE_WORKFLOW_NAMES) follow existing derivation pattern
   **And** workflow-to-agent assignments match the architecture spec

3. **Given** `convoke-doctor` is config-driven (ADR-001)
   **When** doctor runs with any module installed
   **Then** it discovers all modules by scanning `_bmad/bme/*/config.yaml`
   **And** for each module, reads `agents[]` and `workflows[]` from config.yaml
   **And** validates each declared agent file exists
   **And** validates each declared workflow directory exists
   **And** validates config.yaml conforms to the shared module schema
   **And** existing Vortex validation continues to pass unchanged

4. **Given** `refreshInstallation` is extended
   **When** refresh runs
   **Then** it copies all Gyre markdown files (agents, workflows, contracts, config, README) from source to project
   **And** generates `.claude/skills/` entries for Gyre agents
   **And** includes Gyre agents in `agent-manifest.csv` regeneration

5. **Given** `agent-manifest.csv` includes Gyre agents
   **When** manifest is examined
   **Then** all 4 Gyre agents (Scout, Atlas, Lens, Coach) are registered with correct paths and metadata

## Tasks / Subtasks

- [x] Task 1: Validate `package.json` bin entry (AC: #1)
  - [x] 1.1 Verify `convoke-install-gyre` bin entry exists pointing to `scripts/install-gyre-agents.js`

- [x] Task 2: Validate `scripts/install-gyre-agents.js` (AC: #1)
  - [x] 2.1 Verify script follows `install-vortex-agents.js` pattern: banner, prerequisites, output dir, refreshInstallation call, verification, success message
  - [x] 2.2 Verify script imports `GYRE_AGENTS` from agent-registry
  - [x] 2.3 Verify script calls `refreshInstallation` (not manual file copying)
  - [x] 2.4 Verify script calls `findProjectRoot()` (not `process.cwd()`)
  - [x] 2.5 Verify script reads version via `getPackageVersion()` (not hardcoded)

- [x] Task 3: Validate `scripts/update/lib/agent-registry.js` (AC: #2)
  - [x] 3.1 Verify GYRE_AGENTS array has 4 agents: stack-detective, model-curator, readiness-analyst, review-coach — each with id, name, title, icon, persona fields
  - [x] 3.2 Verify GYRE_WORKFLOWS array has 7 workflows: stack-detection, model-generation, gap-analysis, model-review, delta-report, full-analysis, accuracy-validation
  - [x] 3.3 Verify workflow-to-agent assignments match architecture spec: stack-detection→stack-detective, model-generation→model-curator, gap-analysis→readiness-analyst, model-review→review-coach, delta-report→readiness-analyst, full-analysis→stack-detective, accuracy-validation→model-curator
  - [x] 3.4 Verify derived lists: GYRE_AGENT_FILES, GYRE_AGENT_IDS, GYRE_WORKFLOW_NAMES follow same derivation pattern as Vortex
  - [x] 3.5 Verify all Gyre arrays are exported in module.exports

- [x] Task 4: Validate `scripts/convoke-doctor.js` config-driven design (AC: #3)
  - [x] 4.1 Verify `discoverModules()` scans `_bmad/bme/*/config.yaml` dynamically (no hardcoded module list)
  - [x] 4.2 Verify per-module checks: `checkModuleConfig()` validates agents[] and workflows[] arrays present
  - [x] 4.3 Verify `checkModuleAgents()` validates file existence only (agent files exist and are non-empty)
  - [x] 4.4 Verify `checkModuleWorkflows()` validates directory existence only (workflow.md present in each workflow dir)
  - [x] 4.5 Verify doctor does NOT perform content validation (contract schemas, workflow steps, agent protocol) — file existence ONLY per ADR-001
  - [x] 4.6 Verify global checks: output dir, migration lock, version consistency across all discovered modules

- [x] Task 5: Validate `scripts/update/lib/refresh-installation.js` Gyre support (AC: #4)
  - [x] 5.1 Verify section 2d copies Gyre agents using GYRE_AGENT_FILES from registry
  - [x] 5.2 Verify section 2d copies Gyre workflows using GYRE_WORKFLOW_NAMES from registry
  - [x] 5.3 Verify section 2d copies Gyre contracts directory
  - [x] 5.4 Verify section 2d copies Gyre config.yaml with config merge (preserving user prefs)
  - [x] 5.5 Verify section 2d copies Gyre README.md
  - [x] 5.6 Verify section 6b generates `.claude/skills/` entries for all GYRE_AGENTS
  - [x] 5.7 Verify skill SKILL.md content points to `_bmad/bme/_gyre/agents/` (not `_vortex/`)
  - [x] 5.8 Verify section 4 (manifest regeneration) includes GYRE_AGENTS alongside AGENTS

- [x] Task 6: Validate `agent-manifest.csv` (AC: #5)
  - [x] 6.1 Verify all 4 Gyre agents present: Scout (stack-detective), Atlas (model-curator), Lens (readiness-analyst), Coach (review-coach)
  - [x] 6.2 Verify paths use `_bmad/bme/_gyre/agents/` prefix
  - [x] 6.3 Verify canonicalId format: `bmad-agent-bme-{agent-id}`
  - [x] 6.4 Verify module column is `bme`

- [x] Task 7: Fix discrepancies found in Tasks 1-6
  - [x] 7.1 Fix `delta-report` workflow assignment: change from `review-coach` to `readiness-analyst` in agent-registry.js (architecture spec lines 650-651 confirm Lens owns delta-report)

## Dev Notes

### Pre-existing Files — Validation + Fix Approach

All ecosystem integration files already exist from the 2026-03-21 architecture scaffolding and subsequent Enhance module work. This story validates them against the ACs and fixes any discrepancies found.

Pre-existing files to validate:
- `package.json` — bin entry already present (line 22)
- `scripts/install-gyre-agents.js` (141 lines) — full installer implementation
- `scripts/update/lib/agent-registry.js` (215 lines) — GYRE_AGENTS, GYRE_WORKFLOWS, derived lists all present
- `scripts/convoke-doctor.js` (371 lines) — already config-driven with `discoverModules()`
- `scripts/update/lib/refresh-installation.js` (595 lines) — section 2d (Gyre) and 6b (Gyre skills) already present
- `_bmad/_config/agent-manifest.csv` — all 4 Gyre agents already registered

### Known Discrepancy: delta-report Workflow Assignment

**Bug found during context gathering:** In `agent-registry.js` line 189, `delta-report` workflow is assigned to `review-coach` (Coach). However, the architecture doc explicitly states:

> **Workflow 6: delta-report (Lens)** — Owner: Lens 🔬 (architecture-gyre.md lines 650-651)

And the Gyre Compass Routing Reference confirms:
> See what changed since last run → delta-report → Lens 🔬 (line 689)

And Lens's menu items include:
> 3. Delta Report — `workflow: delta-report` (line 358)

**Fix required:** Change line 189 from `{ name: 'delta-report', agent: 'review-coach' }` to `{ name: 'delta-report', agent: 'readiness-analyst' }`.

### ADR-001 Scope: File Existence Only

The config-driven doctor validates **file existence only**:
- Agent files exist and are non-empty
- Workflow directories exist with workflow.md
- config.yaml parses and has required sections

It does **NOT** validate content:
- Contract YAML schema correctness
- Workflow step completeness
- Agent protocol compliance

### Architecture Compliance

| Epic AC Reference | How Satisfied |
|---|---|
| AR9 (installer pattern) | `install-gyre-agents.js` follows `install-vortex-agents.js` pattern |
| AR10 (registry arrays) | GYRE_AGENTS (4), GYRE_WORKFLOWS (7), derived lists exported |
| AR11/ADR-001 (config-driven doctor) | `discoverModules()` scans `_bmad/bme/*/config.yaml` dynamically |
| AR12 (refreshInstallation) | Section 2d copies agents, workflows, contracts, config, README |
| AR13 (agent-manifest.csv) | 4 Gyre agents registered with correct paths and metadata |

### What NOT to Modify

- **Do NOT modify workflow files** — Already validated in Story 1.3
- **Do NOT modify the agent file** — Already validated in Story 1.2
- **Do NOT modify config.yaml** — Already validated in Story 1.1
- **Do NOT modify contracts** — Already validated in Story 1.4
- **Do NOT modify convoke-doctor.js** — Already config-driven, no changes needed
- **Do NOT modify refresh-installation.js** — Already has full Gyre support
- **Do NOT modify install-gyre-agents.js** — Already follows correct pattern
- **Do NOT modify agent-manifest.csv manually** — Generated by refreshInstallation
- **ONLY modify agent-registry.js** — Fix delta-report assignment (Task 7.1)

### Previous Story Intelligence

From Story 1.5 completion notes:
- All 16 cross-cutting validation subtasks passed — zero discrepancies
- FR51 monorepo detection coherently implemented across all 3 files
- Fifth consecutive clean validation from scaffolding (Stories 1.1-1.5)

From Story 1.1 completion notes:
- README.md required 4 factual corrections — pre-existing files CAN have minor inconsistencies
- Key learning: validate thoroughly, don't assume scaffolded files are perfect

**Key learning for this story:** The delta-report workflow assignment bug in agent-registry.js confirms that pre-existing files can have discrepancies. This is the first actual code fix in the Gyre initiative.

### Project Structure Notes

- Installer: `scripts/install-gyre-agents.js`
- Registry: `scripts/update/lib/agent-registry.js`
- Doctor: `scripts/convoke-doctor.js` (note: NOT in `scripts/update/`)
- Refresh: `scripts/update/lib/refresh-installation.js`
- Manifest: `_bmad/_config/agent-manifest.csv`
- Package: `package.json` (bin entry at line 22)

### References

- [Source: _bmad-output/planning-artifacts/epic-gyre.md — Story 1.6 ACs, lines 385-420]
- [Source: _bmad-output/planning-artifacts/architecture-gyre.md — Ecosystem Integration, lines 706-755]
- [Source: _bmad-output/planning-artifacts/architecture-gyre.md — delta-report ownership (Lens), lines 650-651, 689]
- [Source: scripts/install-gyre-agents.js — Pre-existing installer (141 lines)]
- [Source: scripts/update/lib/agent-registry.js — Pre-existing registry with delta-report bug, line 189]
- [Source: scripts/convoke-doctor.js — Pre-existing config-driven doctor (371 lines)]
- [Source: scripts/update/lib/refresh-installation.js — Pre-existing Gyre support, section 2d lines 185-267, section 6b lines 478-501]
- [Source: _bmad/_config/agent-manifest.csv — Pre-existing with 4 Gyre agents]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

None — no errors encountered.

### Completion Notes List

- All 26 validation subtasks passed across 6 files — one discrepancy found and fixed
- Tasks 1-2 (installer): `install-gyre-agents.js` follows Vortex pattern exactly — banner, prerequisites, output dir, refreshInstallation, verification, success
- Task 3 (registry): GYRE_AGENTS (4 agents), GYRE_WORKFLOWS (7 workflows), derived lists all correct. **One fix:** `delta-report` reassigned from `review-coach` to `readiness-analyst` per architecture spec
- Task 4 (doctor): Already fully config-driven per ADR-001 — `discoverModules()` scans dynamically, validates file existence only, no content validation
- Task 5 (refresh): Full Gyre support in section 2d (agents, workflows, contracts, config, README) and section 6b (skill generation)
- Task 6 (manifest): All 4 Gyre agents registered with correct paths, canonicalIds, and module column
- Task 7 (fix): Changed `delta-report` from `review-coach` to `readiness-analyst` and moved it under "Lens — Analyze" comment group
- Full test suite: 359 tests pass, 0 failures — no regressions from the fix
- First actual code change in the Gyre initiative (Stories 1.1-1.5 were validation-only with zero changes)

### Change Log

- 2026-03-23: Fixed delta-report workflow assignment in agent-registry.js (review-coach → readiness-analyst)
- 2026-03-23: Reordered GYRE_WORKFLOWS comment groups to match ownership (delta-report under Lens)

### File List

- `scripts/update/lib/agent-registry.js` (modified — delta-report assignment fix + comment reorder)
- `package.json` (validated, no changes)
- `scripts/install-gyre-agents.js` (validated, no changes)
- `scripts/convoke-doctor.js` (validated, no changes)
- `scripts/update/lib/refresh-installation.js` (validated, no changes)
- `_bmad/_config/agent-manifest.csv` (validated, no changes)
