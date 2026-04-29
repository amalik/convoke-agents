---
stepsCompleted:
  - step-01-validate-prerequisites
  - step-02-design-epics
  - step-03-create-stories
  - step-04-final-validation
inputDocuments:
  - _bmad-output/planning-artifacts/convoke-prd-bmad-v63-source-format-adoption.md
  - _bmad-output/planning-artifacts/convoke-arch-bmad-v63-source-format-adoption.md
  - _bmad-output/planning-artifacts/adr/i97/adr-001-naming-convention-reconciliation.md
  - _bmad-output/planning-artifacts/adr/i97/adr-002-conversion-tooling-architecture.md
  - _bmad-output/planning-artifacts/adr/i97/adr-003-verification-harness-architecture.md
  - _bmad-output/planning-artifacts/adr/i97/adr-004-atomic-by-agent-commit-and-tooling-namespace.md
  - _bmad-output/planning-artifacts/adr/i97/adr-005-covenant-baseline-validity-policy.md
  - _bmad-output/planning-artifacts/convoke-spec-personality-preservation-rubric.md
  - project-context.md
  - _bmad-output/implementation-artifacts/spike-marketplace-packaging-delta.md
  - memory/project_marketplace_structural_adoption.md
initiative: convoke
artifact_type: epic
qualifier: bmad-v63-source-format-adoption
status: ready-for-sprint
created: '2026-04-28'
schema_version: 1
---

# BMAD-Enhanced — Epic Breakdown for I97 (BMAD v6.3+ Source Format Adoption)

## Overview

This document provides the complete epic and story breakdown for Initiative I97 — **BMAD v6.3+ Source Format Adoption (Convoke 4.0 packaging-contract)**, decomposing the 32 FRs and 19 NFRs from the PRD, the architectural decisions and ADRs, and the personality preservation rubric into implementable stories per the PRD MVP scope.

**Reference artifacts:**

- PRD: [convoke-prd-bmad-v63-source-format-adoption.md](convoke-prd-bmad-v63-source-format-adoption.md)
- Architecture: [convoke-arch-bmad-v63-source-format-adoption.md](convoke-arch-bmad-v63-source-format-adoption.md)
- 5 ADRs: [adr/i97/](adr/i97/) (ADR-001..005)
- Personality rubric: [convoke-spec-personality-preservation-rubric.md](convoke-spec-personality-preservation-rubric.md)

## Requirements Inventory

### Functional Requirements

**Format Conversion (5 FRs):**

- **FR1:** Each Vortex agent's SKILL.md exists in v6.3+ outcome-based markdown format (sections per BMB `standard-fields.md`: Identity, Communication Style, Principles, On Activation, Capabilities). No XML elements remain in any converted agent file.
- **FR2:** Each agent's converted SKILL.md preserves the agent's persona (role, identity, communication style, principles) without semantic loss relative to the pre-migration version.
- **FR3:** Each agent's converted SKILL.md preserves the capability menu (codes + descriptions identical to pre-migration menu, e.g., LP/PV/CS/VL/PM for Emma).
- **FR4:** Each agent's converted SKILL.md delegates activation (config loading, greeting, capability presentation) to the `bmad-init` skill rather than encoding hardcoded `<step>` orchestration.
- **FR5:** Agent skill names follow the naming convention chosen for I97 (per ADR-001: hybrid — internal canonical `bmad-bme-agent-{first-name}`; slash-command compat aliases `bmad-agent-bme-{role}`).

**Manifest Authoring (3 FRs):**

- **FR6:** `_bmad/bme/_vortex/module.yaml` declares all 7 Vortex agents in an `agents:` array conforming to BMM canonical schema (each entry includes `code`, `name`, `title`, `icon`, `team`, `description` fields).
- **FR7:** `_bmad/bme/_vortex/module.yaml` includes Convoke-applicable prompts and directories fields per BMM canonical schema (where Convoke supplies module-level configuration).
- **FR8:** `_bmad/bme/_vortex/module-help.csv` exists at the module root with canonical BMM column ordering (`module, skill, display-name, menu-code, description, action, args, phase, after, before, required, output-location, outputs`) and one row per agent skill.

**Capability Routing & Pattern-C-Friendly Factoring (4 FRs):**

- **FR9:** Each agent has a `./references/<workflow-name>.md` capability prompt for every workflow listed in that agent's pre-migration menu.
- **FR10:** Each `./references/<workflow-name>.md` is structured as a complete, self-contained capability prompt (identity, how-it-works, output expectations) with no agent-internal coupling — Pattern-C-friendly factoring per Distinctive Approach.
- **FR11:** Each agent's `## Capabilities` table routes menu codes to `./references/<workflow-name>.md` paths via the BMB `Load \`./references/{cap}.md\`` route convention.
- **FR12:** Workflow source-of-truth files (`_bmad/bme/_vortex/workflows/<name>/workflow.md` + step files) remain in their pre-migration locations and content. No relocation, no rewriting of workflow source.

**Behavioral Parity Verification (4 FRs):**

- **FR13:** A parity test suite asserts each agent's menu codes are identical pre- and post-migration (no additions, removals, or renamings).
- **FR14:** A parity test suite asserts each agent's capability invocations resolve to the same workflow file paths pre- and post-migration.
- **FR15:** A parity test suite asserts each agent's capability invocations produce the same output filenames pre- and post-migration.
- **FR16:** The parity test suite runs against isolated fixture directories per `test-fixture-isolation` rule.

**Covenant Survival Audit (4 FRs):**

- **FR17:** A Covenant survival audit harness re-runs baseline audit cells (notably A26 Vortex HC-cluster from 2026-04-26 plus predecessor audits) against post-migration source.
- **FR18:** The harness applies the cell-level non-regression rule — for every cell that passed in baseline, the post-migration cell must also pass.
- **FR19:** The harness produces a per-cell pass/fail report comparable to baseline audit reports for traceable verification.
- **FR20:** For any cell where format change *legitimately* invalidates the baseline, the harness flags the cell for explicit re-evaluation per Epic 4's deferred decision (per ADR-005 per-Right matrix).

**Personality Preservation Verification (3 FRs):**

- **FR21:** For each of 7 Vortex agents, fixed-prompt-set Q&A samples are captured pre-migration (baseline) and post-migration (verification) on a shared prompt set per agent.
- **FR22:** For each of 7 Vortex agents, an operator-ranked unscripted multi-turn engagement scenario (5-10 turns of realistic consulting-shaped interaction) is captured pre- and post-migration.
- **FR23:** An operator scoring rubric exists for ranking personality preservation. Definitive disconfirmation threshold: any agent ranked "degraded" by operator review blocks merge. (Rubric authored at `convoke-spec-personality-preservation-rubric.md`; status: draft → calibrated post-pre-test.)

**Reference Integrity Verification (2 FRs):**

- **FR24:** A reference integrity check uses mechanical search (`grep -r` / glob) to verify all internal cross-references resolve under the new file structure.
- **FR25:** The reference integrity check is integrated as a CI gate that fails build on any broken reference.

**Marketplace Submission (3 FRs):**

- **FR26:** `.claude-plugin/marketplace.json` `skills:` array points at converted agent paths under `_bmad/bme/_vortex/agents/<agent>/`.
- **FR27:** A re-submitted PR to `bmad-code-org/bmad-plugins-marketplace` includes the v6.3+ format Convoke plugin and supersedes/closes the rejected PR #9 framing.
- **FR28:** `bmad-cli install convoke-vortex` succeeds end-to-end on a clean test BMAD install (verifies marketplace install flow per Outcome 1).

**Release Pipeline (4 FRs):**

