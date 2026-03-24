# Story 1.1: Quality Properties & Composition Patterns

Status: in-progress

## Story

As a framework contributor,
I want to understand the four quality properties that define a valid BMAD team and the composition patterns available,
So that I can make informed architectural decisions before building a new team.

## Acceptance Criteria

1. **Given** a framework contributor opens the Architecture Reference
   **When** they read the composition pattern section
   **Then** two composition patterns are defined — Independent and Sequential — with examples from existing teams (Vortex, native teams) (TF-FR4)
   **And** each pattern includes a clear description of when to use it, how agents interact, and how contracts differ

2. **Given** a framework contributor reads the quality property sections
   **When** they review the organizational structure
   **Then** the reference is organized around four quality properties: Discoverable, Installable, Configurable, Composable (TF-FR3)
   **And** each quality property is defined with a clear explanation of what it means for a team to satisfy it

## Tasks / Subtasks

- [ ] Task 1: Create Architecture Reference file scaffold (AC: #1, #2)
  - [ ] 1.1 Create `_bmad-output/planning-artifacts/architecture-reference-teams.md` with frontmatter and top-level structure
  - [ ] 1.2 Add document introduction explaining purpose, triple-audience design (human, factory, validator), and format conventions
  - [ ] 1.3 Structure document layout: Introduction → Composition Patterns (definitions) → Quality Properties (definitions) → 8 checklist sections (property × pattern stubs for Story 1.2)

- [ ] Task 2: Define composition patterns section (AC: #1 — TF-FR4)
  - [ ] 2.1 Write Independent pattern definition: description, when to use, how agents interact (standalone, no handoff contracts), note _enhance as closest existing example (skill module, not multi-agent — see dev notes caveat)
  - [ ] 2.2 Write Sequential pattern definition: description, when to use, how agents interact (pipeline with handoff contracts, shared artifacts), examples from Vortex (_vortex, 7 agents) and Gyre (_gyre, 4 agents)
  - [ ] 2.3 Add comparison table showing key differences: contracts, orchestration, agent independence, typical use cases
  - [ ] 2.4 Add a brief note that composition pattern choice affects which checklist items apply (foreshadows TF-FR17 cascade — one sentence, not detailed design)

- [ ] Task 3: Define quality properties section (AC: #2 — TF-FR3)
  - [ ] 3.1 Write Discoverable property: what it means (team can be found through standard surfaces), why it matters (contributor can't use what they can't find), key surfaces (module-help.csv, agent menu, BMad Master, README)
  - [ ] 3.2 Write Installable property: what it means (team installs cleanly through standard infrastructure), why it matters (zero manual file copying), key mechanisms (convoke-install, agent-registry.js, refresh-installation.js)
  - [ ] 3.3 Write Configurable property: what it means (team adapts to project context via config), why it matters (portability across projects), key mechanisms (config.yaml, activation XML, naming conventions)
  - [ ] 3.4 Write Composable property: what it means (team agents work together and with other teams), why it matters (cross-team routing, contract-driven handoffs), key mechanisms (contracts, compass routing, inter-module references)

- [ ] Task 4: Create 8 checklist section stubs for Story 1.2 (AC: #1, #2)
  - [ ] 4.1 Add all 8 property × pattern section headers (e.g., "## Discoverable — Independent", "## Discoverable — Sequential", etc.)
  - [ ] 4.2 Add placeholder note in each section indicating Story 1.2 will populate YAML checklists and Story 1.3 will add per-check "why" prose
  - [ ] 4.3 Ensure each section is individually addressable for JIT loading (concern #4) — no shared content between sections

- [ ] Task 5: Validate document structure and content
  - [ ] 5.1 Verify composition patterns reference real existing modules: Vortex/Gyre for Sequential, _enhance (with caveat) for Independent
  - [ ] 5.2 Verify all four quality properties defined with clear explanations
  - [ ] 5.3 Verify document has correct layout: intro → patterns → properties → 8 checklist stubs
  - [ ] 5.4 Verify no hardcoded factory rules — document is reference-only, rules come in Story 1.2 YAML blocks (TF-NFR5)

## Dev Notes

### This is a CREATION story — not validation-only

Unlike Gyre stories, Team Factory has no pre-scaffolded files. This story creates `architecture-reference-teams.md` from scratch.

### Architecture Reference Format (D-Q1 — Option B)

From `architecture-team-factory.md`:

- **Format:** Single `.md` file with embedded YAML data blocks
- **Location:** `_bmad-output/planning-artifacts/architecture-reference-teams.md`
- **Section granularity:** One section per quality property × composition pattern (~8 sections)
- **YAML block detection:** Structure-based — factory identifies blocks by presence of `quality_property`, `composition_pattern`, and `checks` top-level keys
- **Check ID structure:** Each check has id, rule, target_file, validation fields
- **Prose references check IDs inline** for traceability (e.g., "**DISC-01** — module-help.csv is the primary...")

### Quality Properties (TF-FR3 — A5' hypothesis-dependent)

Four quality properties organize the reference:
1. **Discoverable** — team can be found through standard surfaces
2. **Installable** — team installs cleanly through standard infrastructure
3. **Configurable** — team adapts to project context via config
4. **Composable** — team agents work together and with other teams

**Hypothesis note:** These properties derive from assumption A5' (High lethality, Medium uncertainty). Story 1.4 (Gyre Validation) is the formal test. The architecture should allow revision without rebuilding.

### Composition Patterns (TF-FR4 — A6' hypothesis-dependent)

Two composition patterns:
- **Independent** — standalone agents, no handoff contracts, each agent operates alone (e.g., _enhance module agents)
- **Sequential** — pipeline with handoff contracts, shared artifacts, agents form a workflow (e.g., Vortex 7-agent pipeline, Gyre 4-agent pipeline)

**Hypothesis note:** These patterns derive from assumption A6' (High lethality, Medium uncertainty). Gyre validation tests this. Architecture isolates pattern-dependent components.

### Existing Teams for Reference Examples

| Team | Module | Pattern | Agents | Contracts |
|------|--------|---------|--------|-----------|
| Vortex | `_bmad/bme/_vortex/` | Sequential | 7 (Emma, Isla, Mila, Liam, Wade, Noah, Max) | HC1-HC10 |
| Gyre | `_bmad/bme/_gyre/` | Sequential | 4 (Scout, Atlas, Lens, Coach) | GC1-GC4 |
| Enhance | `_bmad/bme/_enhance/` | Independent (closest) | Skill module with modes (no `agents/` dir) | None |

**_enhance caveat:** The _enhance module is a skill/workflow module with triage, review, and create modes — it has no `agents/` directory. It demonstrates the Independent module *structure* (standalone, no contracts) but lacks the agent file structure a true multi-agent Independent team would have. No pure Independent team currently exists in the codebase. The dev should note this when writing the Independent pattern definition.

### Integration Surfaces (TF-FR7 — documented in Story 1.2)

Story 1.1 defines the quality properties conceptually. Story 1.2 adds the machine-consumable YAML checklists covering all 8 integration surfaces:
1. agent-registry.js
2. refresh-installation.js
3. validator.js
4. contracts
5. config.yaml
6. module-help.csv
7. activation XML
8. naming conventions

### What NOT to Create (Out of Scope)

- **Do NOT create _team-factory module directory** — Created in Epic 2
- **Do NOT create YAML checklist content** — Story 1.2 scope
- **Do NOT create human-readable "why" prose per check** — Story 1.3 scope
- **Do NOT create Gyre validation** — Story 1.4 scope
- **Do NOT create any JS utilities or workflow files** — Epic 2 scope

### Phase 1 Exit Criteria (Story 1.1 contribution)

From architecture: "All 8 property×pattern sections complete with ≥3 checks each"
- Story 1.1 creates the document structure and defines properties/patterns
- Story 1.2 populates the YAML checklists (≥3 checks per section)

### Project Structure Notes

- Architecture Reference: `_bmad-output/planning-artifacts/architecture-reference-teams.md`
- Existing modules for examples: `_bmad/bme/_vortex/`, `_bmad/bme/_gyre/`, `_bmad/bme/_enhance/`

### References

- [Source: _bmad-output/planning-artifacts/epic-team-factory.md — Story 1.1 ACs]
- [Source: _bmad-output/planning-artifacts/architecture-team-factory.md — D-Q1, D-Q2, FR3, FR4, FR7, cross-cutting concerns]
- [Source: _bmad-output/planning-artifacts/architecture-team-factory.md — Phase 1 exit criteria, section granularity]

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### Change Log

### File List
