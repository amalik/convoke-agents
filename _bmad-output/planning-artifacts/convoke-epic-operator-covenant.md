---
stepsCompleted:
  - validate-prerequisites
  - design-epics
  - create-stories
  - final-validation
inputDocuments:
  - _bmad-output/planning-artifacts/loom-note-backlog-candidate-experience-contract.md
  - Party mode session 2026-04-18 (Sally, John, Loom Master, Winston, Paige, Bob, Dr. Quinn, Victor)
initiative: convoke
artifact_type: epic
status: ready-for-sprint-planning
created: '2026-04-18'
schema_version: 1
---

# Convoke — The Convoke Operator Covenant

## Overview

Convoke skills are structurally consistent (Loom validates file structure, wiring, naming) but **experientially inconsistent**. No codified rules govern how skills interact with operators. Two production failures surfaced this gap:

- **Migration** dumped 31 "ACTION REQUIRED" items with no guidance
- **Portfolio** silently dropped 108 of 151 files (71%) with no explanation

This initiative codifies the **Convoke Operator Covenant** — a single architectural axiom and seven derived operator rights that govern how every Convoke skill must interact with operators.

### Axiom

> **The operator is the resolver.**
>
> Convoke skills treat uncertainty as a collaboration signal, not an output failure. When a skill cannot resolve cleanly, the operator is brought into the loop — informed, oriented, and empowered to decide.

### Job-To-Be-Done

> Operators don't hire Convoke to produce output. They hire Convoke to feel in control of decisions they don't fully understand.

### Strategic Positioning

Competitors (CrewAI, LangGraph, AutoGen, Agentic Mesh) compete on **capability density** — more agents, more tools, more integrations. Convoke competes on **operator experience as a first-class architectural concern**. The Covenant is a Blue Ocean wedge — a positioning document, not just an internal quality gate. Once earned internally through audit, it becomes external launch material.

### Two-Artifact Structure

- **Artifact 1 — The Convoke Operator Covenant:** Principle + 7 rights + scar stories + JTBD. Explanation type (Diátaxis). External, publishable. Evolves slowly.
- **Artifact 2 — Covenant Compliance Checklist:** Tabular reference derived from the Covenant. Reference type. Internal. Evolves tactically. Future Loom validation gate input.

## Requirements Inventory

### Functional Requirements

**Operator Rights (7):**

- FR1 [Covenant]: When a skill encounters unresolvable state, it must propose a default value rather than emit "unknown" — **Right to a default**
- FR2 [Covenant]: Skills that filter or scan data must display the full universe (scope + count) before presenting filtered results — **Right to the full universe**
- FR3 [Covenant]: Every operator decision point must present rationale explaining why the decision matters — **Right to rationale**
- FR4 [Covenant]: Skills must not silently drop data; every exclusion must be named and justified with a reason — **Right to completeness**
- FR5 [Covenant]: Workflows must WAIT for operator input at every designated decision point; no auto-advance through ambiguity — **Right to pause**
- FR6 [Covenant]: Error messages must state the next action the operator should take, not only what went wrong — **Right to next action**
- FR7 [Covenant]: Skills must introduce at most 3 new concepts per interaction round — **Right to pacing**

**Taxonomy Extension (1):**

- FR8 [Taxonomy]: `covenant` is added as a new `artifact_type` in `_bmad/_config/taxonomy.yaml`, with an inline qualifier test documenting the two criteria that earn the type: (1) expresses commitments/rights binding multiple parties, and (2) compliance is testable/auditable against explicit criteria. Before shipping, all `taxonomy.yaml` consumers (validators, migration scripts, portfolio engine) are enumerated and verified to handle the new type gracefully — no hardcoded whitelists break. [Amended 2026-04-18, pre-mortem failure mode 4]

**Audit (2):**

