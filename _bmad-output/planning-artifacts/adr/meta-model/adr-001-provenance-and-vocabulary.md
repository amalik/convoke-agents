---
initiative: convoke
artifact_type: adr
qualifier: meta-model-provenance-and-vocabulary
created: '2026-09-05'
status: active
decision_status: proposed
schema_version: 1
related_initiative: 'Meta-model baseline (ratified 2026-08-15)'
related_decision: 'ADR-002 (status axis); ADR-003 (object ontology)'
related_epic: none
supersedes: none
qualifier_role: operator-authored
signoff_by: pending
---

# ADR-001: Provenance Tiers and the Product-Structure Vocabulary

**Status:** **PROPOSED** (2026-09-05) — awaiting sign-off by Amalik
**Initiative:** Meta-model baseline — deliverable 1 of 3 (ratified 2026-08-15)
**Decision owner:** Amalik
**Resolves:** the baseline memo's two named gaps — no provenance axis, and an object vocabulary of ~13 words

---

## Context

Convoke has no model of itself. Five stated problems — over-complicated, inconsistent, stuck, in a hurry,
messy knowledge — were diagnosed on 2026-08-15 as five faces of one absence, and specifically of a missing
*provenance* axis. This ADR is the first of the baseline's three deliverables. The second, the name
registry, shipped 2026-09-05 (`154719e3`); the third is a CI check that reads both.

### 1. The vocabulary is not one axis, and treating it as one makes the cut absurd

Occurrences across `_bmad/bme/` and `_bmad-output/planning-artifacts/`:

| Word | Count | Word | Count | Word | Count |
|------|-------|------|-------|------|-------|
| agent | 4717 | story | 2545 | portfolio | 1369 |
| workflow | 3847 | epic | 2465 | initiative | 1342 |
| artifact | 3708 | team | 1915 | persona | 660 |
| skill | 3266 | contract | 1569 | capability | 659 |
| | | module | 1504 | perimeter | 123 |

The six proposed words — team, agent, skill, workflow, contract, artifact — are all top-tier by usage, so
the proposal already matches practice. But `story`, `epic`, `initiative` and `portfolio` are heavier than
three of the six and are *not* among them. They are not competitors: they name **work**, not **product
structure**, and they are already governed by `backlog-format-spec.md` and by ADR-002 and ADR-003. A cut
stated as "13 words to 6" reads as banning `epic`.

### 2. Three distinct objects share one word

| Directory | Agents | Portfolio ID | A team? |
|---|---|---|---|
| `_vortex` | 7 | `vortex` | yes |
| `_gyre` | 4 | `gyre` | yes |
| `_enhance` | 0 | `enhance` | portfolio, but no agents |
| `_team-factory` | 1 | **`loom`** | yes — name mismatch |
| `_artifacts` | 0 | — | no |
| `_portability` | 0 | — | no |

`_team-factory` is directory `_team-factory`, portfolio `loom`, team "Loom" — three names for one thing,
none matching. `_enhance` is a portfolio with zero agents, so a portfolio is not necessarily a team.
`_artifacts` and `_portability` are directories that install and are neither.

**This is the third instance of a class already ruled on twice.** ADR-002 found one decision made
differently by two consumers; ADR-003 found the same decision made three times across three directory
scopes. Here a distinction is held by a directory name and nothing else. The pattern is a
*convention-held boundary*, and it decays the same way every time.

### 3. `perimeter` is already compliant

12 files carry it: 8 in `planning-artifacts/`, 4 in `docs/`, and **zero in `_bmad/bme/`** — the surface that
produces files. The baseline memo's rule is already true in practice. This ADR ratifies a state; it does
not order a migration.

### 4. The provenance boundary is held by a path and a sentence

`project-context.md:117` states the rule as prose: whether a skill lives under Convoke's `_bmad/bme/`
namespace or upstream BMAD's. Nothing asserts it mechanically. Practice-tier and client-tier have no
representation at all — no field, no directory, no marker.

---

## Decision

