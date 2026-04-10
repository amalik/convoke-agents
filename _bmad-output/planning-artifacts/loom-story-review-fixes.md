---
status: done
created: '2026-04-02'
source: code-review
epic: Team Factory
priority: high
---

# Story: Team Factory Code Review Fixes

**As a** Convoke maintainer
**I want** the Team Factory code review findings resolved
**So that** the factory produces correct output and passes its own validation

---

## Context

Code review of 17 new Team Factory files (commits dfc9398..d5f109a, +2,184 lines).
Review layers: Blind Hunter (adversarial, diff-only) + Edge Case Hunter (full project access).
Architecture reference: `_bmad-output/planning-artifacts/architecture-team-factory.md`

---

## Tasks

### Critical (must fix before release)

- [x] **P1: CSV header mismatch between csv-creator and e2e-validator**
  `csv-creator.js:14` uses hyphenated column names (`workflow-file`, `output-location`, trailing comma).
  `end-to-end-validator.js:142` expects underscored names (`workflow_file`, `output_location`, no trailing comma).
  Fix: align both to the same header format. Check which matches existing module-help.csv files.

- [x] **P2: Agent schema `additionalProperties: false` rejects persona fields**
  `schema-independent.json` and `schema-sequential.json` set `additionalProperties: false` on agent items.
  Agent items don't include `persona`, `communication_style`, `expertise`, `identity` — fields that `registry-writer.js:159-173` reads.
  Fix: add persona-related properties to both schemas' agent item definitions, OR remove `additionalProperties: false` from agent items.

### High (should fix before release)

- [x] **P3: spec-parser validates only `required` fields from schema**
  `spec-parser.js:81-157` loads the JSON Schema but ignores `type`, `enum`, `pattern`, `minItems`, `minLength` constraints.
  A spec with `agents: []` or `schema_version: "abc"` passes validation.
  Fix: add validation for `minItems` on agents array, `enum` on composition_pattern, and `type` checks on key fields. Full ajv integration is optional — targeted checks sufficient.

- [x] **P4: naming-enforcer.js referenced in architecture but does not exist**
  Architecture lines 533, 654, 699 reference `lib/naming-enforcer.js` as the canonical naming validation module (FR22).
  `naming-utils.js` exists but only contains `toKebab()` and `deriveWorkflowName()` — no validation.
  Fix: either create `naming-enforcer.js` that wraps the regex validation from spec-parser, or update the architecture reference to document that naming enforcement is in spec-parser.js. Prefer the latter for v1 — avoid creating a module just for indirection.

- [x] **P5: Silent error swallowing in collision-detector**
  `collision-detector.js:100` (`parseManifest`) and `:124` (`listSubmodules`) catch all exceptions and return empty arrays.
  If the manifest file exists but can't be read, collision detection reports "no collisions" — a blocking collision could be missed.
  Fix: return a `{ data, warning }` shape or propagate a non-fatal warning in the `CollisionResult`.

### Medium (fix or defer with rationale)

- [x] **P6: Remove unused `pattern` parameter from `parseSpecFromString`**
  `spec-parser.js:166` — parameter accepted but never used. Misleading to callers.
  Fix: remove the parameter.

- [x] **P7: Document `error` property in `getCascadeForPattern` return type**
  `cascade-logic.js:111` — error path returns `{ decisions: [], eliminated: [], error }` but JSDoc doesn't mention `error`.
  Fix: update JSDoc to include `error?: string` in return type.

- [x] **P8: Remove unused `moduleDir` parameter from `findResumePoint`**
  `spec-differ.js:31` — documented as "filesystem verification" but never used.
  Fix: remove the parameter, or implement the planned filesystem check.

- [x] **P9: Expand `writeSpec` round-trip validation**
  `spec-writer.js:57-60` — only checks `team_name_kebab` survived serialization.
  Fix: also verify `composition_pattern` and `agents.length` at minimum.

- [x] **P10: Fix `diffSpecs` object comparison**
  `spec-differ.js:94-96` — `JSON.stringify` is key-order-dependent for objects.
  Fix: sort keys before stringify, or use a deep-equal comparison for the generate step's per-agent progress.

- [x] **P11: Standardize compass_routing enum values**
  `factory-types.js:53` says `"required", "per-agent", "shared-reference"`.
  `schema-independent.json:100` says `["optional", "per-agent"]`.
  cascade-logic defaults to `"per-agent"`.
  Fix: add `"optional"` to factory-types.js documentation. Align all three sources.

---

## Deferred Findings

- [x] [Defer] Agent ID regex excludes digits — deliberate architectural choice (A6'), revisit if users complain
- [x] [Defer] js-yaml.load() safe schema — js-yaml v4 defaults to safe, not a vulnerability
- [x] [Defer] No path traversal protection on spec paths — internal tool, not exposed to untrusted input
- [x] [Defer] TOCTOU race in updateSpec — single-developer workflow, concurrent writes unrealistic for v1
- [x] [Defer] csv-appender uses naive split(',') — pre-existing code, not in this diff
- [x] [Defer] registry-writer applyInsertions assumes single module.exports — pre-existing code

---

## Acceptance Criteria

- [x] All Critical and High tasks resolved
- [x] All 156 existing tests still pass
- [x] M2 validation (Gyre spec round-trip) still passes
- [x] Medium tasks either resolved or deferred with rationale
