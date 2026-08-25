---
initiative: convoke
artifact_type: adr
qualifier: knowledge-governance-cleanup-scope
created: '2026-08-25'
status: draft
decision_status: proposed
schema_version: 1
related_initiative: Knowledge & Documentation Governance (ID unallocated — see Open Question OQ-0)
related_decision: none
related_epic: none
supersedes: none
qualifier_role: winston-architect
signoff_by: pending
---

# ADR-001: Cleanup Scope — Measure Both Trees, Mutate One

**Status:** Proposed (2026-08-25) — awaiting operator signoff
**Initiative:** Knowledge & Documentation Governance (unallocated)
**Decision owner:** Amalik

---

## Context

A survey on 2026-08-25 established that this project's documentation corpus is not ungoverned — it is governed by ten separate instruments, none of which is wired to another and none of which has run since April 2026.

**Corpus, measured:**

| Tree | Markdown files | Ships? |
|------|----------------|--------|
| `_bmad-output/` | 1,152 | No — absent from `package.json` `files[]` |
| `_bmad/bme/` | 318 (265 non-scaffolding) | **Yes** — six subdirectories in `files[]` |
| `docs/` | 17 | No |
| Repository root | 7 | Partially (5 of 7) |
| **Total in scope of the question** | **~1,470** | |

Excluded as non-corpus: `exported-skills/` (422 files, gitignored build output), `tests/` (fixtures), `node_modules/`, `.review-cache/` (gitignored, though 16 files are tracked — logged separately).

**Governance coverage:** of 972 files in `_bmad-output/` outside `_archive/`, **166** carry a governed `{initiative}-` prefix. The accepted convention
(`adr-artifact-governance-convention-2026-04-10.md`) covers approximately 17% of the corpus it claims.

**The inversion that forces this decision.** The survey's own analysis excluded `_bmad/bme/` on the grounds that it is "framework." It is not — it is the Convoke-owned namespace, and it is the only documentation the project actually ships. The corpus that received all the analytical attention is the corpus operators never see; the corpus that ships was never counted.

A related boundary defect is already known: `files[]` carries `_bmad/bme/_vortex/`, `_enhance/`, `_gyre/`, `_artifacts/`, `_portability/` and `_team-factory/`, but **not** `_bmad/bme/README.md` — the file that sits on top of them and is designated required reading for skill authors. This is I157's class and belongs to the 4.0.1 epic spine ("nothing binds what is in the repo to what an operator gets").

Scope must be settled before any analysis runs, because it determines where the instruments are pointed. It cannot be deferred to a later step.

---

## Decision

**1. Analysis scope is both trees.** The instrumented pass (`reference-integrity.js`, `bmad-portfolio-status`, and the reconcile deltas) runs across `_bmad-output/`, `_bmad/bme/`, `docs/`, and the repository root — approximately 1,470 files. Reading is a machine pass; restricting it saves nothing and reproduces the error this ADR exists to correct.

**2. Mutation scope is `_bmad-output/` only.** Renames, moves, frontmatter injection, archiving and folder restructuring are confined to `_bmad-output/`, `docs/`, and the repository root. Nothing under `_bmad/bme/` is renamed, moved, or restructured by this initiative.

**3. `_bmad/bme/` findings are filed, not fixed here.** Defects the analysis surfaces in the shipped tree are logged against **4.0.1 Epic 3** and the publish-path work that already owns that boundary. They are reported by this initiative and resolved by another.

**4. Out of scope entirely.** `exported-skills/`, `tests/` fixtures, and `node_modules/` are not part of the corpus and are not analysed. `.review-cache/` is out of scope as a corpus, but its tracked-despite-ignored state is logged as a separate defect.

---

## Rationale

`_bmad/bme/` ships. Any rename inside it changes what an operator receives on the next `npm install` — a breaking change to a published surface, which is a release concern governed by the 4.0.1 publish path, not a documentation-hygiene concern. Mixing the two would place a breaking change inside a cleanup, where it would receive neither the rehearsal nor the gating that publish-path changes require.