**Decided: four provenance tiers, declared rather than inferred; and a six-word product-structure
vocabulary in which module, team and portfolio are three separate objects.**

**D1 — The vocabulary cut is scoped to one axis.** Six product-structure nouns: **team, agent, skill,
workflow, contract, artifact**. Work-lifecycle nouns — `story`, `epic`, `initiative`, `portfolio` — are a
different axis, governed by `backlog-format-spec.md` and ADR-002/003, and are untouched by this ADR.

**D2 — `module`, `team` and `portfolio` are three objects, defined once.**

- A **module** is a directory under `_bmad/bme/` that installs. It may have zero agents.
- A **team** is a named group of agents. Every team lives in a module; not every module is a team.
- A **portfolio** is a taxonomy ID that work attaches to. It may name an unbuilt team.

`module` is therefore retained, not cut. Its 1504 uses were never a vocabulary excess; they were three
objects sharing a word.

**D3 — `perimeter` is vision-only vocabulary, banned from anything that produces files.** Ratified as
already-true. No migration, no cleanup, no story.

**D4 — Four provenance tiers.** `bmad-upstream` · `convoke` · `practice` · `client`.

| Tier | Where it lives | What publishes it | What versions it |
|---|---|---|---|
| `bmad-upstream` | upstream BMAD Method | upstream | upstream releases |
| `convoke` | `_bmad/bme/` in this repo | npm, `convoke-agents` | `package.json` |
| `practice` | a private git repo; some material is copied per engagement | **nothing — there is no publish path** | git only, where a repo is used |
| `client` | the engagement it belongs to | nothing | not versioned |

**D5 — Tier is declared, never inferred.** Declared in `_bmad/bme/_config/name-registry.csv` for teams and
agents (the column exists and is populated as of `154719e3`) and in `module.yaml` for modules. A directory
path is evidence, not a declaration. Deliverable 3's CI check asserts declared tier against reality.

**D6 — The practice tier has no publish path, and the ADR says so.** Recording an honest absence is the
point of the tier axis; implying a pipeline that does not exist is the failure this ADR was written to
prevent.

**D7 — Coupling is a per-asset property, not a per-tier rule.** Some practice assets extend Convoke and
assume it is installed; others stand beside it and share only conventions. An asset declares which it is.
**Because practice content lives outside this repository, that declaration lives there too** — Convoke
implements nothing for it, and this ADR only fixes the vocabulary the declaration uses.

**D8 — Tiers are a lifecycle: movement is allowed, through an explicit gate.** A practice asset that proves
itself may graduate to `convoke`. This is not a hypothetical shape — it is the baseline's own sequence for
Forge (prove the method on engagements, then build the team). Tier and the registry's `status` field are
two axes: `status` says how built a thing is, `tier` says where it may be published.

---

## Consequences

**Positive.** The provenance axis exists for the first time, and it is checkable rather than conventional.
The `module`/`team`/`portfolio` collapse — which cost a full working session on 2026-09-05, where the
operator could not recall the pending teams' names or scopes — has a stated resolution. Deliverable 3 gains
a fourth assertion. Three deliverables, no epic, budget held.

**Negative.** `module.yaml` gains a field, and two of the four tiers describe content this repository cannot
see or verify. D7 states a rule Convoke does not enforce, which is a deliberate limit rather than an
oversight: the alternative was building machinery for assets that live elsewhere.

**Neutral.** No backfill. Consistent with ADR-002 D1 and ADR-003 D5 — metadata exists to serve a consumer,
not to achieve uniformity.

---

## Open questions

**OQ-1 — `submodule` (119 uses) and `pack` (36).** Fold into `module`, or retain? Low usage, cheap either
way, not ruled here.

**OQ-2 — What is the graduation gate, concretely?** D8 rules that movement between tiers exists; its
criteria are unruled. Forge's Gate 1 is the first case that will need them.

**OQ-3 — Does `_team-factory` get renamed to `_loom`?** Under D2 the three names are legitimately allowed to
differ, so the mismatch is no longer an error. Whether it remains *desirable* is a separate call.
