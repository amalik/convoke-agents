---
initiative: convoke
artifact_type: adr
qualifier: meta-model-provenance-and-vocabulary
created: '2026-09-05'
status: active
decision_status: accepted
accepted: '2026-09-05'
schema_version: 1
related_initiative: 'Meta-model baseline (ratified 2026-08-15)'
related_decision: 'ADR-002 (status axis); ADR-003 (object ontology)'
related_epic: none
supersedes: none
qualifier_role: operator-authored
signoff_by: amalik
---

# ADR-001: Provenance Tiers and the Product-Structure Vocabulary

**Status:** **ACCEPTED** (2026-09-05) — signed off by Amalik
**Proposed:** 2026-09-05
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

**OQ-1 — `submodule` and `pack`.** ✅ **RESOLVED 2026-09-05** (operator: Amalik). See §Amendment 1.

**OQ-2 — What is the graduation gate, concretely?** ✅ **RULED DEFERRED 2026-09-05** (operator: Amalik) —
deferred by method, not by neglect. See §Amendment 1.

**OQ-3 — Does `_team-factory` get renamed to `_loom`?** ✅ **RESOLVED 2026-09-05** (operator: Amalik):
no, and not on D2's grounds. See §Amendment 1.

---

## Amendment 1 — OQ-1, OQ-2 and OQ-3 (2026-09-05)

**Ruled by Amalik the same day the ADR was signed, on measured usage rather than on the word counts that
raised the questions.**

### R1 — `submodule` folds into `module`; `pack` was never a competitor

**`submodule` (119 uses) is not a distinct object.** `scripts/update/lib/agent-registry.js:220` documents
the field as *"submodule: directory under `_bmad/bme/` (e.g., `'_team-factory'`)"* — which is **D2's
definition of `module`, word for word**. It names a *containment relationship*, a module seen as a child
of `bme`, not a second kind of thing.

**It folds in prose only.** `submodule` is a live schema field (`agent-registry.js:231`, read as
`agent.submodule` by `refresh-installation` and `convoke-doctor`). Renaming that identifier is churn
against the install path with no behavioural gain. The ruling is: do not use `submodule` in new
documents, specs or stories; leave the field and its existing call sites alone; run no sweep.

**`pack` (36 uses) is retained, and the count that raised the question was wrong.** Reading the uses
rather than the grep, they are two senses, neither an object word competing with the six: `npm pack` —
a verb — and "skill pack", a *distribution unit*, a thing you install rather than a thing inside the
product. **A correction applied while writing this amendment:** the 36 was produced by substring
matching and is substantially a false positive of the measurement, not evidence of vocabulary excess.
No cut, no ratification needed.

### R2 — The graduation gate is deferred by method

D8 rules that movement between tiers happens through an explicit gate. **What that gate contains is
deliberately not ruled here, and the reason is the method rather than the budget.**

A gate already exists for the first case. Forge's Gate 1
([`forge-decision-hc6-framework-2026-03-21.md:66`](../../../vortex-artifacts/forge-decision-hc6-framework-2026-03-21.md))
carries a stated purpose, three primary metrics with targets, guardrail metrics, and a pre-registered
decision matrix (Full Persevere / Partial Persevere / Patch / Pivot). It is better specified than a
general rule written today could be.

**Ruling a general gate now would mean designing for a case that has not run.** ADR-002 and ADR-003 are
both strong because they measured first and ruled second; this is the one place in the baseline where a
ruling would have to guess instead. So: **the first instance produces the rule, not the reverse.** Run
Forge's Gate 1, then record the template it produced as a further amendment.

This converts OQ-2 from a loose end into a stated method. It remains answerable, and it is not blocking:
nothing in D1–D8 or in the baseline's third deliverable depends on it.

### R3 — `_team-factory` is not renamed, and D2 is not the reason

Under D2 the mismatch — directory `_team-factory`, portfolio `loom`, team "Loom" — is no longer an
error, since the three are separate objects and may legitimately differ. **That permits the rename; it
does not motivate it.** The reason not to rename is different and stronger:

**`loom` has two live definitions and the collision is unresolved.** `taxonomy.yaml` and §1.4 define it
as "Orchestration / Team Factory" (built, one agent); the ecosystem roster defines Loom as a *proposed*
four-agent human-agent orchestration team. `_bmad/bme/_config/name-registry.csv` records this as
requiring an operator ruling and it has not been given.

**Renaming a directory to a contested name makes the collision harder to undo**, and I159's evidence is
direct: renaming an installed surface is breaking for existing operators and needs a deprecation window,
not a `git mv`. `_team-factory` is meanwhile accurate for what is there — one agent that builds teams.

**Ruling: keep `_team-factory`. Rule what Loom is first;** the directory name is downstream of that
question and costs nothing to defer.

---

## Change log

| Date | Change | By |
|------|--------|-----|
| 2026-09-05 | Initial draft. Context measured; D1–D8 are the operator's rulings, taken as eight answered questions rather than drafted for review. `decision_status: proposed`. | Claude (write-up) |
| 2026-09-05 | **Accepted by Amalik.** D6 and D7 confirmed explicitly after a full read — D6's practice row was the one cell filled from an ambiguous answer, D7 states a rule Convoke deliberately does not enforce. `decision_status` `proposed` → `accepted`. OQ-1/2/3 open at signing. | Amalik |
| 2026-09-05 | **Amendment 1 — OQ-1, OQ-2, OQ-3.** `submodule` folds into `module` in prose only, schema field untouched; `pack` retained, its count corrected as a substring false positive. The graduation gate is deferred by method — the first instance produces the rule. `_team-factory` is not renamed, because `loom` is contested rather than because D2 permits the mismatch. D1–D8 unchanged. | Amalik |