- FR9 [Audit]: An audit matrix exists scoring each of 4 representative Convoke skills (one data-transforming, one scanning/listing, one generation, one decision-support) against the 7 rights, with binary pass/fail per right + evidence note. Audit methodology is documented: per right, the test applied and what counts as "pass" is explicit enough for a third party to reproduce the judgment. [Amended 2026-04-18, pre-mortem failure mode 2]
- FR10 [Calibration]: Audit includes Migration and Portfolio as calibration cases — both are known violators of specific rights from the scar stories. If the audit methodology fails to detect these known violations, the methodology is broken and must be revised before audit proceeds on the other 4 skills. [Added 2026-04-18, pre-mortem failure mode 2]

**Artifacts (3):**

- FR11 [Covenant]: "The Convoke Operator Covenant" reference document exists containing: axiom, JTBD statement, 7 rights in operator-rights framing, scar stories (Migration + Portfolio by name), audience guidance (contributors / reviewers / operators)
- FR12 [Checklist]: "Covenant Compliance Checklist" tabular reference document exists, derived from the Covenant, with one testable question per right and a compliance-status column
- FR13 [Adoption Surface]: Convoke's contributor-facing documentation (primary landing surfaces for new skill authors — e.g., bme module README, agent-builder skill intro, CLAUDE.md if applicable) prominently references the Covenant as required reading before authoring a new skill. [Added 2026-04-18, pre-mortem failure mode 1]

**Self-Compliance (1):**

- FR14 [Self-Compliance]: Before the Covenant document (FR11) is marked done, it is evaluated against the Covenant Compliance Checklist (FR12) and passes all rights defined in the Checklist. Dependency resolution: Story 1.3 produces the Checklist (authored from the 7 rights baseline + any audit-recommended additions/removals); Story 1.4 produces the Covenant draft and self-validates it against Story 1.3's Checklist before closure. [Added 2026-04-18, pre-mortem failure mode 3; swap resolved 2026-04-18, final validation]

**Adoption (deferred):**

- FR15 [Retrofit]: Skills identified in FR9 audit with highest violation counts are retrofitted to comply with the specific rights they violated
- FR16 [Enforcement]: Covenant Compliance Checklist is wired into the Loom Add Skill workflow (Phase 3 dependency) as a validation gate before skill generation completes
- FR17 [Publication]: The Covenant is published as external positioning material (repository README section, blog post, or equivalent) with audit findings as credibility evidence. **Publication Gate:** Story 2.3 is blocked by Story 2.1 completing retrofits of at least the rights scoring worst in the audit — publication requires internal compliance on the bottleneck rights. [Amended 2026-04-18, pre-mortem failure mode 5]

### NonFunctional Requirements