Conversely, excluding `_bmad/bme/` from *measurement* would produce a report that describes 1,152 files nobody installs while remaining silent about the 318 that everybody does — an authoritative-looking document with a hole in exactly the place that matters most.

Measuring both and mutating one resolves both failure modes at the cost of splitting findings across two backlog homes. That cost is accepted.

---

## Consequences

**Positive**

- The instrumented report describes the full corpus, including the shipped half, on its first run.
- The abort conditions gating this initiative fire against complete data rather than a subset.
- The published surface is untouched by a cleanup, preserving 4.0.1's release discipline.
- Analysis cost is unchanged; only the mutation boundary moves.

**Negative**

- Findings split across two owners. The report will name defects this initiative deliberately does not fix.
- `_bmad/bme/`'s documentation debt persists until Epic 3 or a successor absorbs it.
- A reader of the report must be told which half is actionable here. The report must mark every finding with its mutation eligibility, or it will read as a to-do list that was two-thirds ignored.

**Neutral**

- The `docs/` tree is in the mutation scope despite not shipping, because a shipped `README.md` links into it. Those links are the operator-facing surface, not the files themselves.

---

## Alternatives considered

**A. `_bmad-output/` only, both for analysis and mutation.** Rejected. This is the scope the survey used by accident and had to correct twice in one session. It excludes every file the project ships.

**B. Both trees, mutate both.** Rejected. Renaming shipped paths is a breaking change for installed operators and belongs to the publish-path work with its rehearsal and gating, not to a documentation cleanup.

**C. `_bmad/bme/` only — fix the shipped half first.** Rejected. The ungoverned bulk (806 of 972 non-conforming files) is in `_bmad-output/`, and the instruments that would govern it are the ones under repair. Starting with the shipped half fixes the smaller problem under the tighter constraint.

---

## Open questions

These are deliberately *not* decided here. Each is a separate ADR, to be written before implementation begins.

- **OQ-0 — Initiative ID.** Unallocated. The backlog had uncommitted working-tree edits at the time of writing, and this project's ID-allocation rule forbids allocating against a dirty backlog (four ID collisions, 2026-08-14, tracked as I150). **This ADR's directory, `adr/knowledge-governance/`, must be renamed to the allocated ID once the backlog is clean**, in keeping with the sibling directories `4-0-1/`, `i97/`, `v4-1/`, `v63/`.
- **OQ-1 — Status axis.** One `status` field or three fields. The corpus carries 15 distinct values across three axes (lifecycle, verdict, gate); the shipped enum at `scripts/lib/artifact-utils.js:763` carries four, one of which (`validated`) is a verdict and one of which (`complete`, the corpus's most common value, 25 files) is absent and therefore illegal.
- **OQ-2 — Object ontology.** Whether knowledge products (keyed by subject, having currency) and work receipts (keyed by work item, never stale) remain two models. `scripts/lib/portfolio/portfolio-engine.js:64` already assumes they do.
- **OQ-3 — Where proposals live.** Whether unruled strategy drafts belong in `docs/` or in `planning-artifacts/` under a `draft` status.
- **OQ-4 — What "archived" means.** A state or a place, and whether `_archive/` survives as a directory. Its index currently reports 195 rows against 179 files.

---

## Notes on this document's own metadata

This ADR sets `status: draft` (a legal value in the shipped enum) and carries its decision state in a separate `decision_status: proposed` field, rather than following its sibling ADRs' `status: accepted` — which is not a legal value in that enum.

This is a deliberate, minimal demonstration of OQ-1's likely answer (lifecycle and decision-state are different axes and need different fields), not a unilateral schema change. If OQ-1 rules otherwise, this file is corrected with the rest of the corpus.

---

## Change log

| Date | Change | By |
|------|--------|-----|
| 2026-08-25 | Initial draft. Proposed, unsigned. | Winston (architect role) |
