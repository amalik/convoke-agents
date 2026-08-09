---
stepsCompleted:
  - step-01-document-discovery
  - step-02-prd-analysis
  - step-03-epic-coverage-validation
  - step-04-ux-alignment
  - step-05-epic-quality-review
  - step-06-final-assessment
initiative: convoke
artifact_type: report
qualifier: implementation-readiness-bmad-v6.4-v6.8-absorption-2026-08-09
related_initiative: I113
related_prd: convoke-prd-bmad-v6.4-v6.8-absorption.md
related_arch: convoke-arch-bmad-v6.4-v6.8-absorption.md
related_epics: convoke-epic-bmad-v6.4-v6.8-absorption.md
absorption_window: 'v6.4–v6.10'
assessed: '2026-08-09'
status: complete
verdict: NEEDS WORK (pre-sprint, not pre-planning)
remediation: 'C1, C2, m1 applied 2026-08-09 post-assessment and re-verified; M1, M2 remain open (operator decisions); M3, m2, m3 deferred to story-creation'
schema_version: 1
naming_note: 'Qualifier intentionally matches the sibling v6.4-v6.8 artifacts so the chain stays greppable as a set. The window is v6.4–v6.10; `absorption_window` is authoritative. Add this file to I121 rename scope (4 files, not 3).'
---

# Implementation Readiness Assessment Report

**Date:** 2026-08-09
**Project:** Convoke v4.1 (Upstream BMAD v6.4–v6.10 Absorption)
**Assessor:** Winston (System Architect)
**Trigger:** Post-amendment alignment check after the 2026-08-09 absorption-window re-baseline (v6.8 → v6.10)

---

## Step 1: Document Discovery

### Assessment Scope

This is a **scoped** readiness assessment. `{planning_artifacts}` holds parallel planning chains for several initiatives (I97 v6.3 source-format adoption, artifact-governance/portfolio, initiative-lifecycle-engine, gyre, loom, enhance, vortex). Only the **I113 / Convoke v4.1** chain is under assessment.

### Documents Selected for Assessment

| Type | File | Size | Modified | Status |
|------|------|------|----------|--------|
| PRD | [`convoke-prd-bmad-v6.4-v6.8-absorption.md`](convoke-prd-bmad-v6.4-v6.8-absorption.md) | 44,942 b | 2026-08-09 09:50 | ✅ Selected (amended today) |
| Architecture | [`convoke-arch-bmad-v6.4-v6.8-absorption.md`](convoke-arch-bmad-v6.4-v6.8-absorption.md) | 31,128 b | 2026-08-09 09:51 | ✅ Selected (amended today) |
| Epics & Stories | [`convoke-epic-bmad-v6.4-v6.8-absorption.md`](convoke-epic-bmad-v6.4-v6.8-absorption.md) | 29,150 b | 2026-08-09 09:53 | ✅ Selected (amended today) |
| UX Design | — | — | — | ⬜ **N/A by declaration** (see below) |

**Supporting inputs (not under assessment, referenced during traceability):**

- [`adr/v4-1/adr-001-guardrails-covenant-enforcement.md`](adr/v4-1/adr-001-guardrails-covenant-enforcement.md) — E7 substrate, consumed by AD4
- [`convoke-note-v6-3-resequencing-and-v4-1-catchup-2026-05-25.md`](convoke-note-v6-3-resequencing-and-v4-1-catchup-2026-05-25.md) — Option F decision (D16)
- [`convoke-note-initiative-lifecycle-backlog.md`](convoke-note-initiative-lifecycle-backlog.md) — I113 row, OQ-1, new I115–I121
- [`project-context.md`](../../project-context.md) — 18 governing engineering rules (loaded as persistent facts)

### Sharded-vs-Whole Duplicate Check

**No duplicates in the assessed chain.** All three artifacts exist as whole documents only; no `convoke-{prd,arch,epic}-bmad-v6.4-v6.8-absorption/` folders exist.

One sharded PRD folder is present in the directory — `convoke-prd-bmad-v6.3-adoption/` — but it belongs to a **different initiative** (the v6.3 adoption / Convoke 4.0 chain) and is correctly paired with its own archived whole-document version under `archive/`. It is **not** a duplicate of the v4.1 PRD. No resolution required.

### UX Document — N/A Rationale

No UX artifact exists and none is required. The PRD declares this explicitly under *UX Design Requirements*: **"None — no UI; Convoke is content + CLI/slash-command tooling."** The operator-facing surface is delivered through slash-command skills governed by the `slash-command-ux-for-user-facing-tools` rule and the Operator Covenant (E7), not through a UI specification.

`epic-skill-portability-ux.md` matched the UX glob but belongs to the skill-portability epic (a separate, completed chain) and is **out of scope**.

### Issues Found

