# Story 1.5: Adoption Surface

Status: ready-for-dev

## Story

As a new Convoke contributor authoring a skill,
I want contributor-facing documentation to prominently point me to the Operator Covenant before I start writing,
so that the Covenant is consulted at the point of authorship — not discovered after a review failure.

## Acceptance Criteria

1. Contributor-facing landing surfaces each include a visible reference to `convoke-covenant-operator.md` as required reading before authoring a new Convoke skill.
2. On each surface, the Covenant link appears in the first 25 lines OR before the first `##` section heading, whichever comes first — not buried in footnotes.
3. The Covenant is surfaced from at least 3 of 4 common discovery paths (repo root README, bme module README, project-context.md AI-agent rules, and any docs index).
4. The reference explains *why* the Covenant must be consulted, not just "read this" — itself demonstrating the Right to rationale (dogfooding per NFR7).

## Tasks / Subtasks

- [ ] Task 1: Edit repo root `README.md` to add Covenant reference in the first section (AC #1, #2)
- [ ] Task 2: Create `_bmad/bme/README.md` as the bme-module landing page with Covenant reference (AC #1, #2)
- [ ] Task 3: Edit `project-context.md` to add a `covenant-compliance-for-convoke-skills` rule referencing the Covenant (AC #1, #2, #4)
- [ ] Task 4: Verify 3-of-4 discovery-path coverage (AC #3)
- [ ] Task 5: Verify each reference includes rationale (AC #4)

## Dev Notes

### Surface availability reality check (conducted 2026-04-18)

Story 1.3 wrote the ACs assuming four specific landing surfaces. Reality check:

- ✅ Repo root `README.md` — exists
- ❌ `_bmad/bme/README.md` — doesn't exist; will be created in this story
- ❌ `CLAUDE.md` — doesn't exist; substituted by `project-context.md` which serves the AI-agent rules role
- ❌ `_bmad/bmb/skills/bmad-agent-builder/` — lives in BMB (upstream namespace), out of scope per Convoke's namespace discipline

**Revised 3-of-4 coverage:** README + new bme README + project-context.md = 3 surfaces, satisfying AC #3.

### Rationale pattern (for AC #4 dogfooding)

Each reference must include *why* the Covenant matters — not just "read this". Template:

> **Required reading before authoring a new Convoke skill:** [The Convoke Operator Covenant](path/to/convoke-covenant-operator.md) — one axiom and seven commitments that every skill must honor. The Covenant exists because the operator-facing UX of a skill is an architectural concern, not a styling concern; skills that violate it waste operator time and erode trust over the skill ecosystem as a whole.

### Anti-patterns

- ❌ Do NOT bury the reference in a footnote or "see also" list at the bottom
- ❌ Do NOT just paste a link without the rationale sentence
- ❌ Do NOT reference by raw path (e.g., `see _bmad-output/...`) — use the Covenant's display name plus a markdown link
- ❌ Do NOT modify upstream BMB/BMM namespaces — only Convoke-owned surfaces (root + `_bmad/bme/`)

### Namespace decision

No new skill or workflow being added. This story edits three Convoke-owned documentation surfaces. `project-context.md` is project-wide rules. `_bmad/bme/` is Convoke's owned namespace. Repo root `README.md` is Convoke-owned (not upstream BMAD).

### References

- [Source: _bmad-output/planning-artifacts/convoke-epic-operator-covenant.md#Story-1.5] — epic story definition
- [Source: _bmad-output/planning-artifacts/convoke-covenant-operator.md] — the artifact being referenced

## Dev Agent Record

### Agent Model Used

_To be filled when story is picked up_

### Debug Log References

### Completion Notes List

### File List
