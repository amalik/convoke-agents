# Story 1.1: Module Scaffolding & Config

Status: done

## Story

As a Convoke developer,
I want the Gyre module directory structure created at `_bmad/bme/_gyre/`,
So that all Gyre agents, workflows, and contracts have a home.

## Acceptance Criteria

1. **Given** the Gyre module is being created
   **When** the module structure is scaffolded
   **Then** the following exists:
   - `_bmad/bme/_gyre/config.yaml` with submodule_name, description, module, output_folder, agents list, workflows list, version, user_name, communication_language, party_mode_enabled, core_module fields
   - `_bmad/bme/_gyre/README.md` with module overview, agent table, workflow list (following Vortex README pattern)
   - `_bmad/bme/_gyre/agents/` directory (empty, populated by subsequent stories)
   - `_bmad/bme/_gyre/workflows/` directory (empty, populated by subsequent stories)
   - `_bmad/bme/_gyre/contracts/` directory (empty, populated by subsequent stories)
   **And** config.yaml lists 4 agents: stack-detective, model-curator, readiness-analyst, review-coach
   **And** config.yaml lists 7 workflows: full-analysis, stack-detection, model-generation, model-review, gap-analysis, delta-report, accuracy-validation

## Tasks / Subtasks

- [x] Task 1: Create Gyre module directory structure (AC: #1)
  - [x] 1.1 Create `_bmad/bme/_gyre/` directory
  - [x] 1.2 Create `_bmad/bme/_gyre/agents/` directory with `.gitkeep` (Story 1.2 populates)
  - [x] 1.3 Create `_bmad/bme/_gyre/workflows/` directory with `.gitkeep` (Story 1.3 populates)
  - [x] 1.4 Create `_bmad/bme/_gyre/contracts/` directory with `.gitkeep` (Story 1.4 populates)

- [x] Task 2: Create config.yaml (AC: #1)
  - [x] 2.1 Create `_bmad/bme/_gyre/config.yaml` with all required fields
  - [x] 2.2 Verify field values match architecture spec exactly

- [x] Task 3: Create README.md (AC: #1)
  - [x] 3.1 Create `_bmad/bme/_gyre/README.md` following Vortex README pattern
  - [x] 3.2 Include agent table, workflow list, contract list, file structure

## Dev Notes

### config.yaml — Exact Content

Use the architecture-specified config exactly:

```yaml
submodule_name: _gyre
description: Gyre Pattern - Production readiness discovery through stack analysis, contextual model generation, and absence detection
module: bme
output_folder: '{project-root}/_bmad-output/gyre-artifacts'
agents:
  - stack-detective
  - model-curator
  - readiness-analyst
  - review-coach
workflows:
  - full-analysis
  - stack-detection
  - model-generation
  - model-review
  - gap-analysis
  - delta-report
  - accuracy-validation
version: 1.0.0
user_name: '{user}'
communication_language: en
party_mode_enabled: true
core_module: bme
```

**Critical:** This config is the source of truth for config-driven doctor validation (Story 1.6). The `agents` and `workflows` arrays must match exactly what the architecture declares (AR2, AR5).

### README.md — Pattern Reference

Follow the Vortex README structure at `_bmad/bme/_vortex/README.md`. Include:

1. **Module title and description** — "Gyre Module" with description matching config.yaml: "Gyre Pattern - Production readiness discovery through stack analysis, contextual model generation, and absence detection"
2. **Agents table** — 4 agents with columns: #, Agent, ID, Icon, Role, File. **Note:** Vortex uses "Stream" as the 5th column (reflecting Innovation Vortex streams). Gyre uses "Role" instead (reflecting functional roles). Do not copy "Stream" from the Vortex pattern.

   | # | Agent | ID | Icon | Role | File |
   |---|-------|----|------|------|------|
   | 1 | Scout | `stack-detective` | 🔎 | Stack Detection | `agents/stack-detective.md` |
   | 2 | Atlas | `model-curator` | 📐 | Model Generation | `agents/model-curator.md` |
   | 3 | Lens | `readiness-analyst` | 🔬 | Readiness Analysis | `agents/readiness-analyst.md` |
   | 4 | Coach | `review-coach` | 🏋️ | Review & Feedback | `agents/review-coach.md` |

3. **Workflows table** — 7 workflows grouped by owning agent

   | Workflow | Directory | Owner |
   |----------|-----------|-------|
   | `full-analysis` | `workflows/full-analysis/` | Scout (orchestrator) |
   | `stack-detection` | `workflows/stack-detection/` | Scout |
   | `model-generation` | `workflows/model-generation/` | Atlas |
   | `model-review` | `workflows/model-review/` | Coach |
   | `gap-analysis` | `workflows/gap-analysis/` | Lens |
   | `delta-report` | `workflows/delta-report/` | Lens |
   | `accuracy-validation` | `workflows/accuracy-validation/` | Atlas |

4. **Handoff Contracts table** — 4 contracts (GC1-GC4)

   | Contract | Flow | Schema |
   |----------|------|--------|
   | GC1 | Scout → Atlas, Lens | `contracts/gc1-stack-profile.md` |
   | GC2 | Atlas → Lens, Coach | `contracts/gc2-capabilities-manifest.md` |
   | GC3 | Lens → Coach | `contracts/gc3-findings-report.md` |
   | GC4 | Coach → Atlas | `contracts/gc4-feedback-loop.md` |

5. **File Structure** — tree diagram of the complete module layout (showing agent, workflow, contract, and guide placeholders)

6. **Registry reference** — Point to `scripts/update/lib/agent-registry.js` as single source of truth (Story 1.6 adds registry entries)

Reproduce these tables exactly in the README.md file. Do not modify column values, ordering, or formatting.

### What NOT to Create in This Story

- **Do NOT create agent files** — Story 1.2 creates `stack-detective.md`; subsequent epics create the rest
- **Do NOT create workflow files** — Story 1.3 creates the stack-detection workflow
- **Do NOT create contract files** — Story 1.4 creates the GC1 contract
- **Do NOT create `compass-routing-reference.md`** — Story 1.7 creates this
- **Do NOT modify `agent-registry.js`** — Story 1.6 handles ecosystem integration
- **Do NOT modify `agent-manifest.csv`** — Story 1.6 handles registration
- **Do NOT modify `package.json`** — Story 1.6 adds the `convoke-install-gyre` bin entry
- **Do NOT create `_bmad-output/gyre-artifacts/`** — Output directory is created at runtime when agents write artifacts

This story creates ONLY the directory skeleton + config.yaml + README.md. All other files are explicitly assigned to subsequent stories to maintain clean story boundaries.

### Architecture Compliance

| Requirement | How Satisfied |
|-------------|---------------|
| AR1 (partial) | Module at `_bmad/bme/_gyre/` with config.yaml, README, agents/, workflows/, contracts/. `compass-routing-reference.md` deferred to Story 1.7 |
| AR2 | config.yaml lists 4 agents by ID |
| AR5 | config.yaml lists 7 workflows by name |

### Anti-Patterns to Avoid

- **Do NOT use `_gyre` (without `_bmad/bme/` prefix)** — The full path is `_bmad/bme/_gyre/`
- **DO create `.gitkeep` in empty directories** — Git does not track empty directories. Place a `.gitkeep` in `agents/`, `workflows/`, and `contracts/` so they persist after commit. Subsequent stories will add real files and can remove `.gitkeep` at that point
- **Do NOT add `migration_history` to config.yaml** — That field is appended by the migration runner, not authored manually
- **Do NOT hardcode version in README** — Reference config.yaml as the version source

### Project Structure Notes

- Module directory follows the exact pattern of `_bmad/bme/_vortex/`
- `_bmad/` directory paths are NOT renamed (BMAD Method compatibility rule)
- The `bme` parent module groups both Vortex and Gyre
- Output goes to `_bmad-output/gyre-artifacts/` (separate from `vortex-artifacts/`)

### References

- [Source: _bmad-output/planning-artifacts/architecture-gyre.md — Module Structure, Directory Layout, config.yaml]
- [Source: _bmad-output/planning-artifacts/epic-gyre.md — Story 1.1 ACs, Epic 1 overview]
- [Source: _bmad/bme/_vortex/config.yaml — Pattern reference for config structure]
- [Source: _bmad/bme/_vortex/README.md — Pattern reference for README structure]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

None — no errors encountered.

### Completion Notes List

- Module directory structure pre-existed from 2026-03-21 architecture scaffolding session
- config.yaml matched architecture spec exactly — no changes needed
- README.md required 3 factual corrections:
  - Lens role: "Gap Analysis" → "Readiness Analysis" (matching story spec)
  - GC1 flow: added Lens as target agent (Scout → Atlas, Lens)
  - GC2 flow: added Coach as target agent (Atlas → Lens, Coach)
  - delta-report workflow: reassigned from Coach to Lens (per architecture doc)
- Added .gitkeep files to agents/, workflows/, contracts/ directories
- No application code — markdown-only story, no tests applicable

### Change Log

- 2026-03-23: Validated existing scaffolding, fixed README factual errors, added .gitkeep files

### File List

- `_bmad/bme/_gyre/config.yaml` (existing, verified)
- `_bmad/bme/_gyre/README.md` (existing, modified — 4 corrections)
- `_bmad/bme/_gyre/agents/.gitkeep` (new)
- `_bmad/bme/_gyre/workflows/.gitkeep` (new)
- `_bmad/bme/_gyre/contracts/.gitkeep` (new)