- **FR29:** A 4.1.0 release tag is created on the Convoke repo upon I97 completion, marking the integration point of all merged per-agent atomic conversions.
- **FR30:** A CHANGELOG entry for 4.1.0 documents the v6.3+ format migration scope, compliance-grade-not-positioning-grade boundary, and operator-visible impacts.
- **FR31:** `convoke-agents@4.1.0` is published to npm following the established `host-framework-sync-playbook.md` release sequence.
- **FR32:** A GitHub release for 4.1.0 includes release notes describing the format migration, the marketplace channel restoration, and the I97 → I95 (smoke-test absorbed) relationship.

### NonFunctional Requirements

**Behavioral Preservation (3 NFRs):**

- **NFR1:** For every agent invocation in scope of operational equivalence (FR13-15), the post-migration agent's behavior is bit-identical to pre-migration on shared input prompt sets — same menu codes returned, same workflow paths invoked, same output filenames produced.
- **NFR2:** The personality preservation operator-ranked verification (FR23) admits zero "degraded" rankings as the disconfirmation threshold for ship.
- **NFR3:** For active engagement use cases (Journey 1, mid-migration crossover), the format change is invisible — operators experience zero functional disruption, no need to re-read documentation, no menu code drift.

**Quality Gates (3 NFRs):**

- **NFR4:** All tests run against isolated fixture directories; bare `runScript()` calls (no `cwd`) are forbidden per `test-fixture-isolation` rule.
- **NFR5:** Before any story is marked `review`, `npm run lint` exits 0 with zero warnings in any file the story modifies, per `lint-passes-before-review` rule.
- **NFR6:** Every story passes the `code-review-convergence` rule: Round 1 mandatory; Round 2 only on HIGH findings; Round 3 only on structural changes; no Round 4. Deferred findings go to backlog.

**Compliance (3 NFRs):**

- **NFR7:** Cell-level Covenant non-regression rule (FR18): zero cells that passed in baseline audit may fail post-migration. Aggregate compliance percentage is informational; cell-level non-regression is the gate.
- **NFR8:** Every commit satisfies applicable `project-context.md` architecture rules, including but not limited to: `no-hardcoded-versions`, `no-process-cwd-in-libs`, `derive-counts-from-source`, `mechanical-research-enumeration`, `spec-verify-referenced-files`, `covenant-compliance-for-convoke-skills`, `namespace-decision-for-new-skills`, `staleness-preflight-for-backlog-pickup`.
- **NFR9:** Each converted SKILL.md story includes a Namespace decision section explaining the file's namespace placement (Convoke `_bmad/bme/` namespace), per `namespace-decision-for-new-skills` rule.

**Reference Integrity (3 NFRs):**

- **NFR10:** Reference integrity audit (FR24) covers mechanical search of: test paths, slash-command wrappers, retrospective citations, audit report citations, Compliance Checklist file references.
- **NFR11:** The reference integrity CI gate (FR25) blocks merge on any unresolved reference.
- **NFR12:** Audit reports referencing pre-migration paths must be updated atomically with each agent conversion — no creeping reference rot in methodology artifacts.

**Integration (3 NFRs):**

- **NFR13:** Marketplace install (FR28) succeeds on a clean test BMAD install via `bmad-cli install convoke-vortex` with zero install errors and all 7 agents discoverable post-install.
- **NFR14:** npm install path (`npm install convoke-agents@4.1.0`) produces operationally-equivalent agent behavior to 4.0.0.
- **NFR15:** Operator Covenant audit framework continues to be operable against converted source. Either Compliance Checklist tooling consumes new format without modification, OR the tooling is updated atomically as part of the conversion (per ADR-005 Epic 4 scope).

**Maintainability (4 NFRs):**

- **NFR16:** Pattern-C-friendly factoring applies to every `./references/<workflow>.md` file (FR10). A pre-merge Pattern-C-readiness checklist verifies each reference is structured as a complete capability prompt with no agent-internal coupling.
- **NFR17:** Atomic-by-agent commit strategy: every PR converts exactly one Vortex agent's complete dependency graph. No mixed-state commits land on `main`.
- **NFR18:** Migration tooling under `scripts/migration/format-conversion/` is reusable. Tooling for I98 (Gyre) and I99 (Team Factory) inherits the architecture without re-authoring core logic.
- **NFR19:** Rollback path remains operational: until 4.1.0 ships, npm tag `4.0.x` continues serving the v5/early-v6 format; operators can pin to 4.0.x if 4.1.0-rc surfaces issues.

### Additional Requirements

**Architectural Decisions (from architecture document + ADRs):**

- **AR1:** Per ADR-001 (hybrid naming): Each converted SKILL.md frontmatter `name:` field uses BMB canonical (e.g., `bmad-bme-agent-emma`). Slash-command wrapper directories at `.claude/skills/bmad-agent-bme-{role}/` keep current names as compatibility aliases. The `module.yaml` `agents:` array uses canonical names; `module-help.csv` `skill` column uses canonical names.
- **AR2:** Per ADR-002 (BMB-canonical conversion + fixup contract): A reusable fixup checklist artifact lives at `scripts/migration/format-conversion/fixup-checklist.md`. Per-agent BMB output review is required before merge.
- **AR3:** Per ADR-003 (three verification harnesses + shared fixture): Three separate harness components at `scripts/migration/format-conversion/{parity,covenant-survival,personality}-harness.js` with shared fixture utility library at `scripts/migration/format-conversion/fixtures/`.
- **AR4:** Per ADR-004 (atomic-by-agent + namespace): One PR per agent (`i97-{first-name}-conversion` branch). Migration tooling under `scripts/migration/format-conversion/` (function-named, reusable for I98/I99).
- **AR5:** Per ADR-005 (Covenant per-Right policy): Epic 4 spec authors the per-Right rationale matrix. ADR-005 status transitions proposed → accepted at Epic 4 spec authoring.

**Repository Structure Requirements (from architecture project structure section):**

- **AR6:** Post-migration `_bmad/bme/_vortex/` agent directories preserve role-based names (e.g., `contextualization-expert/`); only frontmatter `name:` field uses canonical (BMB) naming.
- **AR7:** Workflow source files at `_bmad/bme/_vortex/workflows/<name>/workflow.md` are NOT modified. Capability prompts at `_bmad/bme/_vortex/agents/{role}/references/<workflow-name>.md` are derived but workflow source is preserved.
- **AR8:** New ADR directory at `_bmad-output/planning-artifacts/adr/i97/` already populated with 5 ADRs.

**Tooling Stack Requirements:**

- **AR9:** New tooling components: `parity-harness.js`, `covenant-survival-harness.js`, `personality-harness.js`, fixture utilities (`tmpDir-setup.js`, `isolated-install.js`), `fixup-checklist.md`, `reference-integrity.js` (under `scripts/audit/`).
- **AR10:** New test architecture: `tests/integration/vortex-parity.test.js`, `tests/migration/covenant-survival.test.js`, `tests/migration/personality-preservation/{harness.js, fixtures/}`.
- **AR11:** CI gate additions: parity gate, Covenant survival gate, reference integrity gate.

**Process Requirements:**

- **AR12:** Per-agent PR checklist (12 items, defined in architecture document) is the binding merge gate for each `i97-{first-name}-conversion` branch.
- **AR13:** Per-agent development cycle (16 steps, defined in architecture document) is the developer-facing workflow.
- **AR14:** Code-review-convergence rule applies (R1 mandatory; R2 on HIGH; R3 on structural; no R4 per NFR6).

**Personality Rubric Requirements (from rubric spec):**

- **AR15:** The personality preservation rubric at `convoke-spec-personality-preservation-rubric.md` MUST be calibrated (status: draft → calibrated) before E1 starts. Calibration: pre-test rubric against existing 4.0 agents; all 7 agents score 4 across 7 dimensions on baseline.
- **AR16:** Pre-test outcome documents stored at `tests/migration/personality-preservation/fixtures/{role-name}/baseline-{fixed-prompt,unscripted-scenarios}.{json,md}` per agent.

**Migration Sequencing (from PRD Migration Sequencing recommendation + architecture document):**