- NFR1 [Publishability]: The Covenant document must be comprehensible to non-Convoke audiences (competitors, practitioners, potential adopters) without requiring prior Convoke knowledge
- NFR2 [Credibility]: The Covenant must pass credibility-gap testing — every right claimed must be supported by either audit-verified internal compliance or a committed retrofit plan; no aspirational claims without evidence
- NFR3 [Scar-anchoring]: Each right must be anchored in a documented production incident (Migration's 31 ambiguous items, Portfolio's 108/151 drops, or equivalent). Rules without scars are rejected.
- NFR4 [Diátaxis compliance]: Covenant follows Diátaxis **Explanation** type (prose + rationale + examples). Checklist follows Diátaxis **Reference** type (tabular + testable + dry).
- NFR5 [Derivation integrity]: Every right must trivially derive from the axiom. If a right cannot be shown as a direct consequence of "the operator is the resolver," it is either rewritten or rejected.
- NFR6 [Checklist machine-readability]: Checklist must be structured in a format that can be consumed by a future Loom validation gate (tabular, binary outcomes, stable rule IDs)
- NFR7 [Self-compliance / dogfooding]: The Covenant document itself must comply with the 7 rights it defines (e.g., it must explain why each right exists, not silently omit rationale)
- NFR8 [Bottleneck prioritization]: Retrofitting (FR15) prioritizes rights with highest violation counts from the audit, not uniform enforcement across all rights (Dr. Quinn's Theory of Constraints input)

### Additional Requirements

**Namespace & Governance:**

- Namespace: `_bmad/bme/` — this is Convoke-specific UX philosophy, not upstream BMAD framework
- Taxonomy decision (resolved 2026-04-18): `covenant` is added as a new `artifact_type` with a two-rule qualifier test (see FR8). Rationale: covenant has a different metabolic rate than `spec` (slow-evolving principle vs. tactical implementation doc), real reuse potential (future Handoff Contract Standard, Contributor Covenant), and stronger external positioning signal for Victor's Blue Ocean wedge.
- Artifact governance naming (per `_bmad/_config/taxonomy.yaml` after FR8):
  - Audit output (FR9 / Epic 1 Story 1): `convoke-report-operator-covenant-audit-2026-04-XX.md` (`artifact_type: report`)
  - Checklist (FR12 / Epic 1 Story 3): `convoke-spec-covenant-compliance-checklist.md` (`artifact_type: spec`)
  - Covenant (FR11 / Epic 1 Story 4): `convoke-covenant-operator.md` (`artifact_type: covenant`)

**Audit Scope:**

- Audit must cover 4 skills representing different interaction risk profiles:
  1. Data-transforming (like Migration that failed)
  2. Scanning/listing (like Portfolio that failed)
  3. Generation (e.g., a factory workflow)
  4. Decision-support (e.g., prioritization skill)
- Audit methodology: ~30-min walkthrough per skill, binary rating per right + one-line evidence note
- Audit output feeds directly into Covenant authoring (S2) — audit may refine, add, or remove rights

**Document Format (Paige's scar-anchored structure):**

Each right in the Covenant must include:
1. The right (one-sentence statement)
2. Why it exists (one paragraph, anchored in a real incident)
3. Good example (concrete interaction snippet)
4. Anti-pattern (concrete interaction snippet + what it should have been)

**Integration Dependencies:**

- Future Loom Add Skill workflow (Phase 3) — Covenant Compliance Checklist becomes a validation gate input
- Existing skills retrofit — scope determined by audit findings (FR8) and prioritized by violation frequency (NFR8)

### UX Design Requirements

- UX-DR1: The Covenant document exemplifies the 7 rights it defines (dogfooding / self-compliance — NFR7 operationalized)
- UX-DR2: Each right presentation follows Paige's 4-part format: statement / why / good example / anti-pattern
- UX-DR3: Three distinct reader audiences are explicitly addressed in the Covenant: contributors (building new skills), reviewers (auditing existing skills), operators (understanding what they're entitled to)
- UX-DR4: Scar stories are told by name — "Migration dumped 31 ambiguous items on 2026-XX-XX" — not anonymized. This is a trust signal.
- UX-DR5: Checklist tabular format supports ≤3 columns for scan-ability (rule ID / question / compliance status)
- UX-DR6: Derivation from axiom is visible in the Covenant — reader can trace any right back to "the operator is the resolver"

### FR Coverage Map

- **FR1–FR7** (7 Operator Rights) → Epic 1, Story 4 (Author Covenant — defines them)
- **FR8** (Taxonomy extension) → Epic 1, Story 2
- **FR9** (Audit matrix) → Epic 1, Story 1
- **FR10** (Calibration cases) → Epic 1, Story 1
- **FR11** (Covenant document) → Epic 1, Story 4
- **FR12** (Compliance Checklist) → Epic 1, Story 3
- **FR13** (Adoption Surface) → Epic 1, Story 5
- **FR14** (Self-Compliance) → Epic 1, Story 4 (AC on closing the Covenant story)
- **FR15** (Retrofit) → Epic 2, Story 1
- **FR16** (Loom wiring) → Epic 2, Story 2
- **FR17** (Publication, gated) → Epic 2, Story 3

All 17 FRs mapped. No orphans.

## Epic List

### Epic 1: Define the Convoke Operator Covenant

**Goal:** Convoke contributors and reviewers gain a shared, auditable standard for operator experience. The initiative earns the right to publish externally by first verifying internal compliance through audit.

**User outcomes:**
- Contributors have an authoritative reference for how skills must interact with operators, surfaced at the point of skill authoring
- Reviewers have a machine-friendly checklist for auditing new and existing skills
- Operators (implicitly) gain codified rights backed by evidence
- The Covenant itself demonstrably complies with its own rules (dogfooding)

**FRs covered:** FR1, FR2, FR3, FR4, FR5, FR6, FR7, FR8, FR9, FR10, FR11, FR12, FR13, FR14

**Stories:**
1. Covenant Audit (with calibration cases)
2. Taxonomy Extension (with consumer audit)
3. Derive Covenant Compliance Checklist (from 7 rights baseline + audit recommendations)
4. Author The Convoke Operator Covenant (self-validates against Story 1.3 Checklist before close)
5. Adoption Surface — wire Covenant into contributor-facing documentation

**Internal dependencies:**
- 1.1 and 1.2 run in parallel
- 1.3 (Checklist) requires 1.1 audit recommendations (the 7 rights baseline from party mode, adjusted for any audit additions/removals)
- 1.4 (Covenant) requires 1.1 (audit findings for scar-anchoring), 1.2 (taxonomy `covenant` type for filename), and 1.3 (Checklist for self-compliance gate)
- 1.5 (Adoption Surface) requires 1.4 closed

**Standalone property:** Delivers a complete, usable, self-validated Covenant + Checklist surfaced in contributor docs. No Epic 2 dependency.

### Epic 2: Adopt and Publish the Convoke Operator Covenant

**Goal:** The Covenant transitions from codified principle to enforced standard — retrofitted into existing skills, structurally gated for new skills, and published externally as Convoke's positioning wedge.

**User outcomes:**
- Existing skills with highest violation counts are brought into compliance
- The Loom Add Skill workflow automatically validates Covenant compliance for new skills
- External audiences see Convoke's differentiating commitment (operator experience as first-class architectural concern) with credibility evidence — not aspirational claims

**FRs covered:** FR15, FR16, FR17

**Stories (deferred):**
1. Retrofit highest-violation skills
2. Wire Checklist into Loom Add Skill workflow (Phase 3 dependency)
3. Publication strategy (gated)

**Internal dependencies:**
- Story 2.1 independent of others
- Story 2.2 blocked by Phase 3 Add Skill workflow
- **Publication Gate:** Story 2.3 blocked by Story 2.1 completing retrofit of at least the rights scoring worst in the audit. External publication requires internal compliance on bottleneck rights — you don't publish a covenant you can't keep.

**Standalone property:** Pure adoption work. Requires Epic 1 complete. Stories independently deliverable within Epic 2, subject to the Publication Gate.

## Epic 1: Define the Convoke Operator Covenant

Convoke contributors and reviewers gain a shared, auditable standard for operator experience. The initiative earns the right to publish externally by first verifying internal compliance through audit.

### Story 1.1: Covenant Audit with Calibration Cases

As a Convoke contributor earning external publishing rights for the Covenant,
I want an audit matrix scoring 4 representative Convoke skills + 2 calibration cases (Migration, Portfolio) against the 7 Operator Rights,
So that the Covenant is built on verified evidence and the audit methodology is validated by catching known violations.

**Acceptance Criteria:**

**Given** the 7 Operator Rights from the party mode session (2026-04-18) as canonical baseline for this audit
**When** the audit methodology is defined
**Then** for each right the methodology specifies (1) the test applied, (2) what counts as pass, (3) what counts as fail, in enough detail that two reviewers independently scoring the same skill against the same right agree on ≥ 80% of cells; reproducibility is measured as an acceptance check on at least one skill before the methodology is locked

**Given** the 7 Operator Rights as frame of reference
**When** the audit produces findings
**Then** rights are referenced by name (e.g., "Right to completeness") and not by number, so that any renumbering during Story 1.3 Covenant authoring does not invalidate the audit findings

**Given** the audit methodology
**When** applied to Migration as a calibration case
**Then** Migration is flagged as violating the **Right to completeness** (silent drops / unexplained exclusions) and the **Right to pause** (WAIT at decision points) at minimum

**Given** the audit methodology
**When** applied to Portfolio as a calibration case
**Then** Portfolio is flagged as violating the **Right to the full universe** (show scope before filtering) and the **Right to completeness** (silent drops) at minimum

**Given** a calibration failure
**When** either Migration or Portfolio fails to trigger the expected violations
**Then** the methodology is marked broken and revised before the 4 representative skills are audited

**Given** a validated methodology
**When** applied to 4 representative skills (one data-transforming, one scanning/listing, one generation, one decision-support)
**Then** each skill receives a binary pass/fail per right with an evidence note of ≤ 2 sentences citing specific behavior

**Given** a complete audit
**When** results are tabulated
**Then** a matrix exists (skill × right → pass/fail/evidence) and a summary ranks rights by violation frequency (bottleneck identification for NFR8)

**Given** the audit report
**When** saved
**Then** the file is at `_bmad-output/planning-artifacts/convoke-report-operator-covenant-audit-YYYY-MM-DD.md` with governance frontmatter (`initiative: convoke`, `artifact_type: report`, `created: YYYY-MM-DD`)

### Story 1.2: Taxonomy Extension with Consumer Audit

As a Convoke contributor needing the Covenant artifact named semantically,
I want `covenant` added to `taxonomy.yaml` as a new `artifact_type` with a qualifier test AND a verified consumer audit,
So that the Covenant can be named `convoke-covenant-operator.md` without breaking validators, migration scripts, or portfolio engine.

**Acceptance Criteria:**

**Given** `_bmad/_config/taxonomy.yaml`
**When** `covenant` is added to the `artifact_types` list
**Then** an inline YAML comment documents the two-rule qualifier test: (1) expresses commitments/rights binding multiple parties, (2) compliance is testable/auditable against explicit criteria

**Given** the taxonomy file
**When** consumers are enumerated via grep patterns (`require.*taxonomy`, `fs.*taxonomy`, `yaml.*taxonomy`, `artifact_types`) plus manual inspection of `scripts/update/`, `scripts/migrate/`, and `tests/**/*taxonomy*.test.js`
**Then** a list exists of every file that consumes `taxonomy.yaml` (validators, migration scripts, portfolio engine, any skill referencing it)

**Given** the consumer list
**When** each consumer is invoked (CLI command or test fixture) with a sample file carrying `artifact_type: covenant` governance frontmatter
**Then** no consumer crashes, rejects the file, or emits an unknown-type error; any hardcoded whitelist is updated before shipping

**Given** the updated taxonomy and consumers
**When** `convoke-doctor` is run
**Then** it completes without error and treats `covenant` as a valid type

**Given** a file with `artifact_type: covenant` governance frontmatter
**When** portfolio/validator tools scan it
**Then** no tool flags the type as unknown

### Story 1.3: Derive Covenant Compliance Checklist

As a Convoke reviewer auditing a new or existing skill,
I want a tabular Checklist derived from the 7 Operator Rights with one testable yes/no question per right,
So that I can evaluate skill compliance quickly and consistently, the format is machine-readable enough to serve as a future Loom validation gate input, AND the Checklist serves as the self-compliance gate for the Covenant authored in Story 1.4.

**Acceptance Criteria:**

**Given** the 7 Operator Rights from the party mode session (2026-04-18) as baseline, adjusted by any Story 1.1 audit recommendations (additions/removals)
**When** the Checklist is authored
**Then** it contains one row per right (count matches the final right count after audit adjustments) with 3 columns maximum: (1) rule ID (stable: `OC-R1`, `OC-R2`, ... in baseline order), (2) testable question in yes/no form, (3) compliance-status column left unfilled for use during audits

**Given** the Checklist
**When** its format is inspected
**Then** rule IDs are stable and unique within the Checklist, columns are ≤ 3 (UX-DR5), and the structure is a simple markdown table parseable via standard markdown parsers without custom tooling (NFR6) — a future Loom validator can extract (rule ID, question, status) columns programmatically

**Given** the Checklist
**When** saved
**Then** it is at `_bmad-output/planning-artifacts/convoke-spec-covenant-compliance-checklist.md` with governance frontmatter (`initiative: convoke`, `artifact_type: spec`, `created: YYYY-MM-DD`)

### Story 1.4: Author The Convoke Operator Covenant

As a prospective adopter of Convoke (internal contributor or external evaluator),
I want the Convoke Operator Covenant as a single authoritative document codifying the axiom, Operator Rights, scar stories, and JTBD,
So that I understand what Convoke commits to operators, can trace each right to a real production incident, and can evaluate whether Convoke meets its own standard.

**Acceptance Criteria:**

**Given** the party mode session output, Story 1.1 audit findings, and Story 1.3 Checklist (for rights count and rule IDs)
**When** the Covenant is drafted
**Then** it contains (1) the axiom "The operator is the resolver" with a one-paragraph explanation, (2) the JTBD statement, (3) the Operator Rights (count matches Story 1.3 Checklist), (4) a "Why This Exists" section with scar stories naming Migration and Portfolio and their specific violations, (5) audience guidance addressing three distinct readers: contributors, reviewers, operators

**Given** the draft
**When** each right is written
**Then** it follows the 4-part format: (1) right statement (one sentence), (2) why it exists (paragraph anchored in a real incident), (3) good example (concrete interaction snippet), (4) anti-pattern (concrete snippet + what it should have been)

**Given** the draft
**When** reviewed for derivation integrity (NFR5)
**Then** every right can be shown as a direct consequence of the axiom; rights that cannot be derived are rewritten or removed before proceeding

**Given** the Covenant draft AND the Checklist from Story 1.3
**When** the Checklist is applied to the draft (self-compliance per FR14)
**Then** the draft passes all rights defined in the Checklist; failures are remediated before the story closes

**Given** the validated Covenant
**When** saved
**Then** it is at `_bmad-output/planning-artifacts/convoke-covenant-operator.md` with governance frontmatter (`initiative: convoke`, `artifact_type: covenant`, `created: YYYY-MM-DD`)

### Story 1.5: Adoption Surface

As a new Convoke contributor authoring a skill,
I want contributor-facing documentation to prominently point me to the Operator Covenant before I start writing,
So that the Covenant is consulted at the point of authorship — not discovered after a review failure.

**Acceptance Criteria:**

**Given** the current contributor-facing landing surfaces (bme module README, agent-builder skill intro, and repo root CLAUDE.md if it references skill authoring)
**When** each surface is updated
**Then** each includes a visible reference to `convoke-covenant-operator.md` as required reading before authoring a new Convoke skill

**Given** the references
**When** a new contributor opens a landing surface
**Then** the Covenant link appears in the first 25 lines OR before the first `## ` section heading, whichever comes first — not buried in footnotes

**Given** the updated surfaces
**When** a contributor searches for Covenant-related content via explicit paths (repo root README, `docs/` index, `bme/README.md` intro, `agent-builder` skill help text)
**Then** the Covenant is surfaced from at least 3 of these 4 paths

**Given** the Covenant reference is placed
**When** checked against Right 3 (explain why it matters)
**Then** the reference explains *why* the Covenant must be consulted — not just "read this" — itself demonstrating dogfooding

## Epic 2: Adopt and Publish the Convoke Operator Covenant

The Covenant transitions from codified principle to enforced standard — retrofitted into existing skills, structurally gated for new skills, and published externally as Convoke's positioning wedge. Epic 2 is deferred pending Epic 1 completion and Phase 3 Add Skill workflow availability.

### Retrofit Trigger Rule (A5, locked 2026-04-19)

oc-2-1 retrofit is scoped when EITHER trigger fires:

- **T1 (concentrated bottleneck):** Any (team × Right) cell measures < 70% compliance across ≥ 3 audited skills in that team. (The N ≥ 3 floor prevents single-sample tyranny — one low-compliance skill in a team is not a team-level bottleneck.)
- **T2 (systemic bottleneck):** Overall audit compliance < 75%, OR any Right < 70% compliance averaged across all audited teams.

Retrofit scope = the (team × Right) cell(s) that tripped the trigger — not the full audit matrix. Rights are treated as peers; severity weighting applies to *scope sequencing within the triggered cells*, not to the trigger threshold itself.

Trigger evaluation re-runs after each audit refresh (v1 oc-1-1 = 2026-04-18 baseline; v2 post-IN-12 Vortex-focused re-audit; v3+ post future re-audits).

**v1 baseline result:** No trigger fires. Overall 82% (>75%); every Right ≥ 70%; no (team × Right) cell at N ≥ 3 measured < 70%. oc-2-1 correctly deferred — but Vortex sampled at N = 1 only, so T1 cannot yet be evaluated for Vortex specifically. IN-12 resolves that.

**Supersedes** the original Story 2.1 AC framing ("rights violated by ≥ 50% of audited skills"), which was undersampled single-matrix-based and did not handle concentrated (team-level) bottlenecks. Retained Story 2.1 ACs below still apply to the *scope definition and regression testing* of the retrofit once a trigger fires.

### Story 2.1: Retrofit Highest-Violation Skills

As an operator of existing Convoke skills whose rights are currently violated,
I want skills identified as bottleneck violators in the audit to be retrofitted to comply with the specific rights they violate,
So that the Covenant's claims have real backing before external publication, and operator experience improves where violations hurt most.

**Acceptance Criteria:**

**Given** the Story 1.1 audit matrix
**When** the bottleneck rights are identified
**Then** all rights violated by ≥ 50% of audited skills (i.e., 2 or more of 4 skills violate it) are listed as bottleneck rights

**Given** the bottleneck rights
**When** retrofit scope is defined
**Then** it is the cross-product of bottleneck rights × the specific skills violating them

**Given** each violating skill
**When** updated to comply with the targeted right
**Then** it now passes the Checklist for that right (re-audit confirms)

**Given** each retrofitted skill
**When** re-audited against ALL rights in the Checklist (not just the bottleneck targets)
**Then** no previously-passing right regresses to failing; regressions block retrofit closure until resolved

**Given** the retrofits are complete for bottleneck rights with no regressions
**When** the Publication Gate (FR17) is evaluated
**Then** it unblocks Story 2.3 — other non-bottleneck retrofits may continue but are not blockers for publication

### Story 2.2: Wire Checklist into Loom Add Skill Workflow

As a contributor using the Loom Add Skill workflow (Phase 3) to author a new skill,
I want the Covenant Compliance Checklist to run as a validation gate before skill generation completes,
So that new skills cannot ship while violating the Covenant — enforcement is structural, not manual.

**Note:** This story is blocked by Phase 3 Loom Add Skill workflow existing. It is defined now for scope completeness but cannot start until the dependency lands.

**Acceptance Criteria:**

**Given** the Phase 3 Loom Add Skill workflow exists
**When** a new skill reaches the validation step
**Then** the Checklist from `convoke-spec-covenant-compliance-checklist.md` is loaded and applied

**Given** the validation step
**When** a skill fails any of the 7 rights
**Then** the Loom workflow blocks completion with an actionable error specifying the failed right + a link to the Covenant's explanation of that right

**Given** the validation step
**When** a skill passes all 7 rights
**Then** the workflow proceeds to completion

**Given** the integration
**When** the Checklist is updated (e.g., new rule added)
**Then** the Loom gate consumes the updated version without code changes to Loom

### Story 2.3: Publication Strategy (Gated)

As a potential Convoke adopter evaluating agent frameworks,
I want the Convoke Operator Covenant published externally as a differentiated positioning statement,
So that Convoke's commitment to operator experience as a first-class architectural concern is visible in the market, backed by audit evidence demonstrating internal compliance.

**Acceptance Criteria:**

**Given** the Publication Gate is cleared (Story 2.1 complete for bottleneck rights with no regressions)
**When** external publication proceeds
**Then** the Covenant appears in the repository README as a dedicated section (primary channel); an accompanying blog post is optional and requires separate approval (secondary channel)

**Given** the publication
**When** an external reader encounters the Covenant
**Then** each right can be traced to (1) the axiom, (2) a specific scar story, (3) an audit result showing internal compliance or active retrofit

**Given** the Story 1.1 audit matrix is included as credibility evidence
**When** readers see it
**Then** every violating skill is named explicitly, every violated right is named by rule ID, and each row shows a remediation status (complete / in-progress / deferred) — no violations hidden or aggregated away

**Given** the Publication Gate is NOT cleared (bottleneck rights still violated or regressions present)
**When** external publication is attempted
**Then** it does NOT proceed; internal use and internal references remain permitted, but external publication is blocked
