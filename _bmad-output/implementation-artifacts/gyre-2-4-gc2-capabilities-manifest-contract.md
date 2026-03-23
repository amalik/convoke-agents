# Story 2.4: GC2 Capabilities Manifest Contract

Status: done

## Story

As a Lens agent,
I want the capabilities manifest in a structured format,
So that I can compare each capability against filesystem evidence.

## Acceptance Criteria

1. **Given** the GC2 contract exists at `_bmad/bme/_gyre/contracts/gc2-capabilities-manifest.md`
   **When** Atlas completes model generation
   **Then** GC2 contract frontmatter declares: source_agent: atlas, target_agents: [lens, coach]
   **And** schema matches the architecture specification (gyre_manifest with version, capabilities array, provenance)
   **And** **ARTIFACT SAFETY:** capabilities.yaml must not contain source code, file contents, or secrets (NFR9)
   **And** YAML schema version field enables future breaking changes (NFR17)

## Tasks / Subtasks

- [x] Task 1: Validate GC2 contract frontmatter (AC: #1)
  - [x] 1.1 Verify frontmatter fields: contract=GC2, type=artifact, source_agent=atlas, source_workflow=model-generation — confirmed lines 11-14
  - [x] 1.2 Verify target_agents=[lens, coach] — confirmed line 15
  - [x] 1.3 Verify input_artifacts=[GC1] — confirmed line 16
  - [x] 1.4 Verify created date field present — confirmed line 17

- [x] Task 2: Validate body schema against architecture spec (AC: #1)
  - [x] 2.1 Verify gyre_manifest top-level structure: version, generated_at, stack_summary, capability_count, limited_coverage — confirmed lines 49-53
  - [x] 2.2 Verify capabilities array with all required fields: id, category, name, description, source, relevance, amended, removed — confirmed lines 55-62
  - [x] 2.3 Verify provenance object: standards_referenced, web_search_performed, web_search_date — confirmed lines 63-66
  - [x] 2.4 Verify field reference table matches schema (all fields documented with types) — confirmed lines 71-90, 20 fields documented

- [x] Task 3: Validate capability categories and sources (AC: #1)
  - [x] 3.1 Verify 4 category definitions: observability, deployment, reliability, security with typical counts — confirmed lines 96-101
  - [x] 3.2 Verify 3 source types: standard, practice, reasoning with descriptions — confirmed lines 107-111

- [x] Task 4: Validate artifact safety (NFR9) and versioning (NFR17) (AC: #1)
  - [x] 4.1 Verify NFR9 artifact safety rule: explicit statement that GC2 must not contain source code, file contents, or secrets — confirmed lines 37-39
  - [x] 4.2 Verify NFR17: version field documented as string for future breaking changes — confirmed line 73
  - [x] 4.3 Verify artifact location: `.gyre/capabilities.yaml` — confirmed line 117
  - [x] 4.4 Verify caching rule: manifest IS the cache (NFR10) — confirmed line 118
  - [x] 4.5 Verify amendment persistence: Coach writes amendments via GC4 — confirmed line 119

- [x] Task 5: Validate downstream consumption and example (AC: #1)
  - [x] 5.1 Verify downstream consumers documented: Lens (evidence comparison) and Coach (review/amendment) — confirmed lines 125-128
  - [x] 5.2 Verify example YAML follows the schema correctly — confirmed lines 134-172, all 7 frontmatter fields + full body schema
  - [x] 5.3 Verify validation rules section: 10 rules covering frontmatter, body, safety, uniqueness, counts — confirmed lines 178-190

- [x] Task 6: Cross-reference with architecture spec
  - [x] 6.1 Verify contract schema matches architecture-gyre.md GC2 section exactly — confirmed lines 440-479, all fields identical; contract adds input_artifacts (enhancement)
  - [x] 6.2 Verify contract is listed in validator checks (4 contract files in `_bmad/bme/_gyre/contracts/`) — confirmed gc1, gc2, gc3, gc4

- [x] Task 7: Fix any discrepancies found in Tasks 1-6 — No discrepancies found

## Dev Notes

### Pre-existing File — Validation Approach

The file `_bmad/bme/_gyre/contracts/gc2-capabilities-manifest.md` already exists (190 lines) from the 2026-03-21 architecture scaffolding. This story validates the existing file against the ACs and architecture spec. Fix any discrepancies found.

### Architecture Reference — GC2 Contract

From `architecture-gyre.md`:

- **Contract:** GC2
- **Type:** Artifact
- **Flow:** Atlas → Lens, Coach
- **Schema:** gyre_manifest with version, generated_at, stack_summary, capability_count, limited_coverage, capabilities array, provenance
- **Write path:** `.gyre/capabilities.yaml`

**Architecture schema fields:**
```yaml
gyre_manifest:
  version: string
  generated_at: ISO-8601
  stack_summary: string
  capability_count: integer
  limited_coverage: boolean
  capabilities:
    - id: string
      category: string
      name: string
      description: string
      source: string
      relevance: string
      amended: boolean
      removed: boolean
  provenance:
    standards_referenced: string[]
    web_search_performed: boolean
    web_search_date: ISO-8601
```

### Key Requirements to Validate

| Requirement | What to Check |
|---|---|
| NFR9 (artifact safety) | Explicit rule: no source code, file contents, or secrets |
| NFR17 (schema versioning) | version field as string for future breaking changes |
| NFR10 (model caching) | Manifest IS the cache — documented in artifact location |
| FR13 (capability fields) | id, category, name, description, source, relevance |
| FR15 (limited-coverage) | limited_coverage boolean + <20 threshold |

### What NOT to Modify

- **Do NOT modify Atlas agent file** — Already validated in Story 2.2
- **Do NOT modify model-generation workflow files** — Already validated in Story 2.3
- **Do NOT modify stack-detection workflow files** — Already validated in Story 1.3
- **Do NOT modify config.yaml** — Already validated in Story 1.1
- **Do NOT modify GC1 contract** — Already validated in Story 1.4
- **Do NOT modify agent-registry.js** — Already fixed in Story 1.6

### Previous Story Intelligence

From Story 2.3 completion notes:
- All 30 validation subtasks passed across 7 tasks and 5 files — zero discrepancies
- 12 FR/NFR requirements verified including FR13 (capability fields) and NFR9, NFR10, NFR17
- Model-generation step-04-write-manifest.md references GC2 schema — must match this contract
- Validation-only story pattern: third consecutive clean validation

From Story 2.2 completion notes:
- Atlas rules include: GC2 must not contain source code/file contents/secrets (NFR9)
- Atlas rules include: ≥20 capabilities or limited_coverage=true

From Story 2.1 completion notes:
- 72 capabilities generated following GC2 schema — proves schema is usable
- All capability fields present and correctly typed in generated manifests

### GC1 Contract Pattern (Reference)

GC1 (validated in Story 1.4) follows the same contract pattern:
- Frontmatter: contract, type, source_agent, source_workflow, target_agents, created
- Body: schema definition with field reference table
- Validation rules section
- Example YAML

### Project Structure Notes

- GC2 contract: `_bmad/bme/_gyre/contracts/gc2-capabilities-manifest.md` (190 lines, pre-existing)
- GC1 contract (reference pattern): `_bmad/bme/_gyre/contracts/gc1-stack-profile.md` (153 lines)
- Architecture spec: `_bmad-output/planning-artifacts/architecture-gyre.md`
- Model-generation step-04 (references GC2): `_bmad/bme/_gyre/workflows/model-generation/steps/step-04-write-manifest.md`

### References

- [Source: _bmad-output/planning-artifacts/epic-gyre.md — Story 2.4 ACs, lines 520-533]
- [Source: _bmad-output/planning-artifacts/architecture-gyre.md — GC2 contract, lines 440-480]
- [Source: _bmad/bme/_gyre/contracts/gc2-capabilities-manifest.md — Pre-existing GC2 contract (190 lines)]
- [Source: _bmad/bme/_gyre/contracts/gc1-stack-profile.md — GC1 reference pattern (153 lines)]
- [Source: _bmad-output/implementation-artifacts/gyre-2-3-model-generation-workflow.md — Story 2.3 completion]
- [Source: _bmad-output/implementation-artifacts/gyre-2-2-atlas-agent-definition.md — Story 2.2 completion]
- [Source: _bmad-output/implementation-artifacts/gyre-2-1-model-accuracy-spike-nfr19-gate.md — Story 2.1 NFR19 PASS]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

None — no errors encountered.

### Completion Notes List

- All 20 validation subtasks passed across 7 tasks — zero discrepancies found
- Task 1 (frontmatter): contract=GC2, type=artifact, source_agent=atlas, source_workflow=model-generation, target_agents=[lens, coach], input_artifacts=[GC1], created date — all correct
- Task 2 (body schema): gyre_manifest with 5 top-level fields, capabilities array with 8 fields, provenance with 3 fields, field reference table (20 fields) — all match architecture spec
- Task 3 (categories/sources): 4 categories (observability, deployment, reliability, security) with typical counts, 3 sources (standard, practice, reasoning) with descriptions — all correct
- Task 4 (safety/versioning): NFR9 artifact safety rule explicit, NFR17 version field as string, artifact location `.gyre/capabilities.yaml`, NFR10 caching rule, GC4 amendment persistence — all correct
- Task 5 (downstream/example): Lens and Coach consumers documented, example YAML follows schema, 10 validation rules covering all aspects — all correct
- Task 6 (cross-reference): Schema matches architecture-gyre.md GC2 section exactly; contract adds input_artifacts as enhancement over arch spec
- Task 7 (fix): No discrepancies found — fourth consecutive clean validation in Epic 2
- 5 FR/NFR requirements verified: NFR9, NFR17, NFR10, FR13, FR15
- This is a validation-only story — no files were created or modified

### Change Log

- 2026-03-23: Full validation of gc2-capabilities-manifest.md (190 lines) — all checks passed, no changes needed

### File List

- `_bmad/bme/_gyre/contracts/gc2-capabilities-manifest.md` (validated, no changes)
