# Story 1.4: GC1 Stack Profile Contract

Status: review

## Story

As an Atlas agent,
I want Scout's detection results in a structured format,
So that I can generate a contextually relevant capabilities manifest.

## Acceptance Criteria

1. **Given** the GC1 contract is created at `_bmad/bme/_gyre/contracts/gc1-stack-profile.md`
   **When** the contract file is examined
   **Then** it declares frontmatter: `contract: GC1`, `type: artifact`, `source_agent: scout`, `source_workflow: stack-detection`, `target_agents: [atlas, lens]`, `input_artifacts: []`, `created: YYYY-MM-DD`

2. **Given** the GC1 body schema is defined
   **When** Scout completes stack detection
   **Then** it writes the Stack Profile to `.gyre/stack-profile.yaml` following the GC1 schema with fields:
   `stack_profile.primary_language`, `primary_framework`, `secondary_stacks`, `container_orchestration`, `ci_cd_platform`, `observability_tooling`, `cloud_provider`, `communication_protocol`, `guard_answers`, `detection_confidence`, `detection_summary`

3. **Given** the privacy rule is enforced (AR8)
   **When** the contract schema is examined
   **Then** GC1 contains technology categories only — NOT file contents, file paths, version numbers, dependency counts, dependency names, or secrets
   **And** the privacy rule is stated explicitly in the contract document

4. **Given** the artifact location is specified
   **When** Scout writes the Stack Profile
   **Then** `.gyre/` directory is created on first run if it doesn't exist (FR42)
   **And** `.gyre/.lock` prevents concurrent analysis (NFR13)
   **And** write is atomic (write to temp, rename)

5. **Given** the contract follows the Vortex HC pattern
   **When** the contract structure is examined
   **Then** it has: title line, blockquote header, Frontmatter Schema section with field reference table, Body Schema section with field reference table, Artifact Location section, Downstream Consumption section, Example section, Validation Rules section

## Tasks / Subtasks

