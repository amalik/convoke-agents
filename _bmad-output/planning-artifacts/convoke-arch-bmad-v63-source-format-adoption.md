---
stepsCompleted:
  - step-01-init
  - step-02-context
  - step-03-starter-na
  - step-04-decisions
  - step-05-patterns
  - step-06-structure
  - step-07-validation
  - step-08-complete
lastStep: 8
completedAt: '2026-04-28'
inputDocuments:
  - _bmad-output/planning-artifacts/convoke-prd-bmad-v63-source-format-adoption.md
  - _bmad-output/planning-artifacts/convoke-report-prd-validation-bmad-v63-source-format-adoption.md
  - _bmad-output/implementation-artifacts/spike-marketplace-packaging-delta.md
  - _bmad-output/implementation-artifacts/spike-bmad-interop-findings.md
  - project-context.md
  - _bmad-output/planning-artifacts/convoke-arch-bmad-v6.3-adoption.md
  - _bmad-output/planning-artifacts/convoke-covenant-operator.md
  - _bmad-output/planning-artifacts/convoke-spec-covenant-compliance-checklist.md
  - memory/project_marketplace_structural_adoption.md
workflowType: architecture
initiative: convoke
artifact_type: arch
qualifier: bmad-v63-source-format-adoption
status: complete
created: '2026-04-28'
schema_version: 1
project_name: BMAD-Enhanced
user_name: Amalik Amriou
date: '2026-04-28'
related_prd: '_bmad-output/planning-artifacts/convoke-prd-bmad-v63-source-format-adoption.md'
sibling_arch: '_bmad-output/planning-artifacts/convoke-arch-bmad-v6.3-adoption.md'
---

# Architecture Decision Document — BMAD v6.3+ Source Format Adoption (Convoke 4.0 packaging-contract)

**Author:** Amalik Amriou
**Date:** 2026-04-28
**Initiative:** I97 (Initiative Lane, RICE 3.0)
**Related PRD:** [convoke-prd-bmad-v63-source-format-adoption.md](convoke-prd-bmad-v63-source-format-adoption.md)
**Sibling Architecture:** [convoke-arch-bmad-v6.3-adoption.md](convoke-arch-bmad-v6.3-adoption.md) (v6.3 adoption initiative)

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements (32 FRs across 8 capability areas):**

The PRD's capability contract decomposes naturally into four architectural component clusters:

1. **Source-format conversion** (FR1-12, ~12 FRs) — agent SKILL.md format migration + capability routing + manifest authoring + Pattern-C-friendly references factoring. Drives the *conversion harness* component.
2. **Behavioral verification** (FR13-23, ~11 FRs) — parity test suite + Covenant survival audit + personality preservation verification. Drives three *verification harness* components, each with distinct fixture patterns.
3. **Reference integrity** (FR24-25, 2 FRs) — mechanical search across project tree as CI gate. Drives the *reference integrity check* component.
4. **Distribution + release** (FR26-32, 7 FRs) — marketplace re-submission + npm publish + GitHub release + 4.1.0 tagging. Drives the *release orchestration* component (mostly leverages existing pipeline).

Total: ~6 distinct architectural components, all build/test/CI-time tooling. **No runtime services, databases, APIs, or UI**.

**Non-Functional Requirements (19 NFRs across 6 categories):**

NFRs land cleanly across two architectural axes:

- **Quality discipline** (NFR4-6): test fixture isolation, lint discipline, code-review-convergence — these are *project-wide tooling commitments*, not I97-specific.
- **Migration-specific quality** (NFR1-3, 7-19): behavioral preservation, Covenant cell-level non-regression, reference integrity, dual-channel acceptance, Pattern-C-friendly factoring, atomic-by-agent commits, rollback path, migration tooling reusability for I98/I99.

Five NFRs (NFR7, NFR8, NFR15, NFR16, NFR18) are **load-bearing for tooling architecture decisions** and will recur throughout subsequent steps.

**Scale & Complexity:**

- Primary domain: **Build/test/CI tooling for content migration** (no standard CSV match — closest: developer-tool / library_sdk).
- Complexity level: **HIGH for assurance / LOW for execution** (bifurcated per PRD classification).
- Estimated architectural components: **~6** (conversion harness, parity tester, Covenant audit harness, personality verification harness, reference integrity check, release orchestration).
- Estimated epic count: **3-5** per PRD (E1 format migration, E2 workflow transformation, E3 manifest authoring + naming, E4 Covenant survival audit, E5 release + smoke-test).
- Estimated story count: **~7 baseline + Covenant audit stories per agent** (per PRD MVP scope).

### Technical Constraints & Dependencies

**Constraints (must hold):**

- **Cannot regress v3.x npm install path** — rollback to `4.0.x` must work until 4.1.0 ships and stabilizes (per NFR19).
- **Cannot invalidate Operator Covenant baseline audits** without explicit policy declaration — Decision 3 from PRD addresses this; per-Right (OC-R1..R7) decision required (per FR20).
- **Cannot regress on agent personality** — operator-ranked verification across all 7 agents must show no "degraded" rankings (per NFR2 + FR23).
- **Must satisfy BMM canonical schemas** — `module.yaml` `agents:` array + `module-help.csv` column ordering must match upstream BMM reference (per FR6-8).
- **Must integrate with existing release pipeline** — `host-framework-sync-playbook.md` defines the publish sequence; no new release infrastructure (per FR29-32).
- **Must follow `project-context.md` architecture rules** — 16+ rules including `no-hardcoded-versions`, `no-process-cwd-in-libs`, `test-fixture-isolation`, `derive-counts-from-source`, `mechanical-research-enumeration`, `path-safety-for-destructive-ops`, `code-review-convergence` (per NFR8).

**Dependencies (existing artifacts/tools that I97 leverages):**

- **BMB conversion tooling** (`_bmad/bmb/skills/bmad-agent-builder/`, `_bmad/bmb/skills/bmad-workflow-builder/`) — both shipped, both expose `build-process` action with `convert` mode. Diagnostic confirmed they produce v6.3+ outcome-based markdown but may need manual fixup per agent.
- **`bmad-init` skill** — activation pattern delegation target (per FR4) for converted agent SKILL.md files.
- **Operator Covenant Compliance Checklist tooling** — existing audit harness referenced in Compliance Checklist; new Covenant survival audit (FR17-20) extends or wraps this.
- **Existing CI infrastructure** — `convoke-doctor`, `audit-skill-dirs`, lint pipeline (per NFR4-6).
- **Existing release pipeline** — `host-framework-sync-playbook.md` Story 5A.2 outline (per FR29-32).
- **Sibling architecture** — `convoke-arch-bmad-v6.3-adoption.md` (v6.3 adoption initiative). I97 bundles-with this; some patterns may be reusable.