| # | Severity | Issue |
|---|----------|-------|
| D1 | ℹ️ INFO | All three artifacts were modified today (2026-08-09) by the window re-baseline. This assessment is validating **fresh amendments**, which is the intended trigger — but it means no independent review has yet passed over the amended text. |
| D2 | ℹ️ INFO | Filenames carry the stale `v6.4-v6.8` qualifier while the window is v6.4–v6.10. Deliberate operator decision (avoid dangling cross-refs under the repo's single-file auto-commit pattern); `absorption_window` frontmatter is authoritative; governed rename tracked as **I121**. Not a readiness blocker — flagged so the assessment is not read as endorsing the filename. |

**No CRITICAL or WARNING issues at Step 1.** All required documents located; no duplicates; the one missing document type is declared N/A with rationale.

---

## Step 2: PRD Analysis

**Source:** [`convoke-prd-bmad-v6.4-v6.8-absorption.md`](convoke-prd-bmad-v6.4-v6.8-absorption.md) — whole document, 384 lines, read in full. No sharded companion.

### Functional Requirements

Extracted from `## Functional Requirements` (the PRD's canonical capability contract). The PRD notes identifiers are stable and non-contiguous numbering within groups reflects FRs added during review.

**Currency Management (E4)**

- **FR1:** An operator can pin Convoke to a chosen BMAD compat-floor.
- **FR2:** An operator can opt into a newer upstream channel independently of their pinned floor.
- **FR3:** An operator can select a default channel that Convoke tracks automatically *(set-and-forget)*.
- **FR4:** An operator can view which channel and floor they are currently on.
- **FR5:** An operator can perform channel/floor operations through Convoke's conversational skill surface.
- **FR25:** The system validates a chosen channel/floor combination and warns or refuses on an incompatible selection.

**Upstream Absorption & Cadence (E4 + N-cadence policy)**

- **FR6:** The system can classify an upstream update as declaration-only, conformance-required, or breaking (the absorption ternary; supersedes the original compat-only-vs-breaking binary).
- **FR7:** An operator can absorb a compat-only upstream update with no Convoke code change.
- **FR8:** The system applies a defined breaking-change protocol when an upstream change is breaking.
- **FR9:** Convoke publishes a binding N-cadence policy declaring its maximum compat-floor lag.
- **FR10:** The maintainer can record the v4.1 absorption effort as a reusable baseline for future cadence comparison.
- **FR24:** The system surfaces a warning when Convoke's compat-floor lag exceeds the N-cadence policy cap.

**Schema Conformance & Migration (E2)**

- **FR11:** The system migrates Convoke modules' module-help schema to the v6.7 field convention (`after`/`before` → `preceded-by`/`followed-by`).
- **FR12:** An operator's installed Convoke is migrated to the new schema on update without manual edits.
- **FR13:** When a migration cannot apply cleanly, the operator receives a next-action message, not a bare error *(OC-R6)*.
- **FR14:** The system verifies behavioral parity across agents after a schema or channel change.

**Operator Covenant Enforcement (E7)**

- **FR15:** A Convoke skill halts and waits for the operator at every OC-R5 decision point.
- **FR16:** A Convoke skill's agent self-confirms each activation step executed before beginning the main workflow.
- **FR17:** The system enumerates all `_bmad/bme/` pause-point skills mechanically to define enforcement coverage.
- **FR18:** The Covenant compliance audit can be re-run with the baseline method to confirm ≥ 82% (no regression).
- **FR26:** The system flags a `_bmad/bme/` skill that lacks OC-R5 self-confirm enforcement *(authoring-time durability check)*.

**Marketplace Distribution & Discoverability (E1 — Phase 2)**

- **FR19:** Convoke is structured per the marketplace structural contract (`skills/` at root + `module.yaml` + `module-help.csv`).
- **FR20:** Convoke declares a `plugin_name` distinct from its internal module code.
- **FR21:** An operator can install Convoke via a documented BYO-URL path when a marketplace listing is unavailable.
- **FR22:** A standalone operator can submit a demand signal/request through a documented, low-friction path reachable outside the dev loop.

**Re-engagement & Recovery (E4 migration)**

- **FR23:** A lapsed or forked operator can re-enter on a pinned floor via a documented migration path.

**Total FRs in the PRD: 26** (FR1–FR26, mechanically enumerated from `## Functional Requirements`; no gaps, no FR11b — see PRD Completeness Assessment).

### Non-Functional Requirements

The PRD declares selectivity up front: *"Scalability and Accessibility are N/A (not a hosted service; CLI/content tool, no UI) and intentionally omitted."*

- **NFR1 (Parity):** 0 operator-facing regressions across the 5 classes, verified by the PF1-style battery covering all in-scope agents (enumerated from source) (MO7).
- **NFR2 (Compat-floor):** Convoke declares and honors a ≤ N-3 compat-floor (binding policy); v6.3+ source format must not regress.
- **NFR3 (Marketplace structural):** the repo satisfies the structural contract mechanically AND BYO-URL install is verified end-to-end. External installer acceptance is an MO5 outcome, not a testable NFR.
- **NFR4 (Recoverable migrations):** idempotent with a verified recovery path; re-running a half-failed migration converges; never leaves a partially-written install. *(Honest: not "atomic" — `fs` isn't transactional.)*
- **NFR5 (Soft-warn preflight):** stderr WARNINGs, exit 0, never block install/update.
- **NFR6 (Blast-radius):** E2/E4 ship migrations + parity; additive changes don't mutate existing installs.
- **NFR7 (Path-safety):** user-path operations resolve + normalize + contains-check against the project root and refuse paths outside it.
- **NFR8 (No hardcoded versions/secrets):** versions via `getPackageVersion()`; no credentials in source; dependency hygiene.
- **NFR9 (Allowlist input validation):** channel/pin/CSV inputs validated against an allowlist pattern (semver/tag charset) — not merely "sanitized"; no arbitrary code or ref execution; CSV-injection prefix applied.
- **NFR10 (Currency cost, class-dependent):** Class A absorbs with 0 changes to Convoke source/logic (manifest/lockfile version bumps excluded); Class B absorbs with bounded, mechanical, migration-assisted content edits; Class C invokes the breaking-change protocol (MO2). v4.1 effort captured as a baseline in a defined unit (maintainer-hours + files-touched + story-count) (MO2b).
- **NFR11 (Covenant floor):** compliance ≥ 82% (baseline method); new `_bmad/bme/` skills pass the covenant-compliance checklist = no FAIL cells (N/A allowed with rationale) (FR26).
- **NFR12 (Cadence observability):** reports current floor, declared cap, actual lag, last-absorption timestamp — inspectable and logged. *"A policy you can't observe isn't binding."*
- **NFR13 (Performance):** operator-facing ops carry indicative budgets (reported, not gated); CI parity battery + audit within a declared CI time ceiling (hard gate); no operation regresses > 2× against baseline (hard gate).
- **NFR14 (Engineering discipline):** counts derive from source; migration files carry delta logic only; libs accept `projectRoot` (no `process.cwd`); every story ships lint-clean; verification commands honor pipefail; a namespace decision is recorded.

**Total NFRs: 14** (NFR1–NFR14, contiguous).

### Additional Requirements & Constraints

**Ecosystem-conformance constraints** *(the domain's analog of compliance)* — marketplace structural contract; module-help schema conformance (with the 2026-08-09 mechanical verification note and the `_team-factory` third-schema finding); v6.3+ source format must not regress; Operator Covenant ≥ 82%.

**Integration constraints** — parallel-install model (Convoke installs side-by-side with BMAD, **not** as a dependency; `node_modules/bmad-method` absent in the canonical dev tree); cross-platform export targets (`.agents/skills/` standard v6.5 + Web Bundles) are surfaces Convoke *conforms to*, not owns.

**Architecture-derived constraints** — AD1–AD9, the implementation sequence, schema/naming locks, and the reuse list. Carried in the epics' Requirements Inventory under *Additional Requirements*.

**Governing engineering rules** — all 18 rules in [`project-context.md`](../../project-context.md) apply and are explicitly not restated in the architecture.

**Scope exclusions (explicit)** — E1 (Phase 2), E3/E5/E6 (Phase 3 / v4.2). UX requirements: **None**, declared.

### PRD Completeness Assessment

**Structurally complete and unusually rigorous.** Every FR traces to a journey or Measurable Outcome; the NFR set declares its own selectivity rather than silently omitting categories; MO1–MO8 each carry a metric and a "measurable when"; and the 2026-08-09 delta classification is evidence-based (source-tree verification) rather than release-note-driven, with its own honesty caveat about n=1.

Three observations carried into Step 3:

- **P1 — `FR11b` is referenced by the epics but is not defined in the PRD.** The PRD's canonical `## Functional Requirements` section enumerates exactly FR1–FR26 with no FR11b. The epics file references FR11b in 5 places (Requirements Inventory, FR Coverage Map, Epic 2 header, Story 2.4 AC). The architecture does not mention it. **This is a downstream-invented requirement** — an epic asserting a capability contract the PRD never granted. Introduced by the 2026-08-09 amendment. Formally assessed in Step 3.
- **P2 — FR count is stated inconsistently across the chain.** PRD (source of truth): 26. Epics: "All 27 FRs mapped." Backlog I113 Artifacts cell: "26 FR / 14 NFR". Downstream of P1; resolving P1 resolves this.
- **P3 — The `_team-factory` non-conformant schema finding is recorded in the PRD's *Ecosystem-Conformance Constraints* and *Technical Architecture Considerations* prose, but produced no PRD-level FR.** The capability is described where the domain constraints live, not where the capability contract lives. This is the mechanism behind P1: the epics correctly recognized the finding needed an FR, and minted one locally instead of the PRD granting it.

**NFR set: no gaps found.** NFR1–NFR14 contiguous, each with a stated verification approach. The amendment added no NFRs and none were invalidated — NFR2's rationale was *strengthened* by the re-baseline (documented inline in Success Criteria).

---

## Step 3: Epic Coverage Validation

**Source:** [`convoke-epic-bmad-v6.4-v6.8-absorption.md`](convoke-epic-bmad-v6.4-v6.8-absorption.md) — whole document, read in full.

**Method.** Coverage was extracted **mechanically** (per-story AWK scan for `FR\d+b?` tokens across every `### Story` block) rather than by reading the epics' own *FR Coverage Map*. This matters: the Coverage Map is a *claim*, and validating a claim against itself proves nothing. Per the `mechanical-research-enumeration` rule, the raw per-story scan is the evidence of completeness; the Coverage Map is then checked against it.

### Coverage Matrix

| FR | PRD requirement (abbrev.) | Epic coverage | Status |
|----|---------------------------|---------------|--------|
| FR1 | Pin a chosen BMAD compat-floor | Epic 1 · Story 1.3 | ✓ Covered |
| FR2 | Opt into a newer channel independent of floor | Epic 1 · Story 1.3 | ✓ Covered |
| FR3 | Select a default channel (set-and-forget) | Epic 1 · Story 1.3 | ✓ Covered |
| FR4 | View current channel and floor | Epic 1 · Story 1.5 | ✓ Covered |
| FR5 | Channel/floor ops via conversational skill surface | Epic 1 · Story 1.10 | ✓ Covered |
| FR6 | Classify an update into the absorption ternary | Epic 1 · Story 1.6 | ✓ Covered |
| FR7 | Absorb a compat-only update with no code change | Epic 1 · Story 1.7 | ✓ Covered |
| FR8 | Apply the breaking-change protocol | Epic 1 · Story 1.8 | ✓ Covered |
| FR9 | Publish a binding N-cadence policy | Epic 1 · Story 1.4 | ✓ Covered |
| FR10 | Record v4.1 absorption effort as reusable baseline | Epic 1 · Story 1.7 | ✓ Covered |
| FR11 | Migrate module-help schema to v6.7 convention | Epic 2 · Story 2.1 | ✓ Covered |
| **FR11b** | *(not defined in PRD)* — convert non-conformant column set | Epic 2 · Story 2.4 | ⚠️ **In epics, not in PRD** |
| FR12 | Migrated on update without manual edits | Epic 2 · Story 2.1 | ✓ Covered |
| FR13 | Next-action message on migration failure (OC-R6) | Epic 2 · Stories 2.2, 2.4 | ✓ Covered |
| FR14 | Verify behavioral parity after schema/channel change | Epic 2 · Story 2.3 | ✓ Covered |
| FR15 | Halt and wait at every OC-R5 decision point | Epic 3 · Story 3.2 | ✓ Covered |
| FR16 | Agent self-confirms each activation step | Epic 3 · Story 3.2 | ✓ Covered |
| FR17 | Mechanically enumerate pause-point skills | Epic 3 · Story 3.1 | ✓ Covered |
| FR18 | Re-run Covenant audit at ≥ 82%, baseline method | Epic 3 · Story 3.4 | ✓ Covered |
| FR19 | Marketplace structural contract | Epic 4 · Story 4.1 | ✓ Covered |
| FR20 | Declare `plugin_name` distinct from module code | Epic 4 · Story 4.1 | ✓ Covered |
| FR21 | Documented BYO-URL install path | Epic 4 · Story 4.2 | ✓ Covered |
| FR22 | Low-friction demand-signal path | Epic 4 · Story 4.3 | ✓ Covered |
| FR23 | Lapsed/forked operator re-entry on a pinned floor | Epic 1 · Story 1.9 | ✓ Covered |
| FR24 | Warn when compat-floor lag exceeds the policy cap | Epic 1 · Story 1.4 | ✓ Covered |
| FR25 | Validate channel/floor combo; warn or refuse | Epic 1 · Story 1.3 | ✓ Covered |
| FR26 | Flag a skill lacking OC-R5 self-confirm enforcement | Epic 3 · Story 3.3 | ✓ Covered |

**Epic-level declarations reconcile exactly with the per-story scan.** Each epic's `**FRs covered:**` line matches the union of its stories' citations — no epic over-claims, none under-claims.

### Missing Requirements

**None.** Every FR in the PRD (FR1–FR26) has at least one story with an explicit acceptance criterion citing it. There are **no uncovered PRD requirements** and therefore no Critical or High-Priority missing-FR entries.

### Requirements in Epics but Not in PRD

This is the inverse-direction check the coverage step mandates, and it is where the chain breaks.

**⚠️ FINDING C1 — `FR11b` is an epic-invented requirement (severity: WARNING, not CRITICAL).**

- **What.** `FR11b` ("convert Convoke module-help files on a non-conformant column set to the canonical 13-column header") is defined in the epics' Requirements Inventory, cited in the FR Coverage Map, declared in Epic 2's `FRs covered`, and asserted in Story 2.4's acceptance criteria — **5 references**. It appears **nowhere** in the PRD and **nowhere** in the architecture.
- **Why it happened.** The 2026-08-09 amendment recorded the `_team-factory` non-conformant-schema discovery in the PRD's *Ecosystem-Conformance Constraints* and *Technical Architecture Considerations* — prose sections describing domain constraints and per-epic technical shape. It never reached `## Functional Requirements`, the PRD's canonical capability contract. The epics correctly recognised that the work needed an FR to trace to, and **minted one locally** instead of the PRD granting it.
- **Why WARNING and not CRITICAL.** The underlying *capability* is genuinely documented in the PRD (twice, with the verified evidence), the work is real and correctly scoped, and Story 2.4 is well-formed with sound acceptance criteria. This is a **traceability defect, not a scope defect** — nothing is being built that the PRD didn't intend. But direction-of-authority matters: epics derive from the PRD, and an epic that grants itself a requirement inverts that. Left unfixed it degrades the PRD's standing as source of truth, and any future FR audit reconciling PRD↔epics will re-discover it.
- **Recommendation.** Add `FR11b` to the PRD's `### Schema Conformance & Migration *(E2)*` group, immediately after FR11, using the epics' existing wording. **One-line fix.** No epic change required — the epics are already correct; the PRD is what's incomplete.
- **Downstream corrections once applied:** PRD FR total 26 → **27**; backlog I113 Artifacts cell `26 FR / 14 NFR` → `27 FR / 14 NFR` (the epics' "All 27 FRs mapped" and the `21 stories` claim are already correct and need no change).

### Stories With No FR Trace (observation, not a gap)

Two Epic 1 stories cite no FR: **Story 1.1** (cadence state with advisory-locked writes) and **Story 1.2** (migration-safety contract — the shared story Epic 2 depends on). Both are **architecture-derived**, tracing to AD1/AD8 and AD3 respectively rather than to a functional requirement, and both are listed under the epics' *Additional Requirements* section sourced from the architecture.

This is **legitimate and expected** for a brownfield initiative whose first stories build enabling substrate. Flagged only so the 100% FR coverage figure is read correctly: it means every FR has a story, **not** that every story has an FR.

### Coverage Statistics

| Metric | Value |
|--------|-------|
| Total PRD FRs | **26** |
| PRD FRs covered in epics | **26** |
| **FR coverage** | **100%** |
| FRs in epics but not in PRD | **1** (FR11b — Finding C1) |
| Total stories | **21** (E1: 10, E2: 4, E3: 4, E4: 3 — derived by count, matches frontmatter) |
| Stories with explicit FR trace | 19 |
| Stories tracing to architecture only | 2 (Stories 1.1, 1.2 — legitimate) |
| Epic-declaration vs per-story scan | **Reconciles exactly** — no over- or under-claiming |

---

## Step 4: UX Alignment Assessment

### UX Document Status

**Not found — and correctly so.** The step's standing caution is *"don't assume UX is not needed,"* so the declaration was tested rather than accepted.

**Test 1 — is a UI implied anywhere in the chain?** Mechanical scan of all three artifacts for UI-implying vocabulary (`web app`, `mobile`, `browser`, `GUI`, `frontend`, `screen`, `button`, `dashboard`, `responsive`, `wireframe`, `figma`, `component library`, `accessibility`, `WCAG`):

| Artifact | UI-implying hits |
|---|---|
| PRD | **1** — the word "Accessibility", appearing only inside the PRD's own explicit N/A declaration |
| Architecture | **0** |
| Epics | **0** |

No UI is implied anywhere. The N/A declaration is honest, not an omission.

**Test 2 — is there an operator-facing surface that needs experience design regardless?** Yes — 68 references across the chain to `slash-command` / `conversational` / `operator-facing` / `OC-R*` (PRD 20, Arch 23, Epics 25). Convoke has a substantial human-interaction surface; it simply isn't graphical.

### The Real Finding: Convoke's UX Spec Exists Under Another Name

A naive readiness check would score this chain "missing UX documentation." That would be wrong, and the reason is worth recording.

Convoke's operator-experience specification is **[The Convoke Operator Covenant](convoke-covenant-operator.md)** (17 KB — one axiom, *"the operator is the resolver"*, plus seven Operator Rights) and its **[Compliance Checklist](convoke-spec-covenant-compliance-checklist.md)** (101 KB). Together they specify how every Convoke skill must behave toward the human at defaults, pauses, rationale, errors, and pacing — which is precisely what a UX specification does for a graphical product.

It is arguably a **stronger** artifact than a conventional UX deck, because it is **auditable and measurable**: NFR11 sets a floor (≥ 82%, baseline method), MO3 measures OC-R5 enforcement coverage, MO4 guards against regression, and the 2026-04-18 baseline audit scored 10 violations across 56 cells. A wireframe deck cannot be re-run as a gate; this can.

**Epic 3 (E7) is therefore best understood as the UX-implementation epic** — its entire content is graduating the operator-experience spec from authorial convention to runtime enforcement.

### Alignment Issues

**UX ↔ PRD:** Aligned. Journey 3 ("The Covenant moment") is a pure operator-experience journey; FR15–FR18 and FR26 are operator-experience requirements; NFR11 is the operator-experience quality floor. Nothing in the Covenant's seven Rights is contradicted by the PRD.

**UX ↔ Architecture:** Aligned. AD4 (Covenant enforcement, consuming ADR-001) and AD7 (slash-command surface, "Covenant-compliant: defaults, pause, rationale") carry the experience concerns into architecture. AD6's soft-warn choice (NFR5: warn, never block) is itself an operator-experience decision consistent with the Covenant's pacing Right.

**One inconsistency worth noting, already correctly handled:** upstream's v6.8 activation guardrails could have been adopted verbatim as an operator-facing gate, which ADR-001 records would have **self-violated OC-R7 (pacing)**. The spike (resolved 2026-06-21) caught this and scoped E7 as a Convoke-authored extension rather than a drop-in. That is the UX standard being applied to Convoke's own adoption decisions — exactly the behaviour the Covenant is meant to produce.

### Warnings

**⚠️ FINDING C2 — The normative operator-experience artifacts are neither declared as inputs nor cited by path (severity: WARNING).**

- **What.** `convoke-covenant-operator.md` and `convoke-spec-covenant-compliance-checklist.md` appear in **zero** `inputDocuments` lists and are referenced by path **zero** times across PRD, Architecture, and Epics. Verified mechanically.
- **What depends on them.** FR15, FR16, FR17, FR18, FR26 (all of E7 — the declared MVP differentiator); NFR11's "≥ 82%, baseline method"; MO3 and MO4. The number 82% originates in the Covenant baseline audit, and the chain quotes it without pointing at its source.
- **Why it bites at implementation, not now.** `project-context.md`'s `covenant-compliance-for-convoke-skills` rule **requires** an author to read the Covenant before touching `_bmad/bme/` skills and to self-check against the Checklist before marking a story ready-for-review. Epic 3 retrofits `_bmad/bme/` skills across the board. A dev agent picking up Story 3.2 from the epics alone has no path to the normative text it must comply with — it would have to already know the rule exists.
- **Severity rationale.** WARNING, not CRITICAL: the artifacts exist, are stable, are discoverable from `project-context.md`, and the concepts are used correctly throughout. This is a broken pointer, not a missing decision.
- **Recommendation.** Add both paths to `inputDocuments` in the PRD and Architecture frontmatter, and cite the Covenant by path at first use of "OC-R5" in Epic 3. Per the `covenant-compliance-for-convoke-skills` rule's own wording, cite with a sentence of rationale — *"See the Covenant" with no rationale violates OC-R3*, the very Right the Covenant encodes.

**No warning issued for missing UX documentation.** The requirement is genuinely N/A, the declaration is honest, and the operator-experience concern it would otherwise cover is addressed by a more rigorous artifact.

---

## Step 5: Epic Quality Review

Validated against `create-epics-and-stories` standards: user value, epic independence, forward dependencies, story sizing, acceptance-criteria quality.

### Epic Structure — User Value Focus

| Epic | Framing | Verdict |
|---|---|---|
| Epic 1 · Managed Currency & the Cadence Floor | *"Operators gain control over their BMAD currency: pin a floor, choose a channel, see cadence state, re-enter from an ancient pin."* | ✅ User-centric |
| Epic 2 · Schema Conformance Absorption | *"Operators' installs stay conformant — migrated cleanly, with parity verification and Covenant-compliant failure messaging."* | ✅ User outcome (not "run a migration script") |
| Epic 3 · Enforced Operator Covenant | *"Operators never silently lose a decision."* | ✅ Exemplary |
| Epic 4 · Marketplace Discoverability | *"Operators discover and install Convoke via the marketplace or the verified BYO-URL floor."* | ✅ User-centric |

**No technical-milestone epics.** Every epic names a user and an outcome. Epic 2 was the one at risk — "schema conformance" is inherently infrastructural — and it is correctly framed as *your install keeps working* rather than *rename two CSV columns*.

### Epic Independence

| Test | Result |
|---|---|
| Epic 1 stands alone | ✅ |
| Epic 2 needs only Epic 1 output | ✅ — declares Epic 1's Story 1.2 (AD3 migration-safety), backward |
| Epic 3 needs only Epics 1–2 output | ✅ within the chain (external blocker below) |
| Epic 4 needs no forward work | ✅ Phase-2, does not gate MVP |
| **Epic N requires Epic N+1** | ✅ **None found** |

### Forward-Dependency Scan (story level)

**None found.** Every intra-epic reference points backward: Story 1.3 bootstraps the CLI that 1.4–1.8 extend; Story 1.10 explicitly consumes *"the CLI built across 1.3–1.8"*; Story 1.2 is marked SHARED and consumed by a later epic. Story 2.4 declares Epic 1's Story 1.2, backward.

**Resource-creation timing is correct** (the brownfield analog of the database-table check): `cadence.yaml` is created by Story 1.1, which is the first story that needs it; the absorption log is created by Story 1.7, the first story that writes a record. Nothing is provisioned upfront "because we'll need it later."

**Starter-template check:** the architecture explicitly declares *"No starter template (brownfield). First implementation story = extend `scripts/update/lib/` with the cadence module, NOT a project init."* Story 1.1 extends existing infrastructure. ✅ Correctly handled — a greenfield-style setup story here would have been the violation.

### Findings

#### 🟠 Major Issues

**M1 — Story 1.1's acceptance criterion encodes an unresolved architectural contradiction as though it were settled.**

Story 1.1 AC1 requires cadence fields to *"resolve via the config-loader."* But **OQ-1** (recorded inline at arch §AD1 and on the I113 backlog row, 2026-06-28) is precisely the contradiction that AD1 says config-loader reads cadence state while AD8 / Component Boundaries say *only* `cadence-state.js` touches `cadence.yaml` — compounded by the frozen `config-loader.js` API hardcoding the filename `config.yaml`, which cannot read `cadence.yaml` without a Story-1A.2-AC9 spec amendment.

As written, **Story 1.1 is not implementable** — the AC mandates a path the architecture forbids elsewhere and the frozen API cannot serve.

- **Why this matters more than the tracking suggests:** this is **story 1 of 21, first story of the first epic, on the critical path.** Every other Epic 1 story reads or writes cadence state. Sprint planning hits this on day one.
- **Status:** known, tracked, with a defined gate (*"resolve at sprint-planning"*). Not a surprise — but not resolved either, and the re-baseline did not touch it.
- **Recommendation.** Resolve OQ-1 **before** sprint-planning rather than at it. The architecture already records a leaning (`cadence-state.js` owns I/O and delegates to config-loader's read internals); ratify or reject it, then amend Story 1.1's AC1 to match. This is the single highest-priority pre-sprint action in the chain.

**M2 — Epic 3 (the declared MVP differentiator) is blocked on external work that has no specs.**

Epic 3 carries `blocked-on: external A8 Epic 1B` (v4.0.1 Amelia consolidation). Fast Lane item **D15** independently confirms the state: *"sprint-status lists all 3 at `backlog` but specs don't exist on disk."* So the MVP's differentiating epic is gated on three unwritten stories in a different release.

The epics file already flags this and recommends *"sequence E7 LAST among MVP epics, OR run a small decoupling spike."* That recommendation has not been actioned. **Recommendation:** action it at sprint-planning — the decoupling spike is cheap and converts an unbounded external gate into a known one. Do not let E7 slip by default, since it is the offense the whole PRD argues for.

**M3 — Three load-bearing stories carry a single happy-path AC with no failure condition.**

| Story | ACs | Gap |
|---|---|---|
| 1.5 Cadence status | 1 | No behaviour specified for missing or corrupt `cadence.yaml` — yet this is the observability command NFR12 calls the proof that the policy is binding. |
| 1.8 Breaking-change protocol | 1 | *"the breaking-change protocol is invoked"* is not independently testable. The protocol is defined in Story 1.4's policy artifact; this AC asserts invocation without specifying an observable outcome. |
| 1.9 Fork / ancient-pin re-entry | 1 | Happy path only. Journey 5 calls this *"the strongest possible evidence the floor works"* — no AC covers a fork that cannot be migrated cleanly, which is the case that actually tests the thesis. |

**Recommendation:** add one failure-path AC to each at story-creation time. All three are in Epic 1, and all three failure modes are exactly what OC-R6 (next-action, not bare error) governs.

#### 🟡 Minor Concerns

**m1 — Dual epic numbering is actively producing ambiguous references.** The PRD names capability streams `E1/E2/E4/E7`; the epics file names delivery epics `Epic 1/2/3/4`. The mapping is inverted and non-obvious: PRD **E4** → **Epic 1**, PRD **E2** → **Epic 2**, PRD **E7** → **Epic 3**, PRD **E1** → **Epic 4**.

This is not hypothetical. The I113 backlog row currently reads *"blocks **E4 Story 1.1**"* — which parses naturally as *Epic 4, Story 1.1*, a story that does not exist (Epic 4 holds 4.1–4.3). The intended referent is Epic 1, Story 1.1. **Recommendation:** adopt one convention for story references (`Epic 1 Story 1.1`) and reserve `E1…E7` strictly for PRD capability streams; correct the backlog reference.

**m2 — Acceptance-criteria density is inconsistent.** Median 1–2 ACs per story; Story 2.4 (added 2026-08-09) has 5. Either 2.4 is over-specified or its neighbours are under-specified. Given the epics are explicitly *"commitment-locking plan-ahead, not implementation-ready,"* thin ACs are partly by design — but M3 shows the thinness is load-bearing in at least three places. Flagged so the inconsistency is a deliberate choice at story-creation, not an accident.

**m3 — Story 1.2's embedded caveat may already be resolved by in-flight work.** Story 1.2 carries: *"verify `migration-runner` is not forward-only at implementation; if it is, deliver the contract as a new opt-in component."* **BUG-8** (Bug Lane, score 2.7, release-blocker for 4.0 — *"migration rollback can't restore the rewritten skills"*) is in flight right now against `migration-runner.js` and `backup-manager.js`. Whoever resolves BUG-8 will have answered Story 1.2's open question as a side effect. **Recommendation:** capture the answer in the story when BUG-8 closes, rather than re-deriving it at implementation.

#### 🔴 Critical Violations

**None.** No technical epics, no forward dependencies, no epic-sized stories, no story without acceptance criteria (all 21 have ≥ 1).

### Best-Practices Compliance Checklist

| Check | Epic 1 | Epic 2 | Epic 3 | Epic 4 |
|---|---|---|---|---|
| Delivers user value | ✅ | ✅ | ✅ | ✅ |
| Functions independently | ✅ | ✅ | ⚠️ external gate (M2) | ✅ |
| Stories appropriately sized | ✅ | ✅ | ✅ | ✅ |
| No forward dependencies | ✅ | ✅ | ✅ | ✅ |
| Resources created when first needed | ✅ | ✅ | n/a | n/a |
| Clear acceptance criteria | ⚠️ M3 | ✅ | ✅ | ✅ |
| Traceability to FRs maintained | ✅ | ⚠️ C1 (FR11b) | ✅ | ✅ |

---

## Summary and Recommendations

### Overall Readiness Status

# ⚠️ NEEDS WORK

**Precisely scoped: needs work *before sprint execution*, not before sprint planning.** The chain is structurally sound — 100% FR coverage, no forward dependencies, no technical epics, correct brownfield handling, and an architecture that absorbed two unplanned upstream minors without revision. What blocks it is one unimplementable first story and one unresolved external gate, both already known, neither fixed.

**A READY verdict was not available** for a specific reason: Story 1.1 — the first story of the first epic, on the critical path — cannot be implemented as written (M1). No amount of downstream quality compensates for that.

### Assessment Scorecard

| Dimension | Result |
|---|---|
| Documents located, no duplicates | ✅ Pass |
| FR coverage (PRD → epics) | ✅ **26/26 = 100%** |
| Epic-declaration vs mechanical per-story scan | ✅ Reconciles exactly |
| NFR completeness | ✅ 14/14, contiguous, each with verification approach |
| UX alignment | ✅ N/A justified; covered by a stronger artifact |
| Epic independence / forward dependencies | ✅ None found |
| Technical-epic violations | ✅ None |
| Stories with acceptance criteria | ✅ 21/21 |
| Traceability integrity | ⚠️ 2 broken pointers (C1, C2) |
| First-story implementability | ❌ **Blocked (M1 / OQ-1)** |
| MVP differentiator unblocked | ❌ **Blocked on unspecified external work (M2)** |

### Findings by Severity

**🔴 Critical (0)** — none.

**🟠 Major (5)**

| ID | Finding | Fix cost |
|----|---------|----------|
| **M1** | Story 1.1's AC mandates config-loader access to `cadence.yaml` that AD8 forbids and the frozen API cannot serve (OQ-1 unresolved). First story, critical path. | Decision + 1 AC edit |
| **M2** | Epic 3 (MVP differentiator) blocked on A8 Epic 1B, whose specs do not exist on disk (confirmed by D15). | Decoupling spike |
| **M3** | Stories 1.5, 1.8, 1.9 carry a single happy-path AC with no failure condition — all three governed by OC-R6. | 3 AC additions |
| **C1** | `FR11b` cited 5× in the epics, defined nowhere in the PRD — epic-invented requirement. | 1 PRD line |
| **C2** | Covenant + Compliance Checklist never declared as inputs nor cited by path, despite FR15–18, FR26, NFR11, MO3, MO4 depending on them. | Frontmatter + 1 citation |

**🟡 Minor (3)** — m1 dual epic numbering producing live broken references (`"blocks E4 Story 1.1"` resolves to a nonexistent story); m2 AC-density inconsistency; m3 Story 1.2's open question about `migration-runner` will be answered as a side effect of in-flight BUG-8.

**ℹ️ Info (2)** — D1 all three artifacts amended same-day by the assessor (self-review caveat); D2 filenames retain the stale `v6.4-v6.8` qualifier by operator decision (tracked as I121).

### Critical Issues Requiring Immediate Action

1. **Resolve OQ-1 before sprint-planning, not at it (M1).** The architecture already records a leaning — `cadence-state.js` owns `cadence.yaml` I/O and delegates to config-loader's read internals. Ratify or reject it, then amend Story 1.1 AC1 to match. Until this lands, Epic 1 cannot start, and Epic 2 declares Epic 1's Story 1.2.
2. **Action the E7 decoupling spike (M2).** The epics recommended it on 2026-06-21 and it was never run. Either confirm the A8 Epic 1B gate is soft and sequence E7 normally, or confirm it is hard and sequence E7 last. Letting it slip by default silently de-scopes the release's differentiator.

### Recommended Next Steps

**Before sprint-planning (cheap, do now — ~30 minutes total):**

1. **Add FR11b to the PRD** (C1) — insert into `### Schema Conformance & Migration *(E2)*` immediately after FR11, reusing the epics' wording. Then correct the FR total to 27 in the backlog I113 Artifacts cell. *The epics need no change; they are already correct.*
2. **Declare the Covenant artifacts** (C2) — add `convoke-covenant-operator.md` and `convoke-spec-covenant-compliance-checklist.md` to `inputDocuments` in the PRD and Architecture, and cite the Covenant by path at first use of "OC-R5" in Epic 3 — **with a sentence of rationale**, since a bare "see the Covenant" violates OC-R3, the very Right it encodes.
3. **Fix the `E4 Story 1.1` reference** in the I113 backlog row (m1) and adopt `Epic N Story N.M` for story references, reserving `E1…E7` for PRD capability streams.

**At sprint-planning (decisions, not edits):**

4. **Resolve OQ-1** (M1) — highest priority; gates Epic 1 Story 1.
5. **Run or explicitly waive the E7 decoupling spike** (M2).
6. **Add failure-path ACs** to Stories 1.5, 1.8, 1.9 (M3) at story-creation time.
7. **Carry BUG-8's outcome into Story 1.2** (m3) when it closes — it answers the forward-only question for free.

**Unchanged and requiring no action:** the absorption ternary and AD1–AD9; the MVP scope decision (E2+E4+E7); the 21-story / 4-epic structure; NFR1–NFR14; all five user journeys.

### Assessor's Note on Independence

This assessment was performed by the same agent that authored the 2026-08-09 amendments under review. That is a real limitation and is recorded rather than glossed: **C1 is a defect I introduced today**, caught only because the workflow forces FR extraction from the PRD's own canonical section rather than from the epics' restatement of it.

The findings that predate my amendments (M1/OQ-1, M2, M3, m1) are independent of that conflict. The findings that concern my own work (C1, and C2's exposure) should be weighted accordingly — a second reviewer would be justified in looking hardest there.

### Final Note

This assessment identified **10 issues across 4 severity categories** (0 Critical, 5 Major, 3 Minor, 2 Info). None is a scope or structural defect — every one is a broken pointer, an unresolved decision, or a thin acceptance criterion. Three of the five Major findings are fixable in under an hour of editing; the other two (M1, M2) require decisions the operator must make, not work an agent can do alone.

The re-baseline itself introduced **one** defect (C1) and surfaced **two** pre-existing gaps that the window widening had nothing to do with (the `_team-factory` schema, and C2's missing Covenant pointers). That is a favourable ratio for an amendment made against a moving upstream, and it argues the Option B narrow-amendment approach was correctly scoped.

**Verdict: NEEDS WORK — proceed to sprint-planning, do not proceed to sprint execution.**

---

**Assessed:** 2026-08-09 · **Assessor:** Winston (System Architect) · **Method:** `bmad-check-implementation-readiness` (6 steps, mechanical enumeration per `mechanical-research-enumeration`) · **Chain:** I113 / Convoke v4.1 (absorption window v6.4–v6.10)

## Remediation Applied — 2026-08-09 (post-assessment)

Three findings were fixed immediately after the assessment closed. Each fix was **re-verified by re-running the exact check that produced the finding**, not by inspection.

| ID | Fix | Verification | Result |
|----|-----|--------------|--------|
| **C1** | `FR11b` added to the PRD's `### Schema Conformance & Migration *(E2)*` group, immediately after FR11, with the column-mapping and OC-R5 constraints stated. | Re-extracted the FR set from the PRD's canonical `## Functional Requirements` section and `diff`'d it against every `FR` token in the epics. | ✅ **Sets identical.** PRD FR total 26 → **27**. Epics unchanged (they were already correct). |
| **C2** | `convoke-covenant-operator.md` + `convoke-spec-covenant-compliance-checklist.md` declared in `inputDocuments` of **all three** artifacts; normative-reference block added to Epic 3 citing both by path **with rationale**. | Re-grepped `inputDocuments` blocks and Epic 3 body for covenant paths. | ✅ PRD ✓, Arch ✓, Epics ✓; Epic 3 cites both by path. |
| **m1** | I113's OQ-1 pointer corrected `E4 Story 1.1` → **`Epic 1 Story 1.1`** (PRD stream E4), with the dual-numbering mapping stated inline. Convention adopted: `Epic N Story N.M` for stories, `E1…E7` for PRD capability streams. | Re-grepped the backlog for the broken string. | ✅ Corrected on the live I113 row. **One occurrence deliberately left** in the 2026-06-28 Change Log entry — dated history is append-only; the 2026-08-09 entry carries the forward-pointing correction. |

**On the C2 wording.** The Epic 3 reference states *why* the Covenant must be read — that the epic has no independent definition of correctness, since "OC-R5" and the ≥ 82% floor are defined nowhere in the PRD, architecture, or epics, and the 82% originates in the Covenant's 2026-04-18 baseline audit. This is deliberate: `project-context.md`'s own rule holds that *"See the Covenant" with no rationale violates OC-R3* — the Right the Covenant encodes. A compliance pointer that violates the standard it points at would have been a poor fix.

**Counts re-verified after all edits:** 21 stories (E1: 10, E2: 4, E3: 4, E4: 3), 27 FRs, 14 NFRs — all derived from source, matching every claim in the artifacts and the backlog row.

### Post-Remediation Status

**Verdict unchanged: ⚠️ NEEDS WORK.** The three traceability defects are closed, but the two findings that gate implementation are decisions, not edits, and both remain open:

- **M1 — OQ-1.** Escalated on the I113 row from *"resolve at sprint-planning"* to **"resolve before sprint-planning"**, with the reason recorded: Story 1.1 is story 1 of 21 on the critical path and is not implementable as written.
- **M2 — Epic 3's external gate.** The decoupling spike recommended 2026-06-21 is still un-run.

**M3** (three single-AC stories) and **m2/m3** are correctly deferred to story-creation, where acceptance criteria are authored in detail.

The chain is now **internally consistent**. What remains is not documentation debt — it is two open decisions that belong to the operator.