- [x] Task 1: Validate contract frontmatter (AC: #1)
  - [x] 1.1 Verify frontmatter schema block: `contract: GC1`, `type: artifact`, `source_agent: scout`, `source_workflow: stack-detection`, `target_agents: [atlas, lens]`, `input_artifacts: []`, `created: YYYY-MM-DD`
  - [x] 1.2 Verify Frontmatter Field Reference table has all 7 fields (contract, type, source_agent, source_workflow, target_agents, input_artifacts, created) with Required/Type/Description columns

- [x] Task 2: Validate body schema (AC: #2)
  - [x] 2.1 Verify body schema has all 11 fields: primary_language, primary_framework, secondary_stacks, container_orchestration, ci_cd_platform, observability_tooling, cloud_provider, communication_protocol, guard_answers (with deployment_model, protocol, custom sub-fields), detection_confidence, detection_summary
  - [x] 2.2 Verify Field Reference table has all fields with Required/Type/Description columns
  - [x] 2.3 Verify field types match architecture spec: secondary_stacks (string[]), observability_tooling (string[]), guard_answers (optional object), detection_confidence (enum: high/medium/low)
  - [x] 2.4 Verify guard_answers is marked as optional (only present if guard questions were asked)

- [x] Task 3: Validate privacy rule (AC: #3)
  - [x] 3.1 Verify explicit Privacy Rule section exists
  - [x] 3.2 Verify privacy rule lists all 6 prohibited items: file contents, file paths, version numbers, dependency counts, dependency names, secrets/tokens/credentials
  - [x] 3.3 Verify privacy boundary statement: "Everything downstream of GC1 works with category-level metadata"

- [x] Task 4: Validate artifact location and operational rules (AC: #4)
  - [x] 4.1 Verify Artifact Location section specifies path: `.gyre/stack-profile.yaml`
  - [x] 4.2 Verify directory creation rule: `.gyre/` created on first run if missing (FR42)
  - [x] 4.3 Verify concurrency rule: `.gyre/.lock` prevents concurrent analysis (NFR13)
  - [x] 4.4 Verify atomicity rule: write to temp file, then rename

- [x] Task 5: Validate contract structure against Vortex HC pattern (AC: #5)
  - [x] 5.1 Verify title line format: `# GC1: Stack Profile — Schema Definition`
  - [x] 5.2 Verify blockquote header with Contract, Type, Flow fields
  - [x] 5.3 Verify all major sections present: Frontmatter Schema, Privacy Rule, Body Schema, Artifact Location, Downstream Consumption, Example, Validation Rules
  - [x] 5.4 Verify Downstream Consumption table lists Atlas (model-curator) and Lens (readiness-analyst) with their purposes
  - [x] 5.5 Verify Example section has a complete valid GC1 artifact (frontmatter + body)
  - [x] 5.6 Verify Validation Rules section lists all rules for a valid GC1 artifact

- [x] Task 6: Fix any discrepancies found in Tasks 1-5 — No discrepancies found

## Dev Notes

### Pre-existing File

The file `_bmad/bme/_gyre/contracts/gc1-stack-profile.md` already exists (153 lines) from the 2026-03-21 architecture scaffolding session. This story validates the existing file against the ACs rather than creating from scratch. Fix any discrepancies found.

### Contract Pattern Reference

Gyre contracts follow the same pattern as Vortex handoff contracts (HC1-HC10). Pattern reference: `_bmad/bme/_vortex/contracts/hc1-empathy-artifacts.md`

Key structural elements:
- Title with em-dash and "Schema Definition" suffix
- Blockquote header: Contract ID | Type | Flow
- Frontmatter Schema with YAML code block + Field Reference table
- Body Schema with YAML code block + Field Reference table
- Sections for operational rules (location, concurrency, atomicity)
- Downstream Consumption table
- Complete Example with frontmatter + body
- Validation Rules as numbered list

### Architecture Compliance

| Requirement | How Satisfied |
|-------------|---------------|
| AR8 | Privacy rule: technology categories only — no file contents, paths, versions, secrets |
| FR42 | `.gyre/` directory creation on first run |
| NFR13 | `.gyre/.lock` concurrency protection |

### Schema Field Details (from architecture-gyre.md)

The architecture doc defines the GC1 schema at lines 401-432. Key points:
- `guard_answers` is optional — only present if guard questions were asked
- `guard_answers.custom` is an open object for non-standard guard answers
- `detection_confidence` is an enum: "high" | "medium" | "low"
- `secondary_stacks` is a string array (empty if single-stack project)
- `observability_tooling` is a string array (empty if none detected)

### What NOT to Modify

- **Do NOT modify workflow files** — Already validated in Story 1.3
- **Do NOT modify the agent file** — Already validated in Story 1.2
- **Do NOT modify config.yaml** — Already validated in Story 1.1
- **Do NOT create other contract files** — GC2-GC4 are in later epics

### Previous Story Intelligence

From Story 1.3 completion notes:
- All 4 workflow files matched spec exactly — zero discrepancies
- Third consecutive clean validation from scaffolding
- Privacy boundary enforced at both workflow.md and step-01 levels

From Story 1.1 completion notes:
- README.md required 4 factual corrections — pre-existing files CAN have minor inconsistencies

**Key learning:** Pre-existing files may have minor inconsistencies. Validate thoroughly.

### Project Structure Notes

- Contract file: `_bmad/bme/_gyre/contracts/gc1-stack-profile.md`
- Output artifact path: `.gyre/stack-profile.yaml` (relative to project/service root)
- Pattern reference: `_bmad/bme/_vortex/contracts/hc1-empathy-artifacts.md`

### References

- [Source: _bmad-output/planning-artifacts/epic-gyre.md — Story 1.4 ACs, lines 353-369]
- [Source: _bmad-output/planning-artifacts/architecture-gyre.md — GC1 contract definition, lines 401-438]
- [Source: _bmad-output/planning-artifacts/prd-gyre.md — FR42 (.gyre/ creation), NFR13 (.lock concurrency)]
- [Source: _bmad/bme/_vortex/contracts/hc1-empathy-artifacts.md — Vortex contract pattern reference]
- [Source: _bmad/bme/_gyre/contracts/gc1-stack-profile.md — Pre-existing file to validate]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

None — no errors encountered.

### Completion Notes List

- All 20 validation subtasks passed — zero discrepancies found
- Pre-existing GC1 contract file (153 lines) from 2026-03-21 scaffolding matches all ACs exactly
- No modifications to the contract file were required (Task 6 confirmed clean)
- Frontmatter: all 7 fields correct with Field Reference table
- Body schema: all 11 fields present with correct types, guard_answers correctly marked optional
- Privacy rule: all 6 prohibited items listed, boundary statement present
- Artifact location: path, directory creation (FR42), concurrency (NFR13), atomicity all specified
- Contract structure follows Vortex HC pattern with all required sections
- Example section contains a complete, valid GC1 artifact
- Validation Rules section has 7 rules covering all constraints
- This is a validation-only story — no files were created or modified

### Change Log

- 2026-03-23: Validated existing contract file — all checks passed, no changes needed

### File List

- `_bmad/bme/_gyre/contracts/gc1-stack-profile.md` (validated, no changes)
