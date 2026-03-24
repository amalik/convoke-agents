# Story 1.1: Quality Properties & Composition Patterns

Status: ready-for-dev

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
  - [ ] 1.3 Structure document with 8 top-level sections: one per quality property × composition pattern (e.g., "Discoverable — Independent", "Discoverable — Sequential")

- [ ] Task 2: Define composition patterns section (AC: #1 — TF-FR4)
  - [ ] 2.1 Write Independent pattern definition: description, when to use, how agents interact (standalone, no handoff contracts), example from existing teams (native teams: _enhance module)
  - [ ] 2.2 Write Sequential pattern definition: description, when to use, how agents interact (pipeline with handoff contracts, shared artifacts), example from existing teams (Vortex: _vortex module, Gyre: _gyre module)
  - [ ] 2.3 Add comparison table showing key differences: contracts, orchestration, agent independence, typical use cases
  - [ ] 2.4 Document how composition pattern choice cascades to eliminate irrelevant decisions (preview of TF-FR17)

- [ ] Task 3: Define quality properties section (AC: #2 — TF-FR3)
  - [ ] 3.1 Write Discoverable property: what it means (team can be found through standard surfaces), why it matters (contributor can't use what they can't find), key surfaces (module-help.csv, agent menu, BMad Master, README)
  - [ ] 3.2 Write Installable property: what it means (team installs cleanly through standard infrastructure), why it matters (zero manual file copying), key mechanisms (convoke-install, agent-registry.js, refresh-installation.js)
  - [ ] 3.3 Write Configurable property: what it means (team adapts to project context via config), why it matters (portability across projects), key mechanisms (config.yaml, activation XML, naming conventions)
  - [ ] 3.4 Write Composable property: what it means (team agents work together and with other teams), why it matters (cross-team routing, contract-driven handoffs), key mechanisms (contracts, compass routing, inter-module references)

- [ ] Task 4: Stub placeholder sections for Story 1.2 YAML checklists
  - [ ] 4.1 Add stub headers for all 8 property × pattern checklist sections with placeholder notes for Story 1.2
  - [ ] 4.2 Ensure section structure follows D-Q1 format: prose + fenced YAML block structure ready for Story 1.2 population

- [ ] Task 5: Validate document structure and content
  - [ ] 5.1 Verify composition patterns reference at least one real existing team each (Vortex/Gyre for Sequential, _enhance for Independent)
  - [ ] 5.2 Verify all four quality properties defined with clear explanations
  - [ ] 5.3 Verify document structure supports JIT loading (sections individually addressable per concern #4)
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
| Enhance | `_bmad/bme/_enhance/` | Independent | Standalone enhance agent | None |

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
