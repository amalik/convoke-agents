# Story 1.5: Adoption Surface

Status: review

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

- [x] Task 1: Edit repo root `README.md` to add Covenant reference in the first section (AC #1, #2)
- [x] Task 2: Create `_bmad/bme/README.md` as the bme-module landing page with Covenant reference (AC #1, #2)
- [x] Task 3: Edit `project-context.md` to add a `covenant-compliance-for-convoke-skills` rule referencing the Covenant (AC #1, #2, #4)
- [x] Task 4: Verify 3-of-4 discovery-path coverage (AC #3)
- [x] Task 5: Verify each reference includes rationale (AC #4)

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

Claude Opus 4.7 (1M context) — direct execution, no workflow skill (small documentation-surface story).

### Debug Log References

_None._

### Completion Notes List

- **Coverage achieved:** 3/4 discovery paths covered (repo root README, new bme README, project-context.md). The 4th (docs index) does not exist; substitution documented in Dev Notes. Satisfies AC #3.
- **Above-the-fold placement:** All 3 references appear before the first `##` heading on their respective surfaces. README.md: Covenant blockquote at line 20 (first `##` is at line 36). `_bmad/bme/README.md`: Covenant blockquote at line 5 (first `##` is at line 7). `project-context.md`: Covenant blockquote at line 5 (first `##` is at line 9). Satisfies AC #2.
- **Rationale dogfooded:** Every reference explains *why* Covenant compliance matters, not just "read this" — dogfooding the Right to rationale per NFR7. README cites "architectural concern, not a styling concern; skills that violate it erode operator trust across the skill ecosystem". bme README cites "what makes a `_bmad/bme/` skill a *Convoke* skill rather than a generic one". project-context.md pointer cites the same plus links the rule. Satisfies AC #4.
- **project-context.md placement decision:** Added both a top-of-file blockquote (line 5) that meets AC #2's "before first `##`" requirement AND the full `covenant-compliance-for-convoke-skills` rule in its topical position after `namespace-decision-for-new-skills`. The top pointer surfaces the Covenant to anyone landing on the file; the rule in topical position gives full How-to-apply guidance alongside sibling authoring rules.
- **Upstream BMAD namespace carve-out:** The new rule explicitly exempts upstream BMAD contributions (`_bmad/core/`, `_bmad/bmm/`, `_bmad/bmb/`) — Covenant is a Convoke-specific standard, not a BMAD Method requirement. Consistent with `namespace-decision-for-new-skills`.

### File List

**Modified:**
- `README.md` — added Covenant blockquote at line 20 (after intro paragraph, before teams table)
- `project-context.md` — added top-of-file Covenant pointer at line 5 + `covenant-compliance-for-convoke-skills` rule in topical position

**Created:**
- `_bmad/bme/README.md` — new bme-module landing page with Covenant blockquote at line 5 and submodule table