- **AR17:** Agent conversion order: Emma (proof-of-concept) → Wade + Mila (single-capability simpler) → Isla + Noah + Max (mid-batch) → Liam (HC-schema-heaviest, last). Each agent converted in atomic-by-agent PR.

**Release Pipeline Requirements:**

- **AR18:** All 7 agent conversion PRs MUST land on `main` before 4.1.0 ship. 4.1.0 ship triggered via existing `host-framework-sync-playbook.md` Story 5A.2 outline.
- **AR19:** Marketplace re-submission PR opened against `bmad-code-org/bmad-plugins-marketplace` AFTER 4.1.0 npm tag exists (FR27, FR28).

### UX Design Requirements

**N/A — no UX design document.** I97 is a content-format migration with no UI surface (per PRD Project Classification, Step 3 Architecture N/A, Step 9 Project-Type Compliance N/A). UX-DRs are not applicable.

### FR Coverage Map

| FR | Epic | Description |
|----|------|-------------|
| FR1 | E2 | Format conversion per agent (no XML elements) |
| FR2 | E2 | Persona preservation per agent |
| FR3 | E2 | Menu code preservation per agent |
| FR4 | E2 | Activation delegation to bmad-init per agent |
| FR5 | E2 | Hybrid naming applied per agent (per ADR-001) |
| FR6 | E2 | Module.yaml agents[] entries added per-agent (cross-agent finalization on last agent's PR) |
| FR7 | E2 | Module.yaml prompts/directories — populated incrementally |
| FR8 | E2 | Module-help.csv rows added per-agent (cross-agent finalization on last agent's PR) |
| FR9 | E2 | references/{workflow}.md authored per agent |
| FR10 | E2 | Pattern-C-friendly factoring per references/ file |
| FR11 | E2 | Capability routing in agent's ## Capabilities table |
| FR12 | E2 | Workflow source unchanged (verified per agent PR) |
| FR13 | E2+E3 | Parity tests added per agent (E2 operator-driven); CI gate productionized (E3) |
| FR14 | E2+E3 | Workflow path parity per agent + CI gate |
| FR15 | E2+E3 | Output filename parity per agent + CI gate |
| FR16 | E1+E2+E3 | Fixture pattern (E1 scaffold); per-agent invocation (E2); CI gate (E3) |
| FR17 | E4 | Covenant survival audit harness execution (per-Right matrix-driven) |
| FR18 | E4 | Cell-level non-regression rule applied |
| FR19 | E4 | Per-cell pass/fail report |
| FR20 | E4 | Legitimately-invalidated cells flagged per per-Right matrix |
| FR21 | E1+E2 | Rubric calibration baseline (E1, against Emma + Liam dissimilar pair); per-agent baselines (E2 within each agent's story) |
| FR22 | E1+E2 | Rubric calibration scenarios (E1); per-agent scenarios (E2) |
| FR23 | E1+E2 | Rubric calibrated (E1); operator scoring per agent (E2) |
| FR24 | E1+E2+E3 | Script authored (E1); per-agent invocation (E2); CI gate productionized (E3) |
| FR25 | E2+E3 | CI gate per PR (E2 operator-driven); productionized (E3) |
| FR26 | E5 | marketplace.json verified at internal release readiness |
| FR27 | E6 | Re-submitted PR to bmad-plugins-marketplace |
| FR28 | E6 | bmad-cli install convoke-vortex succeeds end-to-end |
| FR29 | E5 | 4.1.0 release tag |
| FR30 | E5 | CHANGELOG entry |
| FR31 | E5 | npm publish |
| FR32 | E5 | GitHub release |

**All 32 FRs mapped. ✓**

## Epic List

### Epic 1: Migration Foundation Ready

**Goal:** Operator can begin per-agent migrations safely. Tooling scaffolds exist, the personality preservation rubric is calibrated against dissimilar-personality agents, the reference integrity check is authored. Migration infrastructure is in place; nothing has been migrated yet.

**FRs covered:** FR16 (fixture pattern scaffolded), FR21-23 (rubric calibrated against Emma + Liam — dissimilar-personality pairing recommended for robust dimension coverage), FR24 (reference integrity script authored)

**ARs covered:** AR2 (fixup checklist authored), AR3 (verification harness scaffolds + shared fixture library), AR9 (new tooling components scaffolded), AR10 (test architecture scaffolds), AR15 (rubric pre-tested + transitions draft → calibrated)

**NFRs addressed:** NFR4 (test-fixture-isolation), NFR8 (project-context.md rules)

**Refinements applied:**
- **Murat #1:** Calibration tests against ≥2 dissimilar agents (Emma curious-clarifying + Liam persistent-challenge). E1 outcome explicitly acknowledges: rubric may require re-calibration during E2 if Liam-class scoring ambiguity surfaces in mid-batch agents — plan story slack accordingly.

**Story count:** ~2

### Epic 2: Vortex Agent Conversions Complete

**Goal:** All 7 Vortex agents converted in atomic-by-agent PRs per ADR-004. Each PR includes baseline capture + format conversion + post-migration capture + operator scoring. Sequenced per AR17 (Emma → Wade/Mila → Isla/Noah/Max → Liam).

**FRs covered:** FR1-12 (format conversion + capability routing per agent), FR13-16 (per-agent parity tests), FR21-23 (per-agent baseline + post-migration + scoring), FR24-25 (per-agent reference integrity invocation), FR6-8 (manifest entries added incrementally per agent)

**ARs covered:** AR1 (hybrid naming applied per agent), AR4 (atomic-by-agent commit pattern), AR6 (role-based directory preserved), AR7 (workflow source unchanged), AR12 (per-agent PR checklist binding), AR13 (per-agent dev cycle), AR16 (baseline fixtures per agent), AR17 (migration sequencing)

**NFRs addressed:** NFR1-3 (behavioral preservation), NFR5 (lint), NFR6 (code-review-convergence), NFR9 (namespace decision in story), NFR16 (Pattern-C-friendly), NFR17 (atomic-by-agent), NFR19 (rollback path preserved)

**Refinements applied:**
- **Bob #1:** Sprint 1 commits only E1 + Emma's E2 story (1 agent). Remaining 6 agent commits depend on Emma calibration data emerging — sprint-planning sequencing surfaces only after Emma's actual effort is known.
- **Amelia #1:** Per-agent story spec template includes a **"Within-PR sequencing"** subsection naming the order of ~15 activities + natural commit points (even when final merge is squash-and-merge per ADR-004).

**Story count:** 7 (one per agent)

### Epic 3: CI Gate Productionization

**Goal:** Operator-driven verification harnesses (used in E2) productionized into automated CI merge gates. Reusable for I98/I99 per NFR18.

**FRs covered:** FR13-16 (parity gate productionized), FR24-25 (reference integrity gate productionized)

**ARs covered:** AR11 (CI gate additions: parity gate + reference integrity gate)

**NFRs addressed:** NFR10-12 (reference integrity)

**Refinements applied:**
- **Bob #2:** E3 scaffolding may begin during E2 (parallel with mid-E2 stories — likely after Emma + Wade/Mila land); final productionization happens after the last E2 PR lands (Liam closes E2). Stories may begin pre-final-E2 but cannot complete until E2 finalizes.
- **Amelia #2:** First E3 story = 1-day spike on existing CI structure (read existing YAML, identify reuse points, identify new-config surface). Subsequent E3 stories estimate against spike findings rather than blind estimates.

**Story count:** ~3 (1 spike + 2 productionization)

### Epic 4: Operator Covenant Survival

**Goal:** Post-migration Covenant compliance verified. Per-Right matrix authored (transitions ADR-005 proposed → accepted). Cell-level non-regression rule verified across all converted agents. No cell that passed in baseline (A26 + predecessors) regresses to failing post-migration.

**FRs covered:** FR17-20 (Covenant survival audit — harness execution + cell-level reports + per-Right matrix-driven re-audit + flag legitimately-invalidated cells)

**ARs covered:** AR5 (Covenant per-Right matrix authoring; ADR-005 transitions proposed → accepted)

**NFRs addressed:** NFR7 (cell-level non-regression rule enforced), NFR15 (Covenant audit framework operable against converted source)

**Refinements applied:**
- **Murat #2:** Per-Right matrix authoring starts after 2-3 agents converted (not after all 7). Cell re-audit completes after all 7 land. Pipelined earlier — gives release gate more slack.

**Story count:** ~2 (per-Right matrix + cell re-audit)

### Epic 5: Internal Release (4.1.0 to npm + GitHub)

**Goal:** Operator-controllable ship. 4.1.0 tag + CHANGELOG + npm publish + GitHub release. Final Covenant non-regression report verified at ship gate (E4 cell re-audit complete).

**FRs covered:** FR26 (marketplace.json verified), FR29-32 (release pipeline — 4.1.0 tag, CHANGELOG, npm publish, GitHub release)

**ARs covered:** AR18 (all 7 agent PRs landed before ship)

**NFRs addressed:** NFR14 (npm install operationally-equivalent to 4.0.0 — verified via parity tests)

**Story count:** ~2

### Epic 6: Marketplace Acceptance

**Goal:** Marketplace channel restored. Re-submission PR opened against `bmad-code-org/bmad-plugins-marketplace` post-4.1.0-tag; reviewer cycle + acceptance + I95 smoke-test absorption (post-install verification).

**FRs covered:** FR27-28 (marketplace re-submission + install simulator)

**ARs covered:** AR19 (marketplace re-submission after npm tag)

**NFRs addressed:** NFR13 (marketplace install end-to-end), I95 absorption (check #1 = post-install smoke-test in this epic)

**Refinements applied:**
- **Bob #3:** **Trickle epic with reviewer-cycle latency, scheduled outside sprint cadence.** Re-submission PR opened post-4.1.0-tag; reviewer cycle is partially out of operator control (days/weeks unknown latency). Operator-perceived progress: PR opened (immediate) → reviewer feedback (latency) → acceptance + smoke-test absorption (final). E6 is structurally distinct from E5 (operator-controllable vs reviewer-dependent) but explicitly marked as not-fitting-sprint-cadence. Bob will not schedule E6 stories in standard sprints; tracked as background work item.

**Story count:** ~1 (with built-in expectation of unbounded reviewer-cycle latency)

---

## Epic Sequencing

```
E1 (Foundation) → E2 (per-agent conversions) → (E3 ‖ E4) → E5 (internal release) → E6 (marketplace acceptance, trickle)
```

**Pipelining notes:**
- E3 scaffolding may begin during E2 (post-Emma+Wade+Mila); final productionization gates on E2 close
- E4 per-Right matrix authoring may begin after 2-3 E2 conversions complete (not all 7)
- E5 ship-gate verifies E4 cell re-audit complete + E3 CI gates green + all 7 E2 PRs landed
- E6 begins post-E5; trickle progress; not in sprint cadence

**Sprint 1 capacity commitment:** E1 (~2 stories) + E2 Emma story only (1 story). Remaining 6 E2 stories committed Sprint 2+ based on Emma's calibration data.

---

## Epic 1: Migration Foundation Ready

Operator can begin per-agent migrations safely. Tooling scaffolds + rubric calibrated against dissimilar-personality pair (Emma + Liam) per Murat #1.

### Story 1.1: Migration Tooling Foundation Scaffolded

As a Convoke maintainer (operator),
I want the migration tooling foundation scaffolded under `scripts/migration/format-conversion/`,
So that per-agent conversions in E2 have the harness infrastructure they depend on, and I98/I99 can reuse the same tooling per NFR18.

**Acceptance Criteria:**

**Given** the I97 migration begins
**When** I view `scripts/migration/format-conversion/`
**Then** the directory exists with `README.md`, `fixup-checklist.md`, `fixtures/{tmpDir-setup,isolated-install}.js`, `parity-harness.js`, `covenant-survival-harness.js`, `personality-harness.js`
**And** `scripts/audit/reference-integrity.js` is also authored

**Given** the harnesses are scaffolded
**When** any harness is invoked in tests
**Then** it follows `test-fixture-isolation` rule (passes `{ cwd: tmpDir }` per NFR4)

**Given** `fixup-checklist.md` is authored per ADR-002
**When** I read it
**Then** it documents: persona preservation (no drift on long agents), hardcoded error-string preservation (Operator Covenant fail-loud signal per OC-R3), capability menu code preservation, workflow file path preservation per FR12

**Given** the reference integrity script runs
**When** I execute it against the current 4.0 codebase
**Then** it reports zero broken references (baseline state established for FR24)
**And** harness scaffolds compile/load without runtime errors when imported

**And** namespace decision section in story spec confirms files placed in `scripts/migration/format-conversion/` (function-named per ADR-004; reusable for I98/I99)

### Story 1.2: Personality Rubric Calibration via Dissimilar-Personality Pair

As a Convoke maintainer,
I want the personality preservation rubric calibrated against Emma (curious-clarifying) + Liam (persistent-challenge) on the 4.0 baseline,
So that scoring criteria are validated as distinguishable in practice across dissimilar personalities before E2 begins per Murat #1.

**Acceptance Criteria:**

**Given** the rubric exists at `convoke-spec-personality-preservation-rubric.md` with status `draft`
**When** baseline samples are captured for Emma + Liam on the 4.0 codebase per FR21-22
**Then** transcripts are stored at `tests/migration/personality-preservation/fixtures/{contextualization-expert,hypothesis-engineer}/baseline-{fixed-prompt,unscripted-scenarios}.{json,md}`

**Given** baselines are captured
**When** the operator scores Emma + Liam against the rubric across 7 dimensions
**Then** both agents score 4 (Clearly Preserved) on all 7 dimensions (rubric calibration target)

**Given** any dimension scores < 4 on baseline (calibration miss)
**When** the rubric is re-calibrated (refining criteria, adjusting fingerprints, or expanding evidence sources)
**Then** the iteration is documented in the rubric's revisions section, and re-scoring proceeds until both agents score 4 on all 7 dimensions

**Given** calibration succeeds
**When** the rubric file frontmatter is updated
**Then** status transitions `draft` → `calibrated`

**And** the rubric explicitly notes which dimensions were calibration-tested (Emma + Liam) and which remain mid-batch-validation-pending (Wade, Mila, Isla, Noah, Max). E2 stories carry explicit slack expectation: rubric may require re-calibration if Liam-class scoring ambiguity surfaces in mid-batch agents.

**And** per Mary #2 explicit gating: **E2 stories may not begin until Story 1.1 + Story 1.2 are both marked `done`.** This story (1.2) gates Story 2.1 (Emma) start; Story 1.1 (tooling foundation) is the prerequisite for Story 1.2 (rubric calibration uses tooling). Sprint planning must enforce this gate; no E2 story enters in-progress state until both E1 stories close.

---

## Epic 2: Vortex Agent Conversions Complete

Per ADR-004 atomic-by-agent commit pattern. 7 stories — one per agent. Sequenced per AR17: Emma (proof-of-concept) → Wade + Mila (single-capability simpler) → Isla + Noah + Max (mid-batch) → Liam (HC-schema-heaviest, last; finalizes manifests).

### Within-PR Sequencing (applies to all E2 stories)

Per Amelia #1 refinement, each per-agent PR follows this sequence with natural commit points (squash-and-merge at end per ADR-004):

1. Capture pre-migration baseline (fixed-prompt Q&A + unscripted multi-turn) — natural commit point
2. Run BMB conversion tooling (`bmad-agent-builder` + `bmad-workflow-builder` `build-process` "convert" mode) — natural commit point
3. Apply fixup checklist to BMB output (per ADR-002) — natural commit point
4. Author capability prompts (`./references/<workflow-name>.md`) per Pattern-C-friendly factoring — natural commit point
5. Update `module.yaml` agents[] entry + `module-help.csv` row — natural commit point
6. Update slash-command wrapper at `.claude/skills/bmad-agent-bme-{role}/SKILL.md` — natural commit point
7. Add per-agent parity tests + fixture data — natural commit point
8. Capture post-migration samples + obtain operator scoring — natural commit point
9. Refresh audit report citations atomically (per NFR12) — natural commit point
10. Run reference integrity check + lint locally — natural commit point
11. Open PR with per-agent checklist as PR template body; CI gates run; squash-and-merge per ADR-004

### Failure Handling Pattern (applies to all E2 stories)

Per Quinn #1 refinement, each E2 story implicitly inherits this failure-handling pattern. Negative-case ACs are not duplicated per story; they're defined once here:

**Failure mode 1: BMB conversion produces invalid v6.3+ markdown.**
- Detection: lint fails OR test load fails OR fixup checklist review surfaces structural issue
- Escalation: invoke `bmad-correct-course` skill to determine whether issue is BMB tooling bug (file upstream issue) OR fixup-checklist gap (amend ADR-002 checklist)
- Rollback: PR remains in draft state until issue resolved; no merge against partial conversion

**Failure mode 2: Fixup checklist application misses persona drift.**
- Detection: post-migration personality scoring identifies "degraded" rating on any dimension (FR23 disconfirmation)
- Escalation: re-apply BMB conversion + targeted fixup; OR if persona-drift surfaces a rubric ambiguity, re-calibrate rubric per Story 1.2 process
- Rollback: PR not mergeable until rubric scoring shows ≥ 2 on all 7 dimensions

**Failure mode 3: Parity tests pass but personality scoring fails.**
- Detection: parity-harness.js green; personality-harness.js operator-ranking surfaces ≥ 1 dimension at score 1
- Escalation: targeted persona-fix application via fixup checklist (PRD Improvement 2's "fixup-then-rescore" loop)
- Rollback: per FR23, ANY agent ranked degraded blocks merge regardless of parity test passage

**Failure mode 4: CI gate (parity / Covenant survival / reference integrity) fails post-merge attempt.**
- Detection: CI status check red on PR
- Escalation: if gate failure is legitimate regression, fix locally and re-push; if gate failure exposes harness bug (false positive), file backlog item AND fix harness
- Rollback: per ADR-004 atomic-by-agent commit pattern, no PR merges with red CI gates

**Failure mode 5: Operator unavailable for personality scoring (Story 2.M blocked on operator time).**
- Detection: PR sitting in review state >3 days awaiting operator scoring
- Escalation: explicit re-prioritization conversation; consider deferring to next-sprint window if operator-time constrained
- Rollback: PR not mergeable until operator scoring complete (no automated bypass per FR23 disconfirmation gate)

**Reference in stories:** each E2 story's final AC is "Failure handling follows the Epic 2 Failure Handling Pattern (Modes 1-5 above) — story may not merge until any encountered failure mode is resolved per its escalation/rollback path."

### Story 2.1: Convert Emma (contextualization-expert) — Proof-of-Concept

**Variance commentary:** This is the proof-of-concept story. **Calibrates downstream estimates against actuals.** May take 2-3x estimated effort. **Sprint 1 commits THIS story only**; subsequent E2 stories committed Sprint 2+ based on Emma's actual effort emergence.

As a Convoke maintainer,
I want Emma's SKILL.md migrated from v5/early-v6 XML-in-markdown to v6.3+ outcome-based markdown with full atomic-by-agent dependency graph,
So that Emma works in v6.3+ format and is marketplace-eligible while operators experience zero re-learning per Journey 1.

**Acceptance Criteria:**

**Given** Emma's pre-migration SKILL.md
**When** baseline samples are captured per FR21-22
**Then** transcripts are stored at `tests/migration/personality-preservation/fixtures/contextualization-expert/baseline-*.{json,md}` (note: this story may reuse Story 1.2 baseline if already captured)

**Given** the BMB conversion tooling runs against Emma's SKILL.md
**When** the converted SKILL.md is reviewed against the fixup checklist (ADR-002)
**Then** all checklist items pass (persona preserved, fail-loud signal preserved, menu codes LP/PV/CS/VL/PM preserved, workflow file paths unchanged)

**Given** Emma's converted SKILL.md
**When** I inspect it
**Then** the file contains zero XML elements (FR1) and contains v6.3+ sections per BMB `standard-fields.md` (Identity, Communication Style, Principles, On Activation, Capabilities)

**Given** the converted SKILL.md frontmatter
**When** I inspect the `name:` field
**Then** it equals `bmad-bme-agent-emma` (per ADR-001 hybrid naming)

**Given** Emma's capability prompts at `_bmad/bme/_vortex/agents/contextualization-expert/references/{lean-persona,product-vision,contextualize-scope,validate-context}.md`
**When** I inspect each
**Then** each contains Identity + How It Works + Output Expectations + Activation sections (Pattern-C-friendly per FR10) and is structured to be promotable to a standalone workflow skill (relocate-and-rename, not re-author)

**Given** Emma's `## Capabilities` table
**When** I inspect each route
**Then** routes use BMB `Load \`./references/{cap}.md\`` convention (FR11)

**Given** workflow source files at `_bmad/bme/_vortex/workflows/{lean-persona,product-vision,contextualize-scope}/workflow.md`
**When** I diff against pre-migration
**Then** they are unchanged (FR12)

**Given** `_bmad/bme/_vortex/module.yaml`
**When** I inspect the `agents:` array
**Then** an entry for Emma with `code: bmad-bme-agent-emma`, `name: Emma`, `title: Contextualization Expert`, `icon: 🎯`, `team: vortex`, `description: ...` is present (FR6, FR7)

**Given** `_bmad/bme/_vortex/module-help.csv`
**When** I inspect the rows
**Then** an entry for `bmad-bme-agent-emma` with canonical BMM column ordering is present (FR8)

**Given** `.claude/skills/bmad-agent-bme-contextualization-expert/SKILL.md` (alias wrapper)
**When** I inspect it
**Then** it points at the converted SKILL.md per ADR-001 alias layer

**Given** parity tests for Emma exist at `tests/integration/vortex-parity.test.js`
**When** I run them
**Then** all pass: identical menu codes pre/post (FR13), identical workflow paths invoked (FR14), identical output filenames (FR15), all invocations pass `{ cwd: tmpDir }` per `test-fixture-isolation` (NFR4 + FR16)

**Given** post-migration samples are captured
**When** the operator scores Emma against the calibrated rubric
**Then** Emma scores ≥ 2 on all 7 dimensions, with no dimension at 1 (Degraded) per FR23 disconfirmation threshold

**Given** audit reports referencing Emma's files
**When** I inspect them post-migration
**Then** all citations are refreshed atomically within this PR (NFR12)

**Given** the reference integrity check runs against the project tree
**When** the post-PR state is checked
**Then** zero broken references (FR24-25, NFR11)

**Given** the PR is opened
**When** `npm run lint` runs
**Then** exits 0 with zero warnings on files modified by this story (NFR5)

**Given** the per-agent PR checklist (12 items per architecture document)
**When** each item is checked
**Then** all are satisfied before merge

**And** namespace decision section confirms files in Convoke `_bmad/bme/` namespace (NFR9)

**And** failure handling follows the Epic 2 Failure Handling Pattern (Modes 1-5 above) — story may not merge until any encountered failure mode is resolved per its escalation/rollback path

### Story 2.2: Convert Wade (lean-experiments-specialist)

**Variance commentary:** Per Bob #1 recalibration: 5 capabilities vs Emma's 4 (+25% capability count) but 2nd-pass tooling efficiency expected to absorb the difference. **Estimate close to Emma's actual, not lower.** Tooling maturation reduces overhead per capability prompt authoring; capability count drives proportional work. Net: Wade ≈ Emma in effort, not lower.

As a Convoke maintainer,
I want Wade's SKILL.md migrated from v5/early-v6 XML-in-markdown to v6.3+ outcome-based markdown with full atomic-by-agent dependency graph,
So that Wade works in v6.3+ format and is marketplace-eligible.

**Per-agent specifics:**

- **Canonical name:** `bmad-bme-agent-wade`
- **Persona fingerprint:** Action-bias with experimentation discipline; smallest validating experiment over comprehensive research; refuses to scope experiments larger than necessary.
- **Capability count:** 5 capabilities → 5 `references/*.md` files
- **Menu codes:** ME (mvp), LE (lean-experiment), PC (proof-of-concept), PV (proof-of-value), VE (validate-mvp)
- **Workflow source files:** `_bmad/bme/_vortex/workflows/{mvp,lean-experiment,proof-of-concept,proof-of-value}/workflow.md` + `mvp/validate.md`
- **Capability prompt files (new):** `references/{mvp,lean-experiment,proof-of-concept,proof-of-value,validate-mvp}.md`
- **Agent-specific divergence:** None — single-capability-per-workflow agent; conversion patterns identical to Emma after BMB tooling maturation.
- **Rubric re-calibration trigger:** if mid-batch scoring ambiguity surfaces against rubric, pause + re-calibrate per Story 1.2 process.

**Acceptance Criteria:** Per Within-PR Sequencing (Epic 2 header) — structural AC pattern matches Story 2.1, applied to Wade's specifics above.

**And** Wade's converted SKILL.md frontmatter `name:` field equals `bmad-bme-agent-wade`
**And** Wade's 5 capability prompts are present at `_bmad/bme/_vortex/agents/lean-experiments-specialist/references/`
**And** Wade scores ≥ 2 on all 7 personality preservation dimensions per FR23

### Story 2.3: Convert Mila (research-convergence-specialist)

**Variance commentary:** Single-capability simpler agent. Similar profile to Wade.

**Per-agent specifics:**

- **Canonical name:** `bmad-bme-agent-mila`
- **Persona fingerprint:** Synthesis-oriented; triangulation across diverse sources; comfortable holding contradictions; identifies emerging patterns.
- **Capability count:** 3 capabilities → 3 `references/*.md` files
- **Menu codes:** RC (research-convergence), PR (pivot-resynthesis), PA (pattern-mapping)
- **Workflow source files:** `_bmad/bme/_vortex/workflows/{research-convergence,pivot-resynthesis,pattern-mapping}/workflow.md`
- **Capability prompt files (new):** `references/{research-convergence,pivot-resynthesis,pattern-mapping}.md`
- **Agent-specific divergence:** Synthesis logic in capability prompts may need careful preservation (triangulation patterns, contradiction-holding) — fixup checklist application requires extra scrutiny on persona dimension.
- **Rubric re-calibration trigger:** if Mila scoring surfaces ambiguity (especially around D5 Failure Handling — she has distinctive uncertainty-acknowledgment patterns), pause + re-calibrate.

**Acceptance Criteria:** Per Within-PR Sequencing — structural AC pattern matches Story 2.1, applied to Mila's specifics above.

**And** Mila's converted SKILL.md frontmatter `name:` field equals `bmad-bme-agent-mila`
**And** Mila's 3 capability prompts are present at `_bmad/bme/_vortex/agents/research-convergence-specialist/references/`
**And** Mila scores ≥ 2 on all 7 personality preservation dimensions per FR23

### Story 2.4: Convert Isla (discovery-empathy-expert)

**Variance commentary:** Mid-batch agent. Use accumulated tooling improvements from prior stories.

**Per-agent specifics:**

- **Canonical name:** `bmad-bme-agent-isla`
- **Persona fingerprint:** Empathy-driven, evidence-respecting; probes for user emotions and felt experience; distinguishes "what users say" from "what users do."
- **Capability count:** 4 capabilities → 4 `references/*.md` files
- **Menu codes:** EM (empathy-map), UI (user-interview), UD (user-discovery), VE (validate-empathy)
- **Workflow source files:** `_bmad/bme/_vortex/workflows/{empathy-map,user-interview,user-discovery}/workflow.md` + `empathy-map/validate.md`
- **Capability prompt files (new):** `references/{empathy-map,user-interview,user-discovery,validate-empathy}.md`
- **Agent-specific divergence:** Capability prompts shaped around empathy patterns + user-research methodology; output expectations differ from Emma's contextualization framing (e.g., empathy maps vs lean personas).
- **Rubric re-calibration trigger:** if Isla scoring surfaces ambiguity around D4 Conversational Signals (her empathy-probing patterns), pause + re-calibrate.

**Acceptance Criteria:** Per Within-PR Sequencing — structural AC pattern matches Story 2.1, applied to Isla's specifics above.

**And** Isla's converted SKILL.md frontmatter `name:` field equals `bmad-bme-agent-isla`
**And** Isla's 4 capability prompts are present at `_bmad/bme/_vortex/agents/discovery-empathy-expert/references/`
**And** Isla scores ≥ 2 on all 7 personality preservation dimensions per FR23

### Story 2.5: Convert Noah (production-intelligence-specialist)

**Variance commentary:** Mid-batch agent.

**Per-agent specifics:**

- **Canonical name:** `bmad-bme-agent-noah`
- **Persona fingerprint:** Pragmatic, evidence-from-production; distinguishes signal from noise; respects what production data actually shows vs what we wish it said.
- **Capability count:** 3 capabilities → 3 `references/*.md` files
- **Menu codes:** SI (signal-interpretation), BA (behavior-analysis), MO (production-monitoring)
- **Workflow source files:** `_bmad/bme/_vortex/workflows/{signal-interpretation,behavior-analysis,production-monitoring}/workflow.md`
- **Capability prompt files (new):** `references/{signal-interpretation,behavior-analysis,production-monitoring}.md`
- **Agent-specific divergence:** Capability prompts reference production data sources; operator-input shape differs from user-research agents (Emma/Isla) — input is production observations, not user feedback.
- **Rubric re-calibration trigger:** if Noah scoring surfaces ambiguity around D2 Communication Style (his pragmatic-evidence-driven tone vs more inquisitive agents), pause + re-calibrate.

**Acceptance Criteria:** Per Within-PR Sequencing — structural AC pattern matches Story 2.1, applied to Noah's specifics above.

**And** Noah's converted SKILL.md frontmatter `name:` field equals `bmad-bme-agent-noah`
**And** Noah's 3 capability prompts are present at `_bmad/bme/_vortex/agents/production-intelligence-specialist/references/`
**And** Noah scores ≥ 2 on all 7 personality preservation dimensions per FR23

### Story 2.6: Convert Max (learning-decision-expert)

**Variance commentary:** Mid-batch agent.

**Per-agent specifics:**

- **Canonical name:** `bmad-bme-agent-max`
- **Persona fingerprint:** Decision-frame applied to learning; connects insights to action; resists "interesting but useless" findings.
- **Capability count:** 4 capabilities → 4 `references/*.md` files
- **Menu codes:** LC (learning-card), PP (pivot-patch-persevere), VN (vortex-navigation), VE (validate-learning)
- **Workflow source files:** `_bmad/bme/_vortex/workflows/{learning-card,pivot-patch-persevere,vortex-navigation}/workflow.md` + `learning-card/validate.md`
- **Capability prompt files (new):** `references/{learning-card,pivot-patch-persevere,vortex-navigation,validate-learning}.md`
- **Agent-specific divergence:** Decision-tree-shaped capability prompts (output: decision recommendations); navigation capability (VN) is cross-stream — references Vortex framework as a whole.
- **Rubric re-calibration trigger:** if Max scoring surfaces ambiguity around D7 Output Format Consistency (his decision-card structure), pause + re-calibrate.

**Acceptance Criteria:** Per Within-PR Sequencing — structural AC pattern matches Story 2.1, applied to Max's specifics above.

**And** Max's converted SKILL.md frontmatter `name:` field equals `bmad-bme-agent-max`
**And** Max's 4 capability prompts are present at `_bmad/bme/_vortex/agents/learning-decision-expert/references/`
**And** Max scores ≥ 2 on all 7 personality preservation dimensions per FR23

### Story 2.7: Convert Liam (hypothesis-engineer) — HC-Schema-Heaviest, Closes E2

**Variance commentary:** HC-schema-heaviest agent (owns HC1-HC5 contract enumeration). Per Bob #2 recalibration: **Liam's 3 capabilities + HC1-HC5 contract surface = ~1.5x Emma baseline effort**, not lower-than-Emma despite lower capability count. HC routing represents ~5+ items of structural verification work beyond standard agent conversion. **May require multi-PR sequencing if HC-heavy fixup work surfaces** — atomic-by-agent commit pattern preserved (per ADR-004), but split-into-sequential-PRs acceptable if HC verification effort exceeds standard story scope. **Last E2 story; cross-agent manifest finalization happens here.** Estimate against Emma's actuals × 1.5 baseline.

As a Convoke maintainer,
I want Liam's SKILL.md migrated from v5/early-v6 XML-in-markdown to v6.3+ outcome-based markdown with full atomic-by-agent dependency graph + cross-agent manifest finalization,
So that Liam works in v6.3+ format AND all 7 agents are present in module.yaml + module-help.csv + marketplace.json.

**Acceptance Criteria:**

**Per-agent specifics:**

- **Canonical name:** `bmad-bme-agent-liam`
- **Persona fingerprint:** Persistent challenge-posing; falsifiability-driven; treats every claim as a hypothesis until tested; curious about disconfirmation evidence.
- **Capability count:** 3 capabilities → 3 `references/*.md` files
- **Menu codes:** HE (hypothesis-engineering), AM (assumption-mapping), ED (experiment-design)
- **Workflow source files:** `_bmad/bme/_vortex/workflows/{hypothesis-engineering,assumption-mapping,experiment-design}/workflow.md`
- **Capability prompt files (new):** `references/{hypothesis-engineering,assumption-mapping,experiment-design}.md`
- **Agent-specific divergence:** **HC1-HC5 contract enumeration** — Liam owns hypothesis-contract routing logic (HC1: empathy artifacts, HC2: problem definition, HC3: hypothesis contract, HC4: experiment context, HC5: signal report). Conversion preserves the most complex schema-routing logic; fixup checklist application requires HC-aware review beyond the standard checklist items.
- **Rubric re-calibration trigger:** Liam's persistent-challenge fingerprint already validated in E1 Story 1.2 calibration; lower re-calibration risk than mid-batch agents. Multi-PR sequencing acceptable per per-agent variance commentary if HC-heavy fixup work surfaces.

**Acceptance Criteria:** Per Within-PR Sequencing — structural AC pattern matches Story 2.1, applied to Liam's specifics above. Plus HC-routing preservation as additional load-bearing AC.

**And** Liam's converted SKILL.md frontmatter `name:` field equals `bmad-bme-agent-liam`
**And** Liam's 3 capability prompts are present at `_bmad/bme/_vortex/agents/hypothesis-engineer/references/`
**And** Liam's HC1-HC5 routing logic is preserved (verified against pre-migration HC routing patterns in agent's behavior post-conversion)

**Given** all 7 agent PRs (Emma + Wade + Mila + Isla + Noah + Max + Liam) have landed on `main`
**When** I inspect `_bmad/bme/_vortex/module.yaml`
**Then** the `agents:` array contains all 7 entries with canonical names + name + title + icon + team + description

**Given** `_bmad/bme/_vortex/module-help.csv`
**When** I inspect the rows
**Then** all 7 agent rows are present with canonical BMM column ordering

**Given** `.claude-plugin/marketplace.json`
**When** I inspect the `skills:` array
**Then** all 7 paths point at converted agent directories under `_bmad/bme/_vortex/agents/<role>/` (FR26)

**And** if HC-heavy fixup surfaces > expected effort, story split into multi-PR sequence is acceptable per per-agent variance commentary

---

## Epic 3: CI Gate Productionization

Operator-driven harnesses (used in E2) productionized into automated CI merge gates. Reusable for I98/I99 per NFR18.

### Story 3.1: CI Infrastructure Spike

As a Convoke maintainer,
I want a 1-day spike on existing CI structure to identify reuse points and new-config surface,
So that subsequent E3 stories estimate against actual findings rather than blind assumptions per Amelia #2.

**Acceptance Criteria:**

**Given** existing CI YAML configs at `.github/workflows/`
**When** I read them and document patterns
**Then** I produce a spike report at `_bmad-output/implementation-artifacts/i97-ci-spike.md` documenting:
- Extensible patterns (e.g., shared workflow includes, reusable workflows)
- Constraint patterns (e.g., shared secrets, runner pools, concurrency limits)
- New-config surface required for I97 gates (parity, Covenant survival, reference integrity)

**Given** the spike report is authored
**When** Stories 3.2 + 3.3 are scoped
**Then** estimates derive from the spike findings (not blind assumptions)

**And** the spike completes within 1 dev-day operator time budget

### Story 3.2: Productionize Parity + Covenant Gates

As a Convoke maintainer,
I want the parity test suite + Covenant survival audit harness automated as CI merge gates,
So that every PR (in I97 + future I98/I99) is automatically blocked from merging if behavioral parity or Covenant survival regresses.

**Acceptance Criteria:**

**Given** parity-harness.js exists per ADR-003
**When** the CI pipeline is configured per the spike findings (Story 3.1)
**Then** the parity test suite runs as a CI gate that blocks merge on any test failure (FR13-15, NFR1)

**Given** covenant-survival-harness.js exists
**When** the CI pipeline is configured
**Then** the Covenant survival audit runs as a CI gate that blocks merge on any cell-level non-regression rule violation (FR17-20, NFR7)

**Given** the gates are productionized
**When** they run against the post-E2-completion state
**Then** all 7 agents pass parity + Covenant survival gates

**And** gates run against isolated fixture directories per `test-fixture-isolation` rule (NFR4)
**And** gate configuration is reusable for I98 / I99 with minimal changes (NFR18)

### Story 3.3: Productionize Reference Integrity Gate

As a Convoke maintainer,
I want the reference integrity check automated as a CI merge gate,
So that broken cross-references can never ship to users (FR24-25, NFR11).

**Acceptance Criteria:**

**Given** reference-integrity.js exists at `scripts/audit/reference-integrity.js` (authored in Story 1.1)
**When** the CI pipeline is configured per spike findings
**Then** reference integrity runs as a CI gate that blocks merge on any unresolved reference

**Given** the gate runs
**When** it scans the project tree
**Then** coverage includes all 5 reference categories per NFR10: test paths, slash-command wrappers, retro citations, audit report citations, Compliance Checklist file references

**Given** the gate is productionized
**When** an intentional broken reference is introduced (test fixture)
**Then** the gate fails the build with an actionable error message identifying the broken reference's location

**And** the gate runs against the full project tree (not just changed files) so cross-cutting reference rot is caught

---

## Epic 4: Operator Covenant Survival

Per Murat #2, per-Right matrix authoring starts after 2-3 E2 conversions. Cell re-audit pipelines with E5 release-readiness.

### Story 4.1: Per-Right Covenant Matrix Authoring

As a Convoke maintainer,
I want the per-Right (OC-R1..R7) Covenant baseline-validity matrix authored,
So that the Operator Covenant survival audit harness has clear rationale for which Rights re-audit and which declare baseline valid per ADR-005.

**Acceptance Criteria:**

**Given** at least 2-3 E2 agent conversions have completed (Murat #2 — pipelined start; not all 7 required)
**When** I author the per-Right matrix
**Then** the document at `_bmad-output/planning-artifacts/i97-covenant-per-right-matrix.md` contains a row per OC-R1..R7 with:
- Right identifier (OC-R1..R7)
- Cell type (format-dependent / structural / semantic per ADR-005 categorization)
- Decision (re-audit / declare-valid)
- Explicit rationale citing the Right's audit pattern

**Given** the per-Right matrix exists
**When** ADR-005 status is updated
**Then** it transitions `proposed` → `accepted` with a Status section reference to the matrix

**Given** the matrix authoring completes
**When** the document is published
**Then** it cites: ADR-005 + Compliance Checklist + relevant baseline audits (notably A26 Vortex HC-cluster)

**And** the matrix is reviewed via code-review-convergence rule (R1 mandatory; R2 on HIGH; R3 on structural; no R4 per NFR6)

### Story 4.2: Covenant Cell Re-Audit Execution

As a Convoke maintainer,
I want the Covenant survival audit harness execute the per-Right matrix against all 7 converted agents,
So that cell-level non-regression rule is verified per FR17-20, NFR7.

**Acceptance Criteria:**

**Given** the per-Right matrix exists (Story 4.1) AND all 7 E2 agent conversions have landed
**When** covenant-survival-harness.js executes
**Then** it produces a per-cell pass/fail report at `_bmad-output/implementation-artifacts/i97-covenant-survival-report-{date}.md` (FR19)

**Given** the cell-level non-regression rule (FR18, NFR7)
**When** I inspect the report
**Then** zero cells that passed in baseline (A26 + predecessors) regress to failing post-migration

**Given** any cell where format change legitimately invalidates the baseline
**When** I inspect the report
**Then** such cells are flagged for explicit re-evaluation per the per-Right matrix's "declare-valid" rationale (FR20)

**Given** flagged cells exist (per Quinn #2 disposition AC)
**When** I determine flagged-cell disposition
**Then** EITHER all flagged cells are explicitly re-audited within this story (full coverage; default path); OR if flagged-cell count exceeds N=20 (operator-judged threshold for "manageable scope"), flagged cells beyond threshold may be deferred to a documented Fast Lane backlog item with explicit operator acceptance recorded in this story's PR comments. **Default disposition: re-audit-within-story** (no deferral). Deferral path requires explicit operator sign-off citing scope-vs-risk rationale.

**And** the report is consumable by Story 5.1's ship-gate verification

---

## Epic 5: Internal Release (4.1.0 to npm + GitHub)

Operator-controllable. 4.1.0 ship.

### Story 5.1: 4.1.0 Release Tag + CHANGELOG + npm Publish

As a Convoke maintainer,
I want Convoke 4.1.0 internally released to npm,
So that the v6.3+ format migration is operationally available to npm-direct users (the 40% Vortex Standalone segment).

**Acceptance Criteria:**

**Given** all 7 E2 agent PRs have landed on `main` (AR18) AND E3 CI gates are green AND E4 Covenant survival report is clean (Story 4.2 complete)
**When** I create the 4.1.0 release tag
**Then** the tag is created on `main` (FR29)

**Given** CHANGELOG.md exists
**When** I update it
**Then** a 4.1.0 entry documents:
- v6.3+ format migration scope
- Compliance-grade-not-positioning-grade boundary
- Operator-visible impacts (none for active engagements per Journey 1)
- Cross-references to PRD + Architecture + ADRs (FR30)

**Given** the 4.1.0 tag exists
**When** `npm publish` runs via the existing `host-framework-sync-playbook.md` Story 5A.2 outline
**Then** `convoke-agents@4.1.0` is published to npm (FR31)

**Given** npm publish succeeds
**When** I verify
**Then** `npm install convoke-agents@4.1.0` resolves and produces operationally-equivalent agent behavior to 4.0.0 (NFR14)

**And** the existing release pipeline is reused (no new infrastructure)

### Story 5.2: GitHub 4.1.0 Release Notes + marketplace.json Verification

As a Convoke maintainer,
I want the GitHub 4.1.0 release notes published + marketplace.json sanity-verified,
So that the format migration story is communicable AND the marketplace.json is ready for E6 re-submission.

**Acceptance Criteria:**

**Given** the 4.1.0 npm tag exists (Story 5.1 complete)
**When** I publish a GitHub release via `gh release create v4.1.0`
**Then** the release notes describe:
- The v6.3+ format migration
- The marketplace channel restoration (post-E6)
- The I97 → I95 (smoke-test absorbed) relationship (FR32)

**Given** `.claude-plugin/marketplace.json`
**When** I inspect the `skills:` array
**Then** all 7 paths point at converted agent directories (FR26 sanity check)

**And** the release notes are accessible at `https://github.com/amalik/convoke-agents/releases/tag/v4.1.0`

---

## Epic 6: Marketplace Acceptance (Trickle Epic)

Per Bob #3 refinement, this epic has unbounded reviewer-cycle latency and is **scheduled outside sprint cadence**. Operator-perceived progress: PR opened → reviewer feedback → acceptance + smoke-test absorption.

### Story 6.1: Marketplace Re-Submission + Reviewer Cycle + I95 Smoke-Test Absorption

As a Convoke maintainer,
I want the `convoke-vortex` plugin re-submitted to BMAD-METHOD's marketplace + reviewer-accepted + smoke-tested,
So that the marketplace channel is restored for the 60% addon segment.

**Trickle epic note:** This story has unbounded reviewer-cycle latency. PR opening is operator-driven (immediate after Story 5.1 ships). Reviewer feedback latency is partially out of operator control (days to weeks). Story progress is tracked outside sprint cadence per Bob #3 refinement.

**Acceptance Criteria:**

**Given** Convoke 4.1.0 is on npm (Story 5.1 complete)
**When** I open a re-submission PR against `bmad-code-org/bmad-plugins-marketplace`
**Then** the PR includes the v6.3+ format Convoke plugin and supersedes/closes the rejected PR #9 framing (FR27)

**Given** the re-submission PR is opened
**When** the reviewer cycle completes (acceptance OR rejection-with-feedback)
**Then** if accepted, the PR is merged into the marketplace catalog
**And** if rejected with feedback, scope adjustment via `bmad-correct-course` (NOT silent re-work — explicit re-scope per CC capability) before re-submitting

**Given** the marketplace plugin is accepted
**When** I run `bmad-cli install convoke-vortex` on a clean test BMAD install
**Then** the install succeeds end-to-end with all 7 agents discoverable post-install (FR28, NFR13)

**Given** the marketplace install succeeds
**When** I97 is fully closed
**Then** I95's check #1 (Vortex agents in `_bmad/config.toml` post-marketplace install) is verified absorbed into this story's smoke-test
**And** I95's checks #2 + #3 + minor adoption (channel field) remain as separate Fast Lane work per I95 re-scope

**Given** marketplace reviewer feedback is received (per Mary #1 escalation threshold AC)
**When** the feedback proposes scope changes
**Then** scope-adjustment threshold is applied: (a) **Minor scope adjustments** (additional manifest fields, naming nuances, README clarifications) — handle inline via re-push; (b) **Moderate scope adjustments** (new harness requirements, additional verification gates, BMM schema additions) — invoke `bmad-correct-course` skill; document via Change Log entry; re-submit; (c) **Catastrophic scope changes** (e.g., reviewer requires Pattern C migration as condition of acceptance) — **trigger `project_marketplace_structural_adoption.md` Pattern C revisit trigger #2 (BMAD roadmap signal)**; pause I97 ship; re-evaluate Pattern A vs C decision via Freya consultation per memory file; potentially re-plan as Pattern C from start per memory's "mid-migration pivot cost is high" annotation. **Default disposition: minor adjustments handled inline; moderate via correct-course; catastrophic triggers Pattern C revisit conversation.**