**External dependencies (out of Convoke's control):**

- **BMAD-METHOD upstream contract** (v6.3+ packaging). If upstream ships v6.6+ during I97 development, scope re-evaluation triggered (per memory `project_marketplace_structural_adoption.md` + Domain Risk Mitigations).
- **Marketplace reviewer (`bmadcode`)** — re-acceptance is a human gate (FR27-28). Risk-mitigated via Pre-mortem Gap 6 framing.

### Cross-Cutting Concerns Identified

1. **Test fixture isolation** (NFR4 + project-context rule `test-fixture-isolation`) — applies to every harness component. Single fixture pattern reusable across parity/Covenant/personality/reference-integrity tests. Architecture decision: define the fixture pattern once, reuse across all harnesses.
2. **Atomic-by-agent commit strategy** (NFR17 + project-context rule for migration discipline) — applies to every PR; integration testing pre-merge per agent. Architecture decision: define the per-agent commit boundary (which files belong in which agent's PR) precisely.
3. **Reference integrity** (NFR10-12) — applies to all tests, slash-command wrappers, retro citations, audit reports, Compliance Checklist file refs. Architecture decision: where does the mechanical search tooling live + what's its CI invocation pattern?
4. **Pattern-C-friendly factoring** (NFR16) — applies to every workflow's `references/<name>.md` factoring. Architecture decision: define the SKILL.md-equivalent template that workflow `references/` files must conform to.
5. **Migration tooling reusability for I98/I99** (NFR18) — applies to every harness component built. Architecture decision: namespace tooling under `scripts/migration/i97/` with abstraction boundaries that admit Gyre/Team Factory parameterization, OR architect-as-Vortex-specific and refactor when I98 fires.
6. **Operator Covenant cell-level non-regression** (NFR7) — applies to every converted SKILL.md per-agent. Architecture decision: cell-level diff mechanism + report format.

These six cross-cutting concerns will recur throughout decisions in subsequent steps.

## Starter Template Evaluation

**Status: N/A — no greenfield bootstrap required.**

I97 is a migration *within* the shipped Convoke codebase (npm `convoke-agents@3.3.0` → `4.1.0`). There is no greenfield project to bootstrap. All technology decisions are inherited from the existing Convoke repository:

- **Language:** Markdown (content) + Node.js (tooling/scripts) — established
- **Conversion engine:** BMB tooling (`bmad-agent-builder` + `bmad-workflow-builder`) — already shipped at `_bmad/bmb/skills/`
- **Test framework:** existing Convoke `tests/` infrastructure with `test-fixture-isolation` discipline
- **CI:** existing Convoke pipeline (npm-based, project-context.md governance rules)
- **Distribution channels:** npm (existing) + BMAD marketplace plugin (re-submission per FR27-28)
- **Documentation:** Markdown under `_bmad-output/` (existing convention)
- **Release pipeline:** `host-framework-sync-playbook.md` (existing per FR29-32)

**No starter template selection required.** The "starter" is the current state of the Convoke repository.

**Note:** This step is preserved in the document for traceability. Future I98 / I99 architecture documents should also expect to mark this step N/A unless a Convoke-internal scope change introduces greenfield component authoring.

## Core Architectural Decisions

The skill's standard categories (Data, Auth, API, Frontend, Infrastructure) are mostly N/A for I97. The six decisions below address migration-tooling-specific architectural concerns. Each is ADR-worthy.

### Decision Priority Analysis

**Critical (block implementation):**

- D1 — Naming Convention Reconciliation
- D2 — Conversion Tooling Architecture
- D5 — Atomic-by-Agent Commit Pattern + Migration Tooling Namespace

**Important (shape architecture):**

- D3 — Verification Harness Architecture
- D4 — Reference Integrity Check Architecture
- D6 — Covenant Baseline-Validity Policy

**Deferred (Epic 4 scope):**

- D6 sub-decisions: per-Right re-audit-vs-declare matrix is authored as part of Epic 4 spec, not this architecture document.

### D1 — Naming Convention Reconciliation

**Decision:** **Hybrid naming** — internal canonical follows BMB convention (`bmad-bme-agent-emma`, etc.); slash-commands keep current names (`bmad-agent-bme-contextualization-expert`, etc.) as compatibility aliases.

**Rationale:**
- PRD Vision committed to Journey 1's "zero re-learning" — operators cannot experience menu code or invocation pattern drift post-migration. Renaming all 7 slash-commands violates that.
- Marketplace canonical-ness requires BMB-shape internal naming.
- Aliasing between marketplace-canonical names and slash-command compatibility names has minimal CI overhead (the existing `.claude/skills/` slash-command wrappers already point at canonical agent paths via the `LOAD the FULL agent file from {project-root}/_bmad/bme/_vortex/agents/<agent>/SKILL.md` pattern; the wrapper FILENAME (slash command) and the underlying SKILL.md filename can diverge cleanly).
- Internal canonical names use BMB convention (`bmad-bme-agent-emma`); slash-command wrapper directories keep `.claude/skills/bmad-agent-bme-{role}/` names as compatibility aliases.
- The `module.yaml` `agents:` array uses BMB-convention codes (matches marketplace); the `module-help.csv` `skill` column uses BMB-convention names.

**Affects:** FR5, FR6, FR8 (manifest authoring). Requires aliasing layer in `.claude/skills/` wrappers.
**Provided by Starter:** No — operator decision per PRD Decision 2.
**ADR-worthy:** Yes (ADR-001).

### D2 — Conversion Tooling Architecture

**Decision:** **BMB tooling canonical with documented manual-fixup contract.** Per-agent conversion runs `bmad-agent-builder` `build-process` "convert" mode + `bmad-workflow-builder` `build-process` "convert" mode against the agent's existing files. Output is reviewed against a per-agent fixup checklist before merge.

**Rationale:**
- Diagnostic (`spike-marketplace-packaging-delta.md`) confirmed BMB tooling produces v6.3+ outcome-based markdown shape correctly.
- BMB tooling is the canonical path cited by the marketplace reviewer (`bmadcode`). Following it signals goodwill.
- Diagnostic also flagged that BMB output may need manual fixup per agent (persona drift on long agents, hardcoded error-string preservation, etc.). The fixup checklist captures these patterns.
- The fixup checklist is reusable for I98 (Gyre) and I99 (Team Factory) per NFR18.

**Fixup checklist artifact location:** `scripts/migration/format-conversion/fixup-checklist.md` (template referenced by each agent's conversion PR).

**Affects:** FR1-4 (format conversion), FR9-12 (capability routing), Migration Sequencing.
**Provided by Starter:** N/A.
**ADR-worthy:** Yes (ADR-002).

### D3 — Verification Harness Architecture

**Decision:** **Three separate harnesses with shared fixture pattern.** Three distinct harness components with their own verification logic, sharing a common fixture utility library.

| Harness | FRs | Verification Method |
|---------|-----|---------------------|
| Parity test suite | FR13-16 | Mechanical assertion: identical menu codes + workflow paths + output filenames |
| Covenant survival audit | FR17-20 | Rubric-driven: re-run baseline audit cells, cell-level non-regression |
| Personality preservation | FR21-23 | Hybrid: fixed-prompt Q&A samples (mechanical) + operator-ranked unscripted multi-turn (judgment) |

**Shared infrastructure:** `scripts/migration/format-conversion/fixtures/` — fixture utility library implementing the `test-fixture-isolation` pattern (`tmpDir` setup, isolated Convoke install per fixture, cleanup in `after()` hook).

**Rationale:**
- Three verification methods are *kind*-different (mechanical / rubric / judgment); a unified harness would obscure what each method does.
- Fixture pattern is shared because all three harnesses need isolated install per `test-fixture-isolation` rule.
- Each harness is independently runnable for debugging; CI runs all three as gates per FR16, FR18, FR23.

**Affects:** FR13-23 (verification components), NFR4 (fixture isolation).
**Provided by Starter:** N/A.
**ADR-worthy:** Yes (ADR-003).

### D4 — Reference Integrity Check Architecture

**Decision:** **CI merge gate (authoritative)** with **optional pre-commit hook (developer convenience)**. Standalone script `scripts/audit/reference-integrity.js` invoked by CI on every PR; same script can be invoked by pre-commit hook for early detection on staged files.

**Rationale:**
- NFR11 explicitly says "blocks merge on any unresolved reference" — that's a CI gate, not a hook.
- Hook is convenience-grade for early detection of broken refs in dev workflow; not authoritative.
- CI gate runs against full project tree; hook runs against staged files only — different scopes serve different purposes.
- The script is the same; the invocation context differs.

**Coverage** (per NFR10): test markdown documentation under `tests/` (`.md` files only — see Story i97-1.1 Round 1 review decision D4 for narrowing rationale: NFR10's intent is documentation cross-references, not source-code string literals; `.js` test files contain markdown-link patterns inside fixture string data that produce false positives), slash-command wrappers under `.claude/skills/bmad-agent-bme-*/`, retrospective citations in `_bmad-output/implementation-artifacts/*-retro-*.md`, audit report citations in `_bmad-output/planning-artifacts/convoke-report-*-audit-*.md`, Compliance Checklist file references.

**Filter:** refs containing `{{` or `}}` template placeholder syntax are skipped (Story i97-1.1 Round 1 review decision D5). These are template-engine syntax (e.g. `{{path}}` placeholders in `bmad-document-project/templates/`), not real references.

**Affects:** FR24-25, NFR10-12.
**Provided by Starter:** N/A.
**ADR-worthy:** No (mechanism is mechanical, not architecturally ambiguous).

### D5 — Atomic-by-Agent Commit Pattern + Migration Tooling Namespace

**Commit pattern decision:** **One PR per agent with all dependents in same PR.** Each agent's conversion PR includes:

- The agent's converted SKILL.md
- The agent's `references/<workflow>.md` files (capability prompts)
- Manifest updates (`module.yaml` agents[] entry; `module-help.csv` row)
- Slash-command wrapper update (`.claude/skills/bmad-agent-bme-<role>/SKILL.md`)
- Test updates (parity test additions, fixture updates)
- Audit report citation refreshes (per NFR12 — atomic update of methodology artifacts)

**Branch naming convention:** `i97-<agent-name>-conversion` (e.g., `i97-emma-conversion`, `i97-isla-conversion`).

**Migration tooling namespace decision:** `scripts/migration/format-conversion/` (function-named, naturally reusable for I98/I99).

**Rationale:**
- NFR17 explicitly mandates atomic-by-agent commits with full dependency graph.
- Function-named namespace (`format-conversion/`) honors NFR18 (reusability for I98/I99) by encoding the *function* (format conversion) rather than the *initiative* (I97).
- Branch naming uses initiative + agent for clarity; namespace uses function for reusability.

**Affects:** FR12, NFR17, NFR18.
**Provided by Starter:** N/A.
**ADR-worthy:** Yes (ADR-004) — atomic-by-agent commit pattern is non-trivial and needs durable rationale.

### D6 — Covenant Baseline-Validity Policy

**Decision:** **Per-Right (OC-R1..R7) decision** — some Rights re-audit, others declare baseline valid. Per-Right rationale authored as part of Epic 4 spec at sprint planning time, not this architecture document.

**Rationale:**
- Surface area is large (A26 audit alone covered 9 workflows × 7 Rights = 63 cells; predecessor audits add more).
- Blanket re-audit is expensive (many cell-hours).
- Blanket declaration is dishonest (some cells test for v5-XML patterns that v6.3+ doesn't have).
- Per-Right judgment is the responsible middle: rights whose audit cells test text-format-dependent patterns (likely OC-R3 rationale, OC-R5 surface-what-matters) get re-audit; rights whose audit cells test structural patterns (likely OC-R7 pacing) can declare valid.

**Architecture document scope:** declares the *policy* (per-Right judgment).
**Epic 4 spec scope:** executes the policy (per-Right rationale matrix authored, then re-audit work happens).

**Affects:** FR17-20, NFR7, NFR15.
**Provided by Starter:** N/A.
**ADR-worthy:** Yes (ADR-005) — policy framing is architecturally durable; Epic 4 execution is implementation.

### Decisions NOT Made at This Step (Deferred or N/A)

- **Data Architecture:** N/A (no DB)
- **Authentication & Security:** N/A (no auth surface)
- **API & Communication:** N/A (no API)
- **Frontend Architecture:** N/A (no UI)
- **Infrastructure & Deployment:** Reuses existing pipeline (per `host-framework-sync-playbook.md`); no new infrastructure decisions

### Decision Impact Analysis

**Implementation sequence:**

1. D1 (Hybrid naming) must be implemented first — affects how new SKILL.md files are authored. Architecture-phase artifact: ADR-001.
2. D5 (Atomic-by-agent + namespace) must be implemented next — defines branch strategy and tooling location. Architecture-phase artifact: ADR-004.
3. D2 (BMB-canonical + fixup contract) implemented per-agent during E1 (format migration epic).
4. D3 (Three harnesses with shared fixture) implemented during E2 (workflow content transformation) and E4 (Covenant survival audit).
5. D4 (Reference integrity CI gate) implemented during E3 (manifest authoring + naming reconciliation) — depends on file paths being final.
6. D6 (Per-Right Covenant policy) implemented during E4 (Covenant survival audit) per the per-Right matrix.

**Cross-component dependencies:**

- D1 → D5 (naming convention determines branch naming + namespace conventions in tooling)
- D2 → D3 (BMB output is the input to verification harnesses)
- D3 → D4 (parity tests + Covenant audit + personality verification all generate references that integrity check covers)
- D5 → all (atomic-by-agent commit boundaries are referenced by every other decision)
- D6 → E4 spec (architecture declares policy; Epic 4 spec authors per-Right matrix)

**Five ADRs to author at workflow completion:**

- ADR-001: Naming Convention Reconciliation (D1)
- ADR-002: Conversion Tooling Architecture (D2)
- ADR-003: Verification Harness Architecture (D3)
- ADR-004: Atomic-by-Agent Commit Pattern + Migration Tooling Namespace (D5)
- ADR-005: Covenant Baseline-Validity Policy (D6)

D4 is mechanical and not ADR-worthy.

## Implementation Patterns & Consistency Rules

### Pattern Categories Defined

**Critical Conflict Points Identified:** 6 categories where AI dev agents could otherwise diverge — naming, structure, format, communication, process, and code patterns.

### Naming Patterns

**Internal canonical agent names** (per ADR-001 hybrid):

- File path: `_bmad/bme/_vortex/agents/{role}/SKILL.md` (existing role-based directory)
- Internal canonical name (in `module.yaml` `code:` field, in `module-help.csv` `skill` column): `bmad-bme-agent-{first-name}` (BMB convention) — `bmad-bme-agent-emma`, `bmad-bme-agent-isla`, `bmad-bme-agent-liam`, `bmad-bme-agent-mila`, `bmad-bme-agent-wade`, `bmad-bme-agent-noah`, `bmad-bme-agent-max`
- Slash-command wrapper directory (kept as compatibility alias): `.claude/skills/bmad-agent-bme-{role}/` — UNCHANGED from current state

**Branch naming:**

- Format: `i97-{first-name}-conversion` (e.g., `i97-emma-conversion`)
- One branch per agent. No multi-agent branches.

**Tooling namespace** (per ADR-004):

- Migration tooling: `scripts/migration/format-conversion/` (function-named, reusable for I98/I99)
- Fixture utilities: `scripts/migration/format-conversion/fixtures/`
- Fixup checklist artifact: `scripts/migration/format-conversion/fixup-checklist.md`

**Capability prompt files** (per FR9):

- File path: `_bmad/bme/_vortex/agents/{role}/references/{workflow-name}.md`
- Filename matches the workflow source filename: if the workflow is at `_bmad/bme/_vortex/workflows/lean-persona/workflow.md`, the capability prompt is at `references/lean-persona.md`

**Test naming:**

- Parity test suite: `tests/integration/vortex-parity.test.js`
- Covenant survival audit: `tests/migration/covenant-survival.test.js`
- Personality preservation harness: `tests/migration/personality-preservation/` (directory containing per-agent fixture data + harness script)
- Reference integrity script: `scripts/audit/reference-integrity.js`

### Structure Patterns

**Post-migration `_bmad/bme/_vortex/` directory structure** (per FR9-12):

```
_bmad/bme/_vortex/
├── module.yaml                    # EXPANDED with agents[] array (BMB convention names)
├── module-help.csv                # NEW with canonical BMM column ordering
├── agents/
│   ├── {role-based-name}/         # Directory KEEPS role-based name for slash-command compatibility
│   │   ├── SKILL.md               # CONVERTED v6.3+ markdown; frontmatter `name:` uses BMB canonical
│   │   └── references/            # NEW per agent
│   │       └── {workflow-name}.md
│   └── (7 agents same shape)
├── workflows/                     # UNCHANGED location and content (per FR12)
│   └── {workflow-name}/workflow.md + step files
├── contracts/                     # UNCHANGED
├── examples/                      # UNCHANGED
└── guides/                        # UNCHANGED
```

**Tooling structure** (under `scripts/migration/format-conversion/`):

```
scripts/migration/format-conversion/
├── README.md                      # How to invoke; per-agent fixup checklist guidance
├── fixup-checklist.md             # Reusable checklist artifact (per ADR-002)
├── fixtures/                      # Shared fixture utilities (per ADR-003)
│   ├── tmpDir-setup.js
│   └── isolated-install.js
├── parity-harness.js              # Parity test runner (FR13-15)
├── covenant-survival-harness.js   # Covenant audit re-runner (FR17-20)
└── personality-harness.js         # Personality verification (FR21-23)
```

### Format Patterns

**Capability prompt template** (Pattern-C-friendly per NFR16, ADR-002):

Every `references/{workflow-name}.md` file follows this structure:

```markdown
# {Capability Display Name}

## Identity
{Who is this capability — single-sentence)

## How It Works
{Steps, expected inputs, key behaviors)

## Output Expectations
{What the capability produces — file paths, format, location}

## Activation
Load this file when the parent agent's capability menu routes here.
```

This structure is **complete enough to be promoted to a standalone workflow skill** under future Pattern C migration (relocate-and-rename, not re-author).

**`module.yaml` schema** (BMM-canonical per FR6, FR7):

- `code:` field uses module identifier (e.g., `bme` for Vortex)
- `agents:` array entries each contain: `code` (BMB-canonical name), `name` (first name), `title` (role), `icon` (emoji), `team` (e.g., `vortex`), `description` (one-paragraph)

**`module-help.csv` schema** (BMM-canonical per FR8):

- Column ordering: `module, skill, display-name, menu-code, description, action, args, phase, after, before, required, output-location, outputs`
- One row per agent skill (initial 7 rows; future additions per workflow if Pattern C is revisited)

**ADR document format:**

- Location: `_bmad-output/planning-artifacts/adr/i97/`
- Filename: `adr-{nnn}-{slug}.md` (e.g., `adr-001-naming-convention-reconciliation.md`)
- Sections: Status, Context, Decision, Consequences, Alternatives Considered

### Communication Patterns

**Agent capability routing** (per FR11):

- Format in agent's `## Capabilities` table:
  ```
  | Code | Capability | Route |
  |------|-----------|-------|
  | LP | Create Lean Persona | Load `./references/lean-persona.md` |
  ```
- Route convention: `Load \`./references/{cap}.md\`` (BMB standard, per `bmad-agent-builder` template)

**Activation delegation** (per FR4):

- Every converted agent's `## On Activation` section delegates to `bmad-init` skill rather than encoding hardcoded `<step>` orchestration
- Format: "Load config via `bmad-init` skill. Greet the user appropriately and present capabilities."

**Cross-reference path conventions:**

- Within `_bmad/bme/_vortex/`: relative paths (`./references/`, `../workflows/`)
- To project-root paths: `{project-root}/...`
- Config variables: use directly (no `{project-root}` prefix on config-resolved values)

### Process Patterns

**Per-agent PR checklist** (gating merge — atomic-by-agent per NFR17):

A PR for `i97-{first-name}-conversion` MUST include all of:

- [ ] Agent's `SKILL.md` converted to v6.3+ format (FR1-4)
- [ ] All capability routes in `## Capabilities` table resolve to existing `references/{cap}.md` files (FR11)
- [ ] Workflow source files (`workflows/{name}/workflow.md`) unchanged (FR12)
- [ ] `module.yaml` `agents:` array entry added/updated for this agent (FR6)
- [ ] `module-help.csv` row added/updated for this agent (FR8)
- [ ] Slash-command wrapper file at `.claude/skills/bmad-agent-bme-{role}/SKILL.md` updated to point at converted SKILL.md (D1 alias layer)
- [ ] Parity tests added for this agent (FR13-15)
- [ ] Covenant survival audit passes for this agent's cells (FR17-20)
- [ ] Personality preservation samples captured + operator-ranked (FR21-23)
- [ ] Audit report citations updated atomically for this agent's references (NFR12)
- [ ] Reference integrity CI check passes (FR24-25, NFR11)
- [ ] `npm run lint` exits 0 with zero warnings on modified files (NFR5)
- [ ] Fixup checklist (per ADR-002) reviewed and any flagged items resolved

**Fixup checklist execution flow** (per ADR-002):

1. Run BMB tooling (`bmad-agent-builder` `build-process` "convert" + `bmad-workflow-builder` `build-process` "convert")
2. BMB output written to working location
3. Operator reviews against `fixup-checklist.md`:
   - Persona preservation (no drift on long agents)
   - Hardcoded error-string preservation (Operator Covenant fail-loud signal)
   - Capability menu codes preserved (no drift)
   - Workflow file path preservation (FR12)
4. Apply manual fixups; commit BMB output + fixups together with the agent's other dependents
5. Document any new patterns surfaced for future agent conversions (feedback loop)

### Code Patterns (from `project-context.md`, applicable to migration tooling)

These are existing project-context.md rules that apply to all I97 migration tooling code:

| Rule | How It Applies to I97 |
|------|----------------------|
| `no-hardcoded-versions` | Migration tooling reads version from `package.json` via `getPackageVersion()`; never hardcodes "4.1.0" or similar |
| `no-process-cwd-in-libs` | All harness/script lib functions accept `projectRoot` parameter; CLI entry points pass `findProjectRoot()` result down |
| `test-fixture-isolation` | Every test invocation passes `{ cwd: tmpDir }`; bare `runScript()` calls forbidden (NFR4) |
| `derive-counts-from-source` | Don't write `for agent in 7`; use registry: `for agent of vortexAgentRegistry`. Verify counts derive from registries (e.g., `module.yaml` agents[] array) |
| `mechanical-research-enumeration` | Reference integrity check uses `grep -r` / glob, not eyeballing (FR24, NFR10) |
| `path-safety-for-destructive-ops` | Migration scripts that delete/overwrite files validate user paths (`resolve + normalize + contains-check` against project root) |
| `code-review-convergence` | Each agent PR follows R1-R3 review pattern; no Round 4 |
| `lint-passes-before-review` | `npm run lint` exits 0 with zero warnings before marking story `review` (NFR5) |

### Anti-Patterns (I97-specific)

These patterns will appear plausible to dev agents but violate I97's architecture:

❌ **Multi-agent PRs** — combining 2+ agent conversions in one PR. Violates NFR17. Always split into atomic-by-agent PRs.

❌ **Magic-number loops** — `for (let i = 0; i < 7; i++)` over Vortex agents. Use the registry as source of truth (per `derive-counts-from-source`).

❌ **Bypass fixture isolation** — calling `runScript(scriptPath)` without `{ cwd: tmpDir }`. Violates NFR4. Always pass cwd.

❌ **Format conversion without fixup checklist** — accepting BMB output as-is without per-agent review. Violates ADR-002. Always apply fixup checklist.

❌ **Updating audit reports separately from per-agent conversion** — batch-updating `convoke-report-*-audit-*.md` files in a separate PR after agents convert. Violates NFR12 atomic update. Update audit report citations within the same PR as the agent's conversion.

❌ **Branch naming drift** — using `convert-emma`, `feature/emma`, etc. instead of canonical `i97-emma-conversion`. Use canonical branch naming.

❌ **Hardcoding "4.1.0" in tests or scripts** — version checks should derive from `package.json` per `no-hardcoded-versions`.

❌ **Workflow source modification** — editing `_bmad/bme/_vortex/workflows/{name}/workflow.md` files. Violates FR12. Workflow source remains unchanged; only agent-internal `references/{name}.md` files are derived.

### Enforcement Guidelines

**All AI dev agents MUST:**

1. Follow the per-agent PR checklist (above) — checklist is binding for merge
2. Use canonical branch naming (`i97-{first-name}-conversion`)
3. Pass reference integrity CI check before merge
4. Pass parity test suite for converted agent before merge
5. Pass Covenant survival audit for converted agent's cells before merge
6. Capture personality preservation samples + obtain operator ranking before merge
7. Apply fixup checklist post-BMB-conversion (no skipping)
8. Update audit report citations atomically within the same PR

**Pattern enforcement mechanisms:**

- **CI gates** (automated): parity test suite, Covenant survival audit, reference integrity check, lint
- **PR template** (semi-automated): the per-agent checklist becomes the PR template body for `i97-*-conversion` branches
- **Operator review** (manual): personality preservation ranking; fixup checklist sign-off
- **Pre-merge review** (manual): code-review-convergence rule (R1 mandatory; R2 on HIGH; R3 on structural; no R4)

**Pattern violations:**

- Document violations in PR comments
- Block merge until resolved (no exception path)
- If violation reveals a pattern gap, file a Fast Lane intake to update this architecture document

## Project Structure & Boundaries

### Complete Project Directory Structure (post-I97)

This is the consolidated target state of the Convoke repository after I97 ships. Represents the union of:
- Existing structure (preserved unchanged unless noted)
- New files/directories introduced by I97
- Modifications to existing files (per per-agent PR checklist)

```
BMAD-Enhanced/                                              # Repo root
├── package.json                                            # UPDATED: version → 4.1.0 at ship time
├── _bmad/
│   ├── bme/
│   │   └── _vortex/                                        # MIGRATED — primary I97 target
│   │       ├── module.yaml                                 # EXPANDED: agents[] array (BMM canonical)
│   │       ├── module-help.csv                             # NEW: 7 rows per agent
│   │       ├── README.md                                   # UNCHANGED
│   │       ├── compass-routing-reference.md                # POSSIBLY UPDATED: file path refresh
│   │       ├── config.yaml                                 # UNCHANGED
│   │       ├── agents/
│   │       │   ├── contextualization-expert/               # EMMA — directory keeps role-name (D1 alias)
│   │       │   │   ├── SKILL.md                            # CONVERTED: v6.3+ markdown
│   │       │   │   └── references/                         # NEW per agent
│   │       │   │       ├── lean-persona.md
│   │       │   │       ├── product-vision.md
│   │       │   │       ├── contextualize-scope.md
│   │       │   │       └── validate-context.md
│   │       │   ├── discovery-empathy-expert/               # ISLA — same shape
│   │       │   ├── research-convergence-specialist/        # MILA — same shape
│   │       │   ├── hypothesis-engineer/                    # LIAM — same shape (HC-heavy)
│   │       │   ├── lean-experiments-specialist/            # WADE — same shape
│   │       │   ├── production-intelligence-specialist/     # NOAH — same shape
│   │       │   └── learning-decision-expert/               # MAX — same shape
│   │       ├── workflows/                                  # UNCHANGED location + content (per FR12)
│   │       │   ├── lean-persona/workflow.md + step files
│   │       │   ├── product-vision/workflow.md + step files
│   │       │   └── (~18 active workflows + 2 deprecated)
│   │       ├── contracts/                                  # UNCHANGED (HC1-HC5)
│   │       ├── examples/                                   # UNCHANGED
│   │       └── guides/                                     # UNCHANGED
│   ├── bmb/                                                # UNCHANGED — BMB tooling source
│   ├── _config/                                            # UNCHANGED — taxonomy + agent manifest
│   └── core/                                               # UNCHANGED
├── .claude-plugin/
│   └── marketplace.json                                    # POSSIBLY UPDATED: skills[] paths verified post-migration
├── .claude/
│   └── skills/
│       ├── bmad-agent-bme-contextualization-expert/        # KEPT — slash-command compat alias (per D1)
│       │   └── SKILL.md                                    # UPDATED: points at converted SKILL.md
│       └── (6 more bmad-agent-bme-{role}/ wrappers, same shape)
├── scripts/
│   ├── audit/
│   │   └── reference-integrity.js                          # NEW (per ADR-004 + FR24-25)
│   └── migration/
│       └── format-conversion/                              # NEW namespace (function-named per ADR-004)
│           ├── README.md                                   # NEW: how to invoke + checklist guidance
│           ├── fixup-checklist.md                          # NEW: per-agent fixup contract (per ADR-002)
│           ├── fixtures/                                   # NEW: shared fixture utilities (per ADR-003)
│           │   ├── tmpDir-setup.js
│           │   └── isolated-install.js
│           ├── parity-harness.js                           # NEW: parity test runner (FR13-15)
│           ├── covenant-survival-harness.js                # NEW: Covenant audit re-runner (FR17-20)
│           └── personality-harness.js                      # NEW: personality verification (FR21-23)
├── tests/
│   ├── integration/
│   │   └── vortex-parity.test.js                           # NEW (FR13-16)
│   └── migration/
│       ├── covenant-survival.test.js                       # NEW (FR17-20)
│       └── personality-preservation/                       # NEW (FR21-23)
│           ├── harness.js
│           └── fixtures/
│               ├── emma/
│               │   ├── fixed-prompt-set.json
│               │   └── unscripted-scenarios.md
│               └── (6 more agents, same shape)
├── _bmad-output/
│   ├── planning-artifacts/
│   │   ├── convoke-prd-bmad-v63-source-format-adoption.md  # EXISTING (PRD)
│   │   ├── convoke-arch-bmad-v63-source-format-adoption.md # NEW (this document, post-rename)
│   │   ├── convoke-report-prd-validation-bmad-v63-source-format-adoption.md  # EXISTING
│   │   ├── adr/
│   │   │   └── i97/                                        # NEW directory per ADR convention
│   │   │       ├── adr-001-naming-convention-reconciliation.md
│   │   │       ├── adr-002-conversion-tooling-architecture.md
│   │   │       ├── adr-003-verification-harness-architecture.md
│   │   │       ├── adr-004-atomic-by-agent-commit-and-tooling-namespace.md
│   │   │       └── adr-005-covenant-baseline-validity-policy.md
│   │   ├── convoke-report-*-audit-*.md                     # EXISTING (audit reports — UPDATED atomically per agent PR per NFR12)
│   │   ├── convoke-spec-covenant-compliance-checklist.md   # POSSIBLY UPDATED if conversion tooling needs new schema
│   │   └── (other existing planning artifacts)
│   ├── implementation-artifacts/
│   │   ├── spike-marketplace-packaging-delta.md            # EXISTING (diagnostic)
│   │   ├── spike-bmad-interop-findings.md                  # EXISTING (predecessor)
│   │   └── (story specs added per epic during sprint)
│   └── vortex-artifacts/                                   # EXISTING (engagement output)
├── docs/                                                   # EXISTING
├── CHANGELOG.md                                            # UPDATED at ship: 4.1.0 entry per FR30
└── project-context.md                                      # UNCHANGED unless new rule emerges from I97
```

### Architectural Boundaries

**API Boundaries:** N/A — no API surface.

**Component Boundaries:**

- **Convoke source** (`_bmad/bme/_vortex/`) — owned by Convoke; modified per agent migration
- **BMB tooling** (`_bmad/bmb/`) — owned by upstream BMAD; consumed read-only by I97 conversion process
- **Slash-command wrappers** (`.claude/skills/bmad-agent-bme-*/`) — Convoke-owned compat alias layer (per D1); points at converted Vortex agents
- **Migration tooling** (`scripts/migration/format-conversion/`) — Convoke-owned, function-named (per ADR-004); reusable for I98/I99
- **Test infrastructure** (`tests/`) — extends existing Convoke test suite; follows `test-fixture-isolation` rule
- **Marketplace plugin definition** (`.claude-plugin/marketplace.json`) — Convoke-owned; consumed by BMAD-METHOD marketplace tooling
- **Covenant audit framework** (`_bmad-output/planning-artifacts/convoke-spec-covenant-compliance-checklist.md` + audit reports) — Convoke-owned methodology; updated atomically with agent conversions (per NFR12)

**Data Boundaries:** N/A — no DB. File-system-only. Boundaries between owned/consumed code are sufficient.

### Requirements to Structure Mapping

**FR cluster → file location:**

| FR Cluster | Files |
|------------|-------|
| FR1-5 (Format Conversion) | `_bmad/bme/_vortex/agents/{role}/SKILL.md` (7 files converted) |
| FR6-8 (Manifest Authoring) | `_bmad/bme/_vortex/module.yaml`, `_bmad/bme/_vortex/module-help.csv` |
| FR9-12 (Capability Routing) | `_bmad/bme/_vortex/agents/{role}/references/{workflow-name}.md` (~25 new files: 7 agents × 3-5 capability prompts each) |
| FR13-16 (Behavioral Parity) | `tests/integration/vortex-parity.test.js`, `scripts/migration/format-conversion/parity-harness.js` |
| FR17-20 (Covenant Survival) | `tests/migration/covenant-survival.test.js`, `scripts/migration/format-conversion/covenant-survival-harness.js` |
| FR21-23 (Personality Preservation) | `tests/migration/personality-preservation/`, `scripts/migration/format-conversion/personality-harness.js` |
| FR24-25 (Reference Integrity) | `scripts/audit/reference-integrity.js`, CI gate config |
| FR26-28 (Marketplace Submission) | `.claude-plugin/marketplace.json` (verified), GitHub PR to `bmad-code-org/bmad-plugins-marketplace` |
| FR29-32 (Release Pipeline) | `package.json` (version), `CHANGELOG.md`, GitHub release notes, npm publish (uses existing `host-framework-sync-playbook.md` orchestration) |

**NFR cluster → enforcement location:**

| NFR Cluster | Enforcement |
|-------------|-------------|
| NFR1-3 (Behavioral Preservation) | parity-harness.js + personality-harness.js (CI + operator review) |
| NFR4-6 (Quality Gates) | existing CI (lint, test isolation), code-review-convergence rule |
| NFR7-9 (Compliance) | covenant-survival-harness.js (CI gate), per-agent PR checklist (NFR9 namespace decision) |
| NFR10-12 (Reference Integrity) | reference-integrity.js (CI gate), per-PR atomic update discipline |
| NFR13-15 (Integration) | npm publish + marketplace install verification (manual + simulator) |
| NFR16-19 (Maintainability) | Pattern-C-readiness checklist (PR review), atomic-by-agent commit pattern (PR template), function-named namespace (ADR-004), npm tag rollback (no enforcement needed; preserved by default) |

**ADR → location:**

- All five ADRs at `_bmad-output/planning-artifacts/adr/i97/adr-{001-005}-*.md`
- ADR-001..005 mapped to D1, D2, D3, D5, D6 from Step 4 (D4 not ADR-worthy)

### Integration Points

**Internal (within Convoke repo):**

- BMB tooling invocation: migration tooling at `scripts/migration/format-conversion/` invokes `_bmad/bmb/skills/bmad-agent-builder/` and `_bmad/bmb/skills/bmad-workflow-builder/`
- Activation delegation: every converted agent's SKILL.md delegates activation to `bmad-init` skill (per FR4)
- Capability routing: agent SKILL.md `## Capabilities` table loads `./references/{cap}.md` (per FR11)
- Workflow source preservation: `references/{name}.md` derived from `workflows/{name}/workflow.md` but workflow source unchanged (per FR12)

**External (out of Convoke repo):**

- BMAD-METHOD marketplace: `.claude-plugin/marketplace.json` consumed by upstream marketplace tooling at install time
- npm registry: `convoke-agents@4.1.0` published via existing release pipeline
- GitHub releases: 4.1.0 release notes published via `gh` CLI per `host-framework-sync-playbook.md`
- BMAD-METHOD upstream: `bmad-code-org/bmad-plugins-marketplace` PR re-submission

**Data Flow (post-migration):**

1. Operator runs `npm install convoke-agents@4.1.0` OR `bmad-cli install convoke-vortex` from BMAD-METHOD marketplace
2. Install resolves agent paths from `marketplace.json` `skills[]` array OR from npm package
3. BMAD `manifest-generator.collectAgentsFromModuleYaml()` reads `module.yaml` `agents:` array → registers 7 Vortex agents in BMAD's agent manifest
4. Operator invokes `bmad-agent-bme-{role}` slash command → wrapper at `.claude/skills/bmad-agent-bme-{role}/SKILL.md` loads `_bmad/bme/_vortex/agents/{role}/SKILL.md`
5. Agent SKILL.md activates: delegates config loading to `bmad-init`, presents capability menu
6. Operator selects capability code → agent loads `./references/{cap}.md`, drives workflow per Pattern-C-friendly capability prompt
7. Workflow output written to existing `_bmad-output/vortex-artifacts/` location

### File Organization Patterns

(Already documented in Step 5 Patterns. Cross-reference: see "Naming Patterns" + "Structure Patterns" sections above.)

### Development Workflow Integration

**Per-agent development cycle:**

1. Create branch `i97-{first-name}-conversion`
2. Run BMB conversion tooling against agent's existing files (output to working directory)
3. Apply fixup checklist (per ADR-002); commit BMB output + fixups
4. Add capability prompts under `references/{workflow-name}.md` (Pattern-C-friendly per NFR16)
5. Update `module.yaml` agents[] entry; add `module-help.csv` row
6. Update slash-command wrapper at `.claude/skills/bmad-agent-bme-{role}/SKILL.md`
7. Add parity tests + Covenant survival audit assertion + personality preservation samples
8. Run reference integrity check locally; fix any broken refs
9. Run full test suite; verify all pass
10. Run lint; verify zero warnings
11. Refresh audit report citations atomically
12. Open PR with per-agent checklist as PR template body
13. CI gates run: parity, Covenant survival, reference integrity, lint
14. Operator reviews personality preservation rankings
15. Code review convergence rule (R1 mandatory; R2 on HIGH; R3 on structural; no R4)
16. Merge to main

**Build/release integration:**

- All 7 agent conversion PRs land on `main` before 4.1.0 ship
- 4.1.0 ship triggered via `host-framework-sync-playbook.md` Story 5A.2 outline
- Marketplace re-submission PR opened against `bmad-code-org/bmad-plugins-marketplace` after 4.1.0 npm tag exists

## Architecture Validation Results

### Coherence Validation ✅

**Decision Compatibility:**

All six architectural decisions (D1-D6) work together without contradiction:
- D1 (hybrid naming) → feeds D5 (branch naming uses first names; namespace function-named)
- D2 (BMB-canonical + fixup) → feeds D3 (verification harnesses consume BMB output)
- D3 (three harnesses, shared fixture) → independent of D1/D2 architecturally; depends on `test-fixture-isolation` rule
- D4 (CI gate for reference integrity) → orthogonal to D1-D3
- D5 (atomic-by-agent + function-named namespace) → cross-cutting (every PR follows it)
- D6 (per-Right Covenant policy) → independent of D1-D5; shapes Epic 4 scope only

**Pattern Consistency:**

- Naming patterns derive from D1 (hybrid)
- Structure patterns derive from D5 (atomic-by-agent + namespace) + post-migration repo target
- Format patterns derive from D2 (capability prompt template) + BMM canonical schemas
- Communication patterns derive from FR4 (activation delegation) + FR11 (capability routing)
- Process patterns derive from NFR17 (atomic commits) + NFR12 (atomic audit refresh) + project-context.md rules
- Code patterns inherit from project-context.md (NFR8); no re-invention

**Structure Alignment:**

Project structure (Step 6) is the union of D1-D6 + FR/NFR cluster mappings. No contradictions surfaced. File tree explicitly marks NEW / UNCHANGED / UPDATED per file.

### Requirements Coverage Validation ✅

**Functional Requirements Coverage:**

All 32 FRs traced to file locations and architectural components:
- FR1-5 (Format Conversion) → 7 SKILL.md files + naming convention (D1)
- FR6-8 (Manifest Authoring) → module.yaml + module-help.csv per BMM canonical
- FR9-12 (Capability Routing) → Pattern-C-friendly references factoring per D2 + ADR-002
- FR13-16 (Behavioral Parity) → parity-harness.js + parity test suite per D3 + ADR-003
- FR17-20 (Covenant Survival) → covenant-survival-harness.js per D3
- FR21-23 (Personality Preservation) → personality-harness.js per D3
- FR24-25 (Reference Integrity) → reference-integrity.js as CI gate per D4
- FR26-28 (Marketplace Submission) → existing marketplace.json + GitHub re-submission
- FR29-32 (Release Pipeline) → existing host-framework-sync-playbook.md orchestration

**Non-Functional Requirements Coverage:**

All 19 NFRs traced to enforcement locations and mechanisms:
- NFR1-3 (Behavioral Preservation) → parity + personality harnesses + Operator review
- NFR4-6 (Quality Gates) → existing CI infrastructure + project-context.md rules
- NFR7-9 (Compliance) → covenant-survival-harness.js + per-agent PR checklist + namespace-decision rule
- NFR10-12 (Reference Integrity) → reference-integrity.js CI gate + atomic update discipline
- NFR13-15 (Integration) → npm + marketplace verification (manual + simulator)
- NFR16-19 (Maintainability) → Pattern-C-readiness checklist + atomic-by-agent + function-named namespace + npm tag rollback

**Measurable Outcomes Coverage:**

All 4 PRD outcomes have verification mechanisms:
- Outcome 1 (marketplace install) → manual + simulator verification post-conversion (FR28)
- Outcome 2 (operational equivalence) → parity-harness.js (FR13-15)
- Outcome 3 (Covenant survival) → covenant-survival-harness.js with cell-level non-regression (FR17-20)
- Outcome 4 (personality preservation) → personality-harness.js with operator-ranked unscripted multi-turn (FR21-23)

**Cross-Cutting Concerns Coverage (from Step 2):**

| Concern | Addressed By |
|---------|--------------|
| Test fixture isolation | shared fixture utilities (D3) + NFR4 |
| Atomic-by-agent commit | D5 + NFR17 + per-agent PR checklist |
| Reference integrity | D4 + reference-integrity.js + NFR10-12 |
| Pattern-C-friendly factoring | D2 capability prompt template + NFR16 + Pattern-C-readiness checklist |
| Migration tooling reusability | function-named namespace (D5) + NFR18 |
| Covenant cell-level non-regression | D6 + NFR7 + covenant-survival-harness.js |

### Implementation Readiness Validation ✅

**Decision Completeness:**

- 6 architectural decisions documented with rationale ✓
- 5 ADRs to author at workflow completion (D4 not ADR-worthy) ✓
- All decisions cite specific FRs/NFRs/PRD-decisions ✓
- All decisions document trade-offs + chosen path + rationale ✓

**Structure Completeness:**

- Complete project tree with NEW/UNCHANGED/UPDATED markings ✓
- All architectural boundaries documented (component boundaries; API/Data N/A) ✓
- Integration points (internal + external) specified ✓
- Data flow mapped (post-migration end-to-end operator invocation path) ✓

**Pattern Completeness:**

- 6 pattern categories address all conflict points (Step 5)
- 8 anti-patterns explicitly named to prevent dev-agent drift
- Per-agent PR checklist (12 items) is the binding merge gate
- Per-agent development cycle (16 steps) is the developer-facing workflow
- Pattern enforcement mechanisms distinguished (CI / PR template / operator review / pre-merge review)

### Gap Analysis Results

**Critical gaps: NONE**

All FRs/NFRs traced; all ADRs scoped; per-agent PR checklist binding; no architecture-blocking gaps.

**Important gaps (deferred-decisions, NOT architecture defects):**

- **Personality preservation operator scoring rubric** (FR23) — architecture declares the rubric *artifact* exists; rubric content authoring deferred to Epic 4 spec at sprint planning time. This is a *deferred-decision*, not an architecture gap. PRD's Improvement 2 already flagged this.
- **Covenant baseline-validity per-Right matrix** (D6) — architecture declares the *policy* (per-Right judgment); Epic 4 spec authors the per-Right rationale matrix. Per ADR-005's status (proposed → accepted at Epic 4 spec authoring).

**Nice-to-have enhancements:**

- ADR template authoring detail (specific section format, headings) could be more prescriptive. Acceptable as-is given standard ADR pattern is widely understood.
- Migration tooling abstraction for I98/I99 could be parameterized from Day 1 vs refactor-when-needed. Architecture declares "function-named namespace" satisfies NFR18; refactor-when-needed is acceptable per simple-and-fast posture.
- Reference integrity check semantics (handling 3rd-party-link vs internal-ref distinction) could be more detailed; mechanical at implementation time.

### Validation Issues Addressed

**No critical issues to resolve.**

**Two deferred-decisions documented and routed:**

1. Personality scoring rubric → Epic 4 spec authoring
2. Per-Right Covenant matrix → Epic 4 spec authoring

Both are intentional placeholders flagged in PRD's Top 3 Improvements and consistent with Epic 4's natural scope.

### Architecture Completeness Checklist

**✅ Requirements Analysis**
- [x] Project context thoroughly analyzed (Step 2)
- [x] Scale and complexity assessed (HIGH-assurance / LOW-execution bifurcated)
- [x] Technical constraints identified (6 must-hold constraints)
- [x] Cross-cutting concerns mapped (6 concerns addressed)

**✅ Architectural Decisions**
- [x] 6 decisions documented with rationale
- [x] Technology stack inherited from existing Convoke repo (no new tech selection per Step 3 N/A)
- [x] Integration patterns defined (internal + external)
- [x] No new performance / security / scalability concerns to address (N/A per project-type)

**✅ Implementation Patterns**
- [x] Naming conventions established (per ADR-001)
- [x] Structure patterns defined (per ADR-004)
- [x] Communication patterns specified (capability routing, activation delegation)
- [x] Process patterns documented (per-agent PR checklist, fixup checklist execution flow)

**✅ Project Structure**
- [x] Complete directory structure defined
- [x] Component boundaries established
- [x] Integration points mapped
- [x] Requirements to structure mapping complete (FR/NFR clusters → files/locations)

### Architecture Readiness Assessment

**Overall Status: ✅ READY FOR IMPLEMENTATION**

**Confidence Level: HIGH** — architecture document covers all 32 FRs, 19 NFRs, 4 outcomes; ADRs scope matches operator-deferred decisions cleanly; no critical gaps; deferred-decisions explicitly routed to Epic 4 spec authoring.

**Key Strengths:**

- All decisions trace to specific FRs/NFRs/PRD-decisions (no architecture invention)
- 8 anti-patterns explicitly named to prevent dev-agent drift
- Per-agent PR checklist (12 items) enforces atomic-by-agent commits at merge gate
- Pattern-C-friendly factoring as load-bearing constraint (NFR16) defends future flexibility cheaply
- 5 ADRs to author at workflow completion provide durable rationale for non-trivial decisions
- Cross-cutting concerns (Step 2) all addressed by specific architectural decisions
- Project structure consolidates content from PRD + Step 5 + Step 4 ADRs into single canonical view (no duplication, no drift)

**Areas for Future Enhancement:**

- Rubric authoring (Epic 4 scope, not architecture)
- Per-Right Covenant matrix (Epic 4 scope)
- I98/I99 abstraction refactor (refactor-when-needed per NFR18; acceptable deferral)

### Implementation Handoff

**AI Agent Guidelines:**

- Follow all architectural decisions exactly as documented
- Use implementation patterns consistently across all components (per Step 5 patterns)
- Respect project structure and boundaries (per Step 6 structure)
- Refer to per-agent PR checklist (Step 5) as binding merge gate
- Apply fixup checklist post-BMB-conversion (per ADR-002)
- Refer to this architecture document for all architectural questions
- File pattern violations as Fast Lane intakes; do NOT silently work around

**First Implementation Priorities:**

1. **Author 5 ADRs** at `_bmad-output/planning-artifacts/adr/i97/adr-{001-005}-*.md` — provides durable rationale for downstream story authoring
2. **Author personality preservation operator scoring rubric** (PRD Improvement 2) — pre-test against existing 4.0 agents before E1 starts
3. **Stand up E1: Emma proof-of-concept conversion** — first agent in complexity-ascending sequence; calibrates effort estimates and surfaces tooling gaps before Liam (HC-heavy)

**Sequencing for downstream Epic spec authoring (per `bmad-create-epics-and-stories`):**

- E1: Format migration for 7 Vortex agents (sequenced per Migration Sequencing recommendation: Emma → Wade/Mila → Isla/Noah/Max → Liam)
- E2: Workflow content transformation into agent `references/` (parallel to E1 per agent)
- E3: Manifest authoring + naming reconciliation (E3 finalizes module.yaml + module-help.csv after all agents converted)
- E4: Covenant survival audit per converted file + per-Right policy matrix authoring + personality scoring rubric authoring
- E5: Marketplace re-submission + smoke-test (absorbs I95)

Total ~7 baseline stories + Covenant audit stories per agent (~10-15 total) per PRD MVP scope.
