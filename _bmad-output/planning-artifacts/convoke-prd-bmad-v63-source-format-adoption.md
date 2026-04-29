---
stepsCompleted:
  - step-01-init
  - step-02-discovery
  - step-02b-vision
  - step-02c-executive-summary
  - step-03-success
  - step-04-journeys
  - step-05-domain
  - step-06-innovation-skipped
  - step-07-project-type
  - step-08-scoping
  - step-09-functional
  - step-10-nonfunctional
  - step-11-polish
  - step-12-complete
inputDocuments:
  - _bmad-output/implementation-artifacts/spike-marketplace-packaging-delta.md
  - _bmad-output/implementation-artifacts/spike-bmad-interop-findings.md
  - project-context.md
  - _bmad-output/planning-artifacts/convoke-note-initiative-lifecycle-backlog.md
workflowType: prd
initiative: convoke
artifact_type: prd
qualifier: bmad-v63-source-format-adoption
status: ready-for-validation
created: '2026-04-28'
schema_version: 1
classification:
  projectType: 'Format-migration initiative within shipped developer-tooling product — substrate-preserving conversion with audit-state implications'
  domain: 'Content/format conversion + ecosystem conformance + behavioral-preservation engineering'
  complexity:
    execution: LOW
    assurance: HIGH
    assurance_sub_buckets:
      - behavioral-parity
      - covenant-survival
      - reference-integrity
  projectContext: 'Brownfield with active distribution channels (npm ~40% + marketplace ~60% — segment ratios estimated, not measured; re-evaluate post-4.0 with telemetry)'
  enhancement_history:
    - method: 'First Principles Analysis (2026-04-28)'
      changes: 'Reframed from product-level to initiative-level scope; bifurcated complexity execution-vs-assurance; specified brownfield-with-active-distribution-channels'
    - method: 'Party Mode (Winston + Murat + Saga, 2026-04-28)'
      changes: 'Added audit-state implications to project type; split assurance into 3 sub-buckets; added honesty constraint on 60/40 segment ratios'
---

# Product Requirements Document — BMAD v6.3+ Source Format Adoption (Convoke 4.0 packaging-contract)

**Author:** Amalik Amriou
**Date:** 2026-04-28
**Initiative:** I97 (Initiative Lane, RICE 3.0)
**Sibling-bundles-with:** U10+P23+A8+A9 (BMAD v6.3.0 Adoption — Convoke 4.0)
**Supersedes-framing:** I95 (smoke-test absorbed into Epic 5)

## Executive Summary

Convoke 4.0 ships v6.3+ source format adoption to restore marketplace distribution after BMAD-METHOD rejected `bmad-plugins-marketplace` PR #9 on 2026-04-27 with "older version of bmad" framing. The rejection identified an empirical format-contract gap: Convoke's 7 Vortex agent skills currently use BMAD v5/early-v6 XML-in-markdown format, while v6.3+ marketplace acceptance requires outcome-based markdown with declarative `module.yaml` agent enumeration and `module-help.csv` skill manifests.

I97 migrates the 7 Vortex agent skills to v6.3+ canonical format, expands `_bmad/bme/_vortex/module.yaml` with the `agents:` array required by BMAD's manifest-generator, authors `_bmad/bme/_vortex/module-help.csv` against the canonical schema, and re-submits the marketplace plugin. The migration is substrate-preserving — agent personas, capability routing, activation logic, and Operator Covenant compliance signals are all preserved across the format change.

Two distribution channels both consume the output: npm install (~40% Vortex Standalone segment) and BMAD marketplace install (~60% addon segment). Acceptance criteria require operational equivalence across both. Segment ratios are estimated; post-4.0 telemetry will calibrate them.

The forcing function is exogenous (BMAD-METHOD's marketplace contract). I97 is compliance-grade, not positioning-grade — marketing-rich descriptions, SEO-shaped naming, and discoverability improvements are post-ship work, explicitly out of scope.

### Distinctive Approach

The initiative chooses **Pattern A (workflow-as-reference)** over Pattern C (workflow-as-skill + agent-as-orchestrator). Pattern A preserves Vortex's agent-first user model — operators invoke Emma/Isla/etc. and the agent orchestrates workflow selection internally. Pattern C would have promoted each of 18 active workflows to top-level marketplace skills, satisfying BMAD's ecosystem norm but fragmenting Vortex's design intent. Pattern A satisfies marketplace acceptance at ~7-story scope; Pattern C would have required ~25 stories plus user-model redesign.

Pattern A implementation is constrained to be **Pattern-C-friendly**: workflow content under each agent's `./references/` is factored as if it were a standalone skill (clean SKILL.md-equivalent structure, complete capability prompts, no agent-internal coupling). If Pattern C revisit triggers fire post-ship (marketplace traction signal / BMAD roadmap signal / UX-research finding), the migration cost is relocate-and-rename, not re-author.

Substrate-preserving conversion has audit-state implications: prior Operator Covenant baseline audits (notably A26 Vortex HC-cluster, 2026-04-26) were performed against the v5/early-v6 format. Either those audits are formally declared valid for both formats, or selected cells are re-audited post-migration. Decision deferred to Epic 4.

## Project Classification

| Field | Value |
|---|---|
| **Type** | Format-migration initiative within shipped developer-tooling product — substrate-preserving conversion with audit-state implications |
| **Domain** | Content/format conversion + ecosystem conformance + behavioral-preservation engineering |
| **Complexity** | LOW (execution) / HIGH (assurance — 3 sub-buckets: behavioral parity, Covenant survival, reference integrity) |
| **Project Context** | Brownfield with active distribution channels (npm ~40% + marketplace ~60%; segment ratios estimated, not measured — re-evaluate post-4.0 with telemetry) |

## Success Criteria

### User Success

Convoke operators (consulting practitioners running Vortex on engagements) experience zero disruption from the format migration:

- **Existing engagements continue:** operators with active Vortex-driven engagements (lean personas, hypothesis maps, experiment cards in mid-flight) complete those engagements with no migration-day disruption. Pre-migration agent invocations and post-migration agent invocations produce indistinguishable outputs for the same prompts.
- **Personality preservation:** the agent-driven feel that distinguishes Vortex from generic AI agent frameworks is preserved across all 7 streams. Operators don't experience "this used to be Emma; now it's a generic agent."
- **Zero re-learning:** menu codes (LP, PV, CS, etc.), workflow names, output filenames, and capability invocation patterns remain identical. Operators don't re-read documentation to use the framework post-migration.

### Business Success

Convoke is open-source framework infrastructure; business success maps to ecosystem positioning + consultancy enablement, not revenue.

- **Marketplace channel restored:** `convoke-vortex` plugin accepted by `bmad-plugins-marketplace`. Marketplace install path becomes operationally available for the ~60% addon segment (estimated; post-4.0 telemetry will calibrate).
- **Pattern A precedent set:** the migration produces a citable pattern for future Convoke modules (Gyre, Team Factory, Enhance skills) when those need marketplace-eligible adoption. Conversion learnings transfer cleanly via the I98/I99/I100 backlog rows.
- **Upstream relationship maintained:** Convoke remains operationally compatible with BMAD-METHOD's v6.3+ packaging contract; goodwill with marketplace gatekeeper preserved for future submissions.

### Technical Success

Three sub-buckets per the project classification's HIGH-assurance requirement:

- **Behavioral parity:** identical menu codes preserved across all 7 agents; identical workflow file paths invoked from agent capability routing; identical output filenames produced for each capability. Verified by parity test suite.
- **Covenant survival:** baseline Operator Covenant audits (notably A26 Vortex HC-cluster, 2026-04-26) remain valid. No cell that passed in baseline regresses to failing post-migration. **Cell-level non-regression rule, not aggregate percentage.**
- **Reference integrity:** all internal cross-references (test paths, slash-command wrappers, retro citations, Compliance Checklist file references, audit report citations) resolve correctly under new file structure. Mechanical search verification per `mechanical-research-enumeration` rule. No reference rot ships to users.

### Measurable Outcomes

Four ship gates with explicit disconfirmation thresholds (any single failure ⇒ blocker):

| # | Outcome | Verification Method | Disconfirmation Threshold |
|---|---------|---------------------|---------------------------|
| 1 | Marketplace install end-to-end | `bmad-cli install convoke-vortex` on clean test BMAD install succeeds | Any install failure |
| 2 | Operational equivalence (npm side) | Parity test suite asserts identical menu codes + workflow file paths + output filenames per agent | Any divergence on these three dimensions |
| 3 | Covenant compliance ≥ baseline + cell-level non-regression | Re-run baseline audit cells (A26 Vortex HC-cluster + predecessors) against post-migration source | Any cell that passed in baseline now fails |
| 4 | Personality preservation | (a) Fixed-prompt Q&A samples per agent (structured before/after); (b) Operator-ranked unscripted multi-turn engagement scenarios (5-10 turn realistic consulting-shaped scenarios) | Operator ranks any agent's post-migration personality as degraded |

## Product Scope

### MVP — Minimum Viable Product

Ship-blocking scope for I97 (4.1.0 release):

- 7 Vortex agent SKILL.md files converted from v5/early-v6 XML-in-markdown to v6.3+ outcome-based markdown
- Persona + capability routing + activation logic preserved per-agent
- `_bmad/bme/_vortex/module.yaml` expanded with `agents:` array (BMAD manifest-generator-compatible schema)
- `_bmad/bme/_vortex/module-help.csv` authored against canonical BMM schema
- Workflow content under each agent's `./references/` factored as **Pattern-C-friendly** capability prompts (clean SKILL.md-equivalent structure, no agent-internal coupling, relocate-and-rename promotion path)
- Parity test suite covering operational equivalence (Outcome 2)
- Covenant survival audit framework with cell-level non-regression rule (Outcome 3)
- Personality preservation verification samples per agent (Outcome 4)
- Marketplace re-submission to `bmad-plugins-marketplace` with re-acceptance (Outcome 1)
- 4.1.0 release tag + CHANGELOG entry + npm publish + GitHub release

### Growth Features (Post-MVP)

Tracked separately, deferred:

- Gyre marketplace structural compliance migration (I98 — Fast Lane, when triggered)
- Team Factory marketplace structural compliance migration (I99 — Fast Lane, speculative)
- Module-help.csv Convoke schema extension standard documentation (I100 — Fast Lane)
- v6.4 `channel: stable` declaration in `marketplace.json` (I95 minor adoption — re-scoped)
- Marketing-rich agent descriptions for marketplace SEO/discoverability (compliance-grade-not-positioning-grade boundary)
- Adoption telemetry calibration against measured segment ratios (post-4.0 work)

### Vision (Future)

Aspirational state if Pattern C revisit triggers fire post-ship:

- 25 marketplace-listed skills (7 agents + 18 workflows) under `convoke-vortex` plugin
- Direct workflow invocation supported alongside agent-mediated discovery
- Full BMM ecosystem-canonical layout (phase-grouping, full schema conformance)
- Cross-Convoke migration completed for Gyre + Team Factory + selected Enhance skills
- Adoption telemetry-calibrated segment ratios replacing the 60/40 estimate

## User Journeys

### Journey 1 — Priya, Consulting Practitioner, Mid-Engagement Migration Crossover

**Setup.** Priya is a senior IT transformation consultant running a 12-week strategy engagement with a mid-size B2B SaaS client. She's 6 weeks in. Vortex agents (Emma for context, Isla for empathy, Liam for hypothesis engineering) have produced 9 artifacts. She's mid-flight on a hypothesis-engineering session with Liam when her npm pulls Convoke 4.1.0 alongside a security patch.

**Journey.** She runs `npm update convoke-agents` for the patch — accidentally pulls 4.1.0. She doesn't realize the format changed under her. She invokes Liam for the next hypothesis session: same menu code (HE), same workflow file path invoked, same output filename produced under `_bmad-output/vortex-artifacts/<engagement>/`. Liam's curiosity-driven probing — *"what if we're wrong about the user's job?"* — feels exactly like before. She finishes the session 30 minutes later, never knowing the format changed.

**Climax.** Operational equivalence is invisible. The agent-driven feel is preserved. The format migration is a non-event for active engagements.

**Capabilities revealed:** operational equivalence (Outcome 2); personality preservation (Outcome 4); npm distribution channel functional post-4.1.

### Journey 2 — Samira, New BMAD Operator, Marketplace Acquisition

**Setup.** Samira is a BMAD-METHOD power user with 6 months of BMAD experience. She heard about Convoke's Vortex framework on the BMAD Discord and wants to try it. She's never used Convoke before. She prefers marketplace install over npm because it's the canonical BMAD path.

**Journey.** She browses `bmad-plugins-marketplace` post-I97-ship. Finds `convoke-vortex` listed with a README explaining 7 streams + 7 agents. She runs `bmad-cli install convoke-vortex` on her existing BMAD install. Plugin resolves cleanly. Agents register in BMAD's manifest via the populated `module.yaml` `agents:` array. Slash commands appear. She invokes Emma; Emma greets her, explains the Contextualize stream, presents the LP/PV/CS capability menu. Samira completes a Lean Persona for her current client in 15 minutes. She tells two colleagues about Convoke that evening.

**Climax.** Marketplace install is the front door. The framework comes alive on first invocation.

**Capabilities revealed:** marketplace install end-to-end (Outcome 1); `module.yaml` agents[] enables BMAD manifest registration; operationally-equivalent agent behavior to npm path (Outcome 2).

### Journey 3 — Amalik, Convoke Maintainer, Pattern A Reuse on Gyre (4-6 Months Post-Ship)

**Setup.** It's 4-6 months post-I97. Marketplace traction is modest but real (e.g., 45 `convoke-vortex` installs). The operator decides to ship Gyre to marketplace as `convoke-gyre` plugin. He picks up I98 (Gyre marketplace structural compliance gap) from Fast Lane.

**Journey.** Amalik reads the I97 retrospective and epic specs. Pattern A approach is documented; reference tools (parity test suite, Covenant survival audit framework) are reusable. He runs the same conversion approach (BMB conversion tooling + Pattern A factoring) on Gyre's 4 agents. Gyre's flat `.md` agent files are converted to folder-per-agent structure. Manifest files (`module.yaml`, `module-help.csv`) authored. Workflow content factored as Pattern-C-friendly capability prompts. He runs the parity test suite — same gates fire as Vortex's. Covenant survival audit confirms baseline cell preservation. `convoke-gyre` ships in ~3 weeks (vs ~7 stories for I97 — Gyre is smaller surface), benefiting from I97's tooling investment.

**Climax.** Pattern A pays its second dividend. The investment in I97's reusable scaffolding compresses Gyre's migration cost.

**Capabilities revealed:** Pattern A migration is reusable across Convoke modules; Pattern-C-friendly factoring honored (workflow content can be promoted later if needed); Covenant audit framework generalizes to non-Vortex modules; conversion learnings transfer cleanly via shared tooling.

### Journey 4 — Marketplace Reviewer, Re-Submitted PR Evaluation

**Setup.** BMAD-METHOD's marketplace gatekeeper opens the re-submitted `convoke-vortex` PR. He's the same reviewer who rejected PR #9 with "older version of bmad." Discord exchange from rejection-day is in his memory.

**Journey.** He opens the new PR. Sees `_bmad/bme/_vortex/module.yaml` with `agents:` array populated declaratively. Sees `_bmad/bme/_vortex/module-help.csv` at module root with canonical column schema. Each of 7 agent SKILL.md files is in v6.3+ outcome-based markdown — clean frontmatter, persona section, capabilities table routing to `./references/`. He runs the marketplace install simulator against the PR branch; plugin resolves; `bmad-cli install convoke-vortex` simulation succeeds end-to-end. No structural objections surface. The submission matches BMM's reference layout. He approves the PR, merges into marketplace. Sends a brief positive note via Discord acknowledging the rework.

**Climax.** Acceptance is uneventful. The format gap that triggered rejection is closed; nothing new surfaces.

**Capabilities revealed:** marketplace acceptance criteria all satisfied (Outcome 1); canonical schema conformance for `module.yaml` `agents:` array; canonical schema conformance for `module-help.csv` columns; v6.3+ outcome-based markdown applied per-agent.

### Journey Requirements Summary

The four journeys reveal four capability clusters:

| Capability Cluster | Sources | Maps to Outcomes |
|---|---|---|
| **Format conversion (per-agent)** — XML-in-markdown → outcome-based markdown for 7 agents; persona/capability/activation preserved | Journeys 1, 2, 4 | Outcome 2 (operational equivalence); Outcome 4 (personality preservation) |
| **Manifest authoring** — `module.yaml` `agents:` expansion; `module-help.csv` against canonical BMM schema | Journeys 2, 4 | Outcome 1 (marketplace install) |
| **Pattern-C-friendly factoring** — workflow content under `./references/` factored for relocate-and-rename promotion | Journey 3 | Vision-deferred capability; Outcome 4 indirect |
| **Audit + parity infrastructure** — parity test suite covering operational equivalence; Covenant survival audit framework with cell-level non-regression rule; reference-rot avoidance via mechanical search | Journeys 1, 3 | Outcome 2; Outcome 3 (Covenant survival); Outcome 4 |

## Domain-Specific Requirements

I97's domain compliance is upstream-contractual + internal-governance, not regulatory. No HIPAA/PCI/GDPR equivalent applies. The four constraint clusters below shape implementation:

### Compliance & Conformance

- **BMAD-METHOD v6.3+ packaging contract** — `module.yaml` schema (declarative `agents:` array per BMM reference), `module-help.csv` schema (canonical column ordering: `module, skill, display-name, menu-code, description, action, args, phase, after, before, required, output-location, outputs`), per-skill SKILL.md outcome-based markdown format. Authoritative reference: `https://github.com/bmad-code-org/BMAD-METHOD/tree/main/src/bmm-skills`. Submission acceptance is gated by human reviewer (`bmadcode`) + tooling.
- **Operator Covenant compliance (internal)** — every converted SKILL.md must satisfy OC-R1 through OC-R7. Cell-level non-regression rule applies: no Covenant cell that passed in baseline (notably A26 Vortex HC-cluster, 2026-04-26) regresses to failing post-migration. Covenant Compliance Checklist authoritative reference: `_bmad-output/planning-artifacts/convoke-spec-covenant-compliance-checklist.md`.
- **`project-context.md` architecture rules** — every commit must satisfy applicable rules: `no-hardcoded-versions`, `no-process-cwd-in-libs`, `test-fixture-isolation`, `derive-counts-from-source`, `mechanical-research-enumeration`, `spec-verify-referenced-files`, `lint-passes-before-review`, `code-review-convergence`, `covenant-compliance-for-convoke-skills`, `namespace-decision-for-new-skills`. New rule may be authored if I97 surfaces a recurring pattern.

### Technical Constraints

- **Test isolation** — per `test-fixture-isolation` rule: every test that scans the project tree or invokes a CLI script must run against an isolated fixture directory (`tmpDir` created in `before()` hook), never against `PACKAGE_ROOT`. Parity test suite (Outcome 2) and Covenant survival audit harness (Outcome 3) MUST follow this rule.
- **Path safety** — no script accepts a user-provided path for destructive operations without `resolve + normalize + contains-check` against project root, per `path-safety-for-destructive-ops` rule. Migration tooling that deletes/overwrites source files must satisfy this.
- **Reference integrity** — every internal cross-reference (test paths, slash-command wrappers, retro citations, audit report citations, Compliance Checklist file references) MUST resolve correctly under new file structure. Verification by mechanical search (`grep -r` / glob), not eyeballing, per `mechanical-research-enumeration` rule. Reference rot is a ship-blocker.
- **Lint discipline** — per `lint-passes-before-review`: before any story marked `review`, `npm run lint` exits 0 with zero warnings in any file the story modifies. Migration touches many files; rule applies per-story, not per-batch.

### Integration Requirements

- **BMAD-METHOD marketplace install** — the `bmad-cli install convoke-vortex` path must work end-to-end against a clean test BMAD install (Outcome 1). Plugin resolution via `marketplace.json` `skills:` array; agent registration via `module.yaml` `agents:` declarative array (NOT Strategy 5 / Path C synthesize fallback — that was the gate-A-failing path).
- **npm distribution** — `npm install convoke-agents@4.1.0` produces operationally-equivalent agent behavior to 4.0.0 (Outcome 2). All current install paths preserved.
- **Operator Covenant audit framework** — converted source must be audit-able by existing Covenant Compliance Checklist tooling. If conversion changes file paths cited by audit reports, audit reports MUST be updated atomically (no creeping reference rot in methodology artifacts).
- **GitHub release pipeline** — 4.1.0 release tag, CHANGELOG entry, GitHub release notes follow Convoke's existing release sequence (per `host-framework-sync-playbook.md` Story 5A.2 outline).

### Risk Mitigations

| Risk | Mitigation |
|------|------------|
| Conversion strips Operator Covenant fail-loud signal (verbose `<step>` tags with hardcoded error strings) | Per-converted-SKILL.md Covenant compliance audit before merge; cell-level non-regression rule (Outcome 3) catches regressions even if aggregate % stays the same |
| Reference rot ships to users (test paths, retro citations, audit report citations all need updating atomically with file restructure) | Mechanical search rule (`grep -r`) per converted file; reference-integrity sub-bucket of HIGH-assurance complexity (Technical Success); CI gate that fails build on broken reference |
| Pattern A locks us in (workflow content baked into agent skills as `references/`) | Pattern-C-friendly factoring constraint (MVP scope item): workflow content under `./references/` factored as if standalone skill; Pattern-C-readiness checklist per merged file |
| Operator personality change ships unnoticed (parity tests pass on Q&A but personality leaks degrade on multi-turn) | Personality preservation verification with two methods: (a) fixed-prompt Q&A samples, (b) operator-ranked unscripted multi-turn engagement scenarios (Outcome 4) |
| BMAD-METHOD upstream changes packaging contract again mid-migration (v6.4/v6.5/v6.6 releases) | Watch BMAD release notes during I97 development; if breaking change ships, pause and re-scope. v6.5 adoption explicitly out of scope per N-1 cadence policy. |
| Covenant baseline audits become invalidated en masse by format change | Decision deferred to Epic 4: either declare baseline valid for both formats with explicit rationale, OR re-run selected cells post-migration. Per-Right (OC-R1..R7) decision, not blanket policy. |
| Mid-migration partial commit leaves repo in inconsistent state (some agents converted, some not) | Atomic-by-agent commit strategy: each agent's conversion is one PR with all dependents updated (tests, manifest, slash-command wrappers, audit references); no merge until parity tests + Covenant audit + reference integrity all green for that agent |

## Migration-Specific Technical Requirements

### Project-Type Overview

I97 is a content-migration initiative against a shipped npm package and an active marketplace plugin. Five technical concerns are migration-specific and not covered by standard product PRD sections:

1. Migration sequencing across 7 Vortex agents
2. Tooling stack for conversion + verification
3. Post-migration repository structure (concrete file tree)
4. Test architecture additions (parity test suite, Covenant survival audit harness)
5. CI/CD gate additions (reference integrity check, parity gate, Covenant audit gate)

### Migration Sequencing

Convert agents in **complexity-ascending order** so simpler conversions surface tooling gaps before harder ones. Operator owns the final ordering; recommended starting heuristic:

1. **First (proof-of-concept):** Emma (`contextualization-expert`) — middle-complexity baseline; well-documented diagnostic preview of converted output already exists in `spike-marketplace-packaging-delta.md`.
2. **Next (single-capability simpler agents):** Wade (`lean-experiments-specialist`), Mila (`research-convergence-specialist`).
3. **Mid-batch:** Isla (`discovery-empathy-expert`), Noah (`production-intelligence-specialist`), Max (`learning-decision-expert`).
4. **Last (HC-schema-heaviest):** Liam (`hypothesis-engineer`) — owns HC1-HC5 contract enumeration; conversion preserves the most complex schema-routing logic. Defer until tooling is hardened.

Each agent's conversion is its own atomic PR (atomic-by-agent commit strategy, per Domain Requirements / Risk Mitigations). No partial-migration states ship.

### Tooling Stack

| Tool | Purpose | Source |
|------|---------|--------|
| `bmad-agent-builder` (BMB) `build-process` "convert" mode | Per-agent SKILL.md format conversion (XML-in-markdown → outcome-based markdown) | `_bmad/bmb/skills/bmad-agent-builder/` (already shipped) |
| `bmad-workflow-builder` (BMB) `build-process` "convert" mode | Per-workflow content conversion (`workflow.md` step files → capability prompts under agent's `./references/`) | `_bmad/bmb/skills/bmad-workflow-builder/` (already shipped) |
| Parity test suite (NEW) | Asserts identical menu codes, workflow file paths invoked, output filenames produced per agent (Outcome 2) | New: `tests/integration/vortex-parity.test.js` (or similar) |
| Covenant survival audit harness (NEW) | Re-runs baseline audit cells against post-migration source; cell-level non-regression rule (Outcome 3) | New: `scripts/covenant/survival-audit.js` invoking existing Compliance Checklist tooling |
| Personality preservation harness (NEW) | (a) Fixed-prompt Q&A sample capture; (b) Operator-ranked unscripted multi-turn scenario logger (Outcome 4) | New: `tests/personality/before-after-samples/` + operator scoring rubric |
| Reference integrity check (NEW) | `grep -r` mechanical search verifying all internal cross-references resolve under new file structure | New: `scripts/audit/reference-integrity.js`; integrated as CI gate |
| Existing convoke-doctor + audit-skill-dirs | Smoke checks on installation; pre-existing tooling validates manifest correctness | `scripts/convoke-doctor.js`, `scripts/audit-skill-dirs.js` |

### Post-Migration Repository Structure

Concrete target structure for `_bmad/bme/_vortex/` after I97 ships:

```
_bmad/bme/_vortex/
├── module.yaml                    # EXPANDED: agents[] declarative array (7 entries) + prompts + directories
├── module-help.csv                # NEW: 7 rows (one per agent skill), canonical BMM column schema
├── README.md                      # Updated: references new format
├── compass-routing-reference.md   # Updated: file paths refreshed if needed
├── config.yaml                    # Unchanged
├── agents/                        # 7 agents, EACH NOW WITH:
│   ├── contextualization-expert/
│   │   ├── SKILL.md               # CONVERTED: v6.3+ outcome-based markdown
│   │   └── references/            # NEW: capability prompts per workflow
│   │       ├── lean-persona.md
│   │       ├── product-vision.md
│   │       ├── contextualize-scope.md
│   │       └── validate-context.md
│   ├── discovery-empathy-expert/  # Same shape per agent
│   │   ├── SKILL.md
│   │   └── references/
│   │       ├── user-discovery.md
│   │       ├── empathy-map.md
│   │       └── ...
│   └── ... (5 more agents same shape)
├── workflows/                     # Workflow.md step files retained as authoritative source
│   ├── lean-persona/              # Workflow source preserved (operator-facing reference)
│   └── ... (18 active workflows)  # references/*.md files in agents/<agent>/references/
│                                  # are derived FROM these workflow files
├── contracts/                     # HC1-HC5 unchanged
│   └── hc*.md
├── examples/                      # Unchanged
└── guides/                        # Unchanged
```

**Key structural decisions:**
- Workflow source-of-truth stays in `workflows/<name>/workflow.md` + step files. Agent-internal `references/<name>.md` files are derived/transformed from those workflows.
- Pattern-C-friendly factoring: each `references/<name>.md` is a complete capability prompt (clean SKILL.md-equivalent structure), so promoting to a top-level workflow skill (Pattern C) under future migration is relocate-and-rename, not re-author.
- Marketplace plugin's `skills:` array (in `.claude-plugin/marketplace.json`) continues pointing at `agents/<agent>/` directories — same paths, new content.

### Test Architecture Additions

| Test Suite | Coverage | Fixture Pattern |
|------------|----------|-----------------|
| Parity test suite | Outcome 2: menu codes + workflow paths + output filenames preserved per agent | Fixture install in `tmpDir`, run pre+post-migration agents on shared prompts, assert identical outputs |
| Covenant survival audit | Outcome 3: cell-level non-regression against baseline audits | Fixture install, run Compliance Checklist tooling per converted agent, compare to baseline cell-pass results |
| Personality preservation samples | Outcome 4: before/after Q&A + operator-ranked unscripted multi-turn | Fixture conversation logs in `tests/personality/`, operator review checkpoint pre-merge |
| Reference integrity audit | Domain Technical Constraint: every cross-reference resolves | Run `scripts/audit/reference-integrity.js` against project tree; CI gate fails build on broken reference |

All test suites follow `test-fixture-isolation` rule (per Domain Requirements). No bare `runScript()` calls; every CLI invocation passes `{ cwd: tmpDir }`.

### CI/CD Gate Additions

Three new CI gates added to existing pipeline:

1. **Parity gate** — runs parity test suite, blocks merge on any divergence (Outcome 2 enforcement).
2. **Covenant survival gate** — runs Covenant survival audit harness, blocks merge on any cell-level regression (Outcome 3 enforcement).
3. **Reference integrity gate** — runs mechanical search verification, blocks merge on any broken cross-reference (Domain Technical Constraint enforcement).

The personality preservation samples (Outcome 4 sub-method b) are operator-ranked, NOT automated — they live as a pre-merge checkpoint, not a CI gate.

### Implementation Considerations

- **Branch strategy:** one branch per agent conversion (e.g., `i97-emma-conversion`, `i97-isla-conversion`). Atomic merge per agent. No long-lived monolithic branch.
- **Migration script placement:** new tooling under `scripts/migration/i97/` namespace; reusable by Gyre (I98) + Team Factory (I99) when those trigger. Per `namespace-decision-for-new-skills`: tooling lives in Convoke's `_bmad/bme/` namespace (not upstream BMAD).
- **Rollback path:** until 4.1.0 ships, npm tags 4.0.x continue serving the v5/early-v6 format. Operator can pin to 4.0.x if 4.1.0 surfaces issues. Marketplace install pins to specific plugin versions per `marketplace.json` `version` field.
- **Watch-list:** monitor BMAD-METHOD release notes during I97 development (per Risk Mitigations). v6.4/v6.5 already landed pre-I97; v6.6+ during I97 development would trigger re-scope conversation.

## Project Scoping & Phased Development

### MVP Strategy & Philosophy

**MVP approach: Compliance MVP** — the goal is satisfying an external acceptance gate (BMAD-METHOD marketplace contract), not validating a value hypothesis. This MVP succeeds when the gate accepts; it does NOT need to validate user love, retention, engagement, or adoption. Those are post-ship 4.x measurements (per Vision step's "adoption NOT a success criterion" boundary).

**Why this MVP framing matters:**

- It permits **scope discipline** — anything beyond compliance is out (per step 3 Growth section: marketing-rich descriptions, SEO naming, discoverability improvements).
- It permits **fast iteration** — if marketplace reviewer surfaces additional gates we didn't anticipate, response cycle is short because scope is tight.
- It **doesn't pretend to validate adoption** — the segment ratios are explicitly estimated (per Distinctive Approach + Project Classification), so MVP shipping does NOT prove demand. Demand validation is post-ship telemetry work.

**Critical questions answered:**

| Question | Answer |
|----------|--------|
| What's the minimum that makes users say "this is useful"? | Same as today (4.0 already useful); MVP does not add user-perceivable value. The change is invisible to existing engagement use cases (per Journey 1, Priya). |
| What would make stakeholders say "this has potential"? | Marketplace acceptance restores a distribution channel for the ~60% addon segment. Strategic, not user-experiential. |
| What's the fastest path to validated learning? | The marketplace reviewer's response IS the validation. Re-submission produces a binary outcome (accept/reject) within days, not weeks of telemetry. |

### MVP Feature Set (Phase 1)

Detailed in the earlier "Product Scope > MVP — Minimum Viable Product" section: 10 ship-blocking items spanning per-agent format conversion, manifest authoring, Pattern-C-friendly references factoring, parity test suite, Covenant survival audit, personality preservation verification, marketplace re-submission, and the 4.1.0 release sequence. FR derivation in the Functional Requirements section maps each MVP item to a numbered FR.

### Resource Requirements

- **Team size:** solo operator (Amalik) authoring + planning; Amelia (dev agent) executing per-story; Winston (architect agent) for Architecture phase + epic spec reviews.
- **Estimated effort:** ~7 stories baseline scope, sequenced atomic-by-agent (per Migration-Specific Technical Requirements > Migration Sequencing). Heuristic timing: 2-3 weeks of focused dev time at solo-operator pace, assuming no mid-migration BMAD upstream changes (per Risk Mitigations > BMAD-METHOD upstream changes packaging contract again).
- **Skills required:** BMAD format conversion fluency (use `bmad-agent-builder` + `bmad-workflow-builder`); test fixture isolation discipline (per `test-fixture-isolation` rule); Operator Covenant cell-level audit experience (per Covenant Compliance Checklist tooling).
- **Dependencies on parallel tracks:** v6.3 adoption Stories 4.3 + 4.5 + 5B.3 close (close 4.0 to npm before I97 starts dev). Story 1B.x deferral confirmed (defer to 4.0.1 patch per memory `project_v63_adoption.md`).

### Phased Development (Phase 2 + Phase 3)

Detailed in the earlier "Product Scope > Growth Features (Post-MVP)" and "Product Scope > Vision (Future)" sections. Phase 2 (Growth) tracks I98/I99/I100 backlog items, v6.4 minor adoption, and post-ship marketing improvements as deferred work. Phase 3 (Vision) is the Pattern C aspirational state, gated on the three revisit triggers (marketplace traction, BMAD roadmap, UX research) per `project_marketplace_structural_adoption.md`.

### Risk Mitigation Strategy (consolidated)

Technical risks already enumerated in Domain Requirements > Risk Mitigations. This subsection adds market + resource risks not yet covered:

| Category | Risk | Mitigation |
|----------|------|------------|
| **Market** | Marketplace reviewer raises new objections beyond the v6.3+ format gap (e.g., wants Pattern C, wants different naming, wants additional plugins as blockers). | Watch for early review signals via Discord channel. If new gate surfaces, treat as scope-change-mid-migration: pause dev, re-scope through `bmad-correct-course`, communicate transparently. Per Pre-mortem Gap 6 ("BMAD reviewer feedback contingency") — already named as failure mode. |
| **Market** | BMAD-METHOD upstream pivots packaging contract again (v6.6+) during I97 development. | N-1 cadence policy already in place (per memory `project_two_product_framing.md`). Watch BMAD release notes during dev. If breaking change ships, pause and re-scope. v6.5 adoption out of scope (pre-empts unrelated upstream chase). |
| **Market** | Adoption signal post-ship is so weak that the migration appears retrospectively unjustified. | Adoption is NOT a success criterion (explicit boundary). Marketplace acceptance is the bar. Adoption telemetry is post-ship 4.x measurement; if it disappoints, that triggers re-evaluation, not retroactive PRD failure. |
| **Resource** | Solo operator capacity insufficient for 2-3 week focused-dev window. | Atomic-by-agent commit strategy enables incremental ship: even if only 4 of 7 agents complete in initial sprint, those 4 ship in 4.1.0-rc.1 and remaining 3 ship in 4.1.0-rc.2. Each rc tag is operational. |
| **Resource** | BMB conversion tooling produces output requiring substantial manual fixup per agent (Pattern A diagnostic showed feasibility but not effort). | Emma proof-of-concept (first agent in sequence) acts as effort calibration. If manual fixup exceeds X hours per agent, re-scope estimated effort and discuss whether to pursue alternative tooling. |
| **Resource** | Personality preservation operator-ranking (Outcome 4 sub-method b) consumes more operator hours than estimated. | Streamline rubric: 5-10 turn scenarios per agent at ~30 min/agent = 3-4 hours total operator time across 7 agents. If per-agent time exceeds 1 hour, simplify scenario complexity rather than skip the verification. |

## Functional Requirements

### Format Conversion

- **FR1:** Each Vortex agent's SKILL.md exists in v6.3+ outcome-based markdown format (sections per BMB `standard-fields.md`: Identity, Communication Style, Principles, On Activation, Capabilities). No XML elements remain in any converted agent file.
- **FR2:** Each agent's converted SKILL.md preserves the agent's persona (role, identity, communication style, principles) without semantic loss relative to the pre-migration version.
- **FR3:** Each agent's converted SKILL.md preserves the capability menu (codes + descriptions identical to pre-migration menu, e.g., LP/PV/CS/VL/PM for Emma).
- **FR4:** Each agent's converted SKILL.md delegates activation (config loading, greeting, capability presentation) to the `bmad-init` skill rather than encoding hardcoded `<step>` orchestration.
- **FR5:** Agent skill names follow the naming convention chosen for I97 (per Decision 2 resolution: `bmad-agent-bme-{role}` retained, `bmad-bme-agent-{name}` adopted, or hybrid — to be set during Architecture phase).

### Manifest Authoring

- **FR6:** `_bmad/bme/_vortex/module.yaml` declares all 7 Vortex agents in an `agents:` array conforming to BMM canonical schema (each entry includes `code`, `name`, `title`, `icon`, `team`, `description` fields).
- **FR7:** `_bmad/bme/_vortex/module.yaml` includes Convoke-applicable prompts and directories fields per BMM canonical schema (where Convoke supplies module-level configuration).
- **FR8:** `_bmad/bme/_vortex/module-help.csv` exists at the module root with canonical BMM column ordering (`module, skill, display-name, menu-code, description, action, args, phase, after, before, required, output-location, outputs`) and one row per agent skill.

### Capability Routing & Pattern-C-Friendly Factoring

- **FR9:** Each agent has a `./references/<workflow-name>.md` capability prompt for every workflow listed in that agent's pre-migration menu (e.g., Emma has `./references/lean-persona.md`, `./references/product-vision.md`, etc.).
- **FR10:** Each `./references/<workflow-name>.md` is structured as a complete, self-contained capability prompt (identity, how-it-works, output expectations) with no agent-internal coupling — Pattern-C-friendly factoring per Distinctive Approach.
- **FR11:** Each agent's `## Capabilities` table routes menu codes to `./references/<workflow-name>.md` paths via the BMB `Load \`./references/{cap}.md\`` route convention.
- **FR12:** Workflow source-of-truth files (`_bmad/bme/_vortex/workflows/<name>/workflow.md` + step files) remain in their pre-migration locations and content. No relocation, no rewriting of workflow source.

### Behavioral Parity Verification

- **FR13:** A parity test suite asserts each agent's menu codes are identical pre- and post-migration (no additions, removals, or renamings).
- **FR14:** A parity test suite asserts each agent's capability invocations resolve to the same workflow file paths pre- and post-migration.
- **FR15:** A parity test suite asserts each agent's capability invocations produce the same output filenames pre- and post-migration.
- **FR16:** The parity test suite runs against isolated fixture directories per `test-fixture-isolation` rule — no `runScript()` call without `{ cwd: tmpDir }`.

### Covenant Survival Audit

- **FR17:** A Covenant survival audit harness re-runs baseline audit cells (notably A26 Vortex HC-cluster from 2026-04-26 plus predecessor audits) against post-migration source.
- **FR18:** The harness applies the cell-level non-regression rule — for every cell that passed in baseline, the post-migration cell must also pass.
- **FR19:** The harness produces a per-cell pass/fail report comparable to baseline audit reports for traceable verification.
- **FR20:** For any cell where format change *legitimately* invalidates the baseline (e.g., the cell tested for an XML-element pattern that no longer exists), the harness flags the cell for explicit re-evaluation per Epic 4's deferred decision.

### Personality Preservation Verification

- **FR21:** For each of 7 Vortex agents, fixed-prompt-set Q&A samples are captured pre-migration (baseline) and post-migration (verification) on a shared prompt set per agent.
- **FR22:** For each of 7 Vortex agents, an operator-ranked unscripted multi-turn engagement scenario (5-10 turns of realistic consulting-shaped interaction) is captured pre- and post-migration.
- **FR23:** An operator scoring rubric exists for ranking personality preservation. Definitive disconfirmation threshold: any agent ranked "degraded" by operator review blocks merge.

### Reference Integrity Verification

- **FR24:** A reference integrity check uses mechanical search (`grep -r` / glob, per `mechanical-research-enumeration` rule) to verify all internal cross-references resolve under the new file structure — including test paths, slash-command wrappers (`.claude/skills/bmad-agent-bme-*`), retrospective citations, audit report citations, and Compliance Checklist file references.
- **FR25:** The reference integrity check is integrated as a CI gate that fails build on any broken reference.

### Marketplace Submission

- **FR26:** `.claude-plugin/marketplace.json` `skills:` array points at converted agent paths under `_bmad/bme/_vortex/agents/<agent>/`.
- **FR27:** A re-submitted PR to `bmad-code-org/bmad-plugins-marketplace` includes the v6.3+ format Convoke plugin and supersedes/closes the rejected PR #9 framing.
- **FR28:** `bmad-cli install convoke-vortex` succeeds end-to-end on a clean test BMAD install (verifies marketplace install flow per Outcome 1).

### Release Pipeline

- **FR29:** A 4.1.0 release tag is created on the Convoke repo upon I97 completion, marking the integration point of all merged per-agent atomic conversions.
- **FR30:** A CHANGELOG entry for 4.1.0 documents the v6.3+ format migration scope, compliance-grade-not-positioning-grade boundary, and operator-visible impacts (none for active engagements per Journey 1).
- **FR31:** `convoke-agents@4.1.0` is published to npm following the established `host-framework-sync-playbook.md` release sequence.
- **FR32:** A GitHub release for 4.1.0 includes release notes describing the format migration, the marketplace channel restoration, and the I97 → I95 (smoke-test absorbed) relationship.

## Non-Functional Requirements

NFRs document quality attributes specific to I97's migration context. Performance, Security, Scalability, and Accessibility categories do NOT apply — content migration changes no runtime behavior, no security surface, no scalability profile, no UI surface. Skipping them prevents requirement bloat.

### Behavioral Preservation

- **NFR1:** For every agent invocation in scope of operational equivalence (FR13-15), the post-migration agent's behavior is bit-identical to pre-migration on shared input prompt sets — same menu codes returned, same workflow paths invoked, same output filenames produced.
- **NFR2:** The personality preservation operator-ranked verification (FR23) admits zero "degraded" rankings as the disconfirmation threshold for ship. One degraded ranking on any of 7 agents blocks merge.
- **NFR3:** For active engagement use cases (Journey 1, mid-migration crossover), the format change is invisible — operators experience zero functional disruption, no need to re-read documentation, no menu code drift.

### Quality Gates

- **NFR4:** All tests run against isolated fixture directories; bare `runScript()` calls (no `cwd`) are forbidden per `test-fixture-isolation` rule. Every CI test invocation passes `{ cwd: fixtureDir }`.
- **NFR5:** Before any story is marked `review`, `npm run lint` exits 0 with zero warnings in any file the story modifies, per `lint-passes-before-review` rule. Pre-existing warnings in untouched files are out of scope per the rule's scoping clause.
- **NFR6:** Every story passes the `code-review-convergence` rule: Round 1 mandatory; Round 2 only on HIGH findings; Round 3 only on structural changes; no Round 4. Deferred findings go to backlog.

### Compliance

- **NFR7:** Cell-level Covenant non-regression rule (FR18): zero cells that passed in baseline audit may fail post-migration. Aggregate compliance percentage is informational; cell-level non-regression is the gate.
- **NFR8:** Every commit satisfies applicable `project-context.md` architecture rules, including but not limited to: `no-hardcoded-versions`, `no-process-cwd-in-libs`, `derive-counts-from-source`, `mechanical-research-enumeration`, `spec-verify-referenced-files`, `covenant-compliance-for-convoke-skills`, `namespace-decision-for-new-skills`, `staleness-preflight-for-backlog-pickup`.
- **NFR9:** Each converted SKILL.md story includes a Namespace decision section explaining the file's namespace placement (Convoke `_bmad/bme/` namespace), per `namespace-decision-for-new-skills` rule.

### Reference Integrity

- **NFR10:** Reference integrity audit (FR24) covers mechanical search of: (1) test paths under `tests/`; (2) slash-command wrappers under `.claude/skills/bmad-agent-bme-*/`; (3) retrospective citations in `_bmad-output/implementation-artifacts/*-retro-*.md`; (4) audit report citations in `_bmad-output/planning-artifacts/convoke-report-*-audit-*.md`; (5) Compliance Checklist file references in `_bmad-output/planning-artifacts/convoke-spec-covenant-compliance-checklist.md`.
- **NFR11:** The reference integrity CI gate (FR25) blocks merge on any unresolved reference. Disconfirmation: any broken cross-reference detected by the gate ⇒ blocker.
- **NFR12:** Audit reports referencing pre-migration paths must be updated atomically with each agent conversion — no creeping reference rot in methodology artifacts (i.e., A26 Vortex HC-cluster report's file-path citations must be refreshed when its target agent is converted).

### Integration

- **NFR13:** Marketplace install (FR28) succeeds on a clean test BMAD install via `bmad-cli install convoke-vortex` with zero install errors and all 7 agents discoverable post-install.
- **NFR14:** npm install path (`npm install convoke-agents@4.1.0`) produces operationally-equivalent agent behavior to 4.0.0 — verifies via the parity test suite (FR13-15) and ties to NFR1.
- **NFR15:** Operator Covenant audit framework continues to be operable against converted source. Either Compliance Checklist tooling consumes new format without modification, OR the tooling is updated atomically as part of the conversion. Decision per Epic 4 scope.

### Maintainability

- **NFR16:** Pattern-C-friendly factoring applies to every `./references/<workflow>.md` file (FR10). A pre-merge Pattern-C-readiness checklist verifies each reference is structured as a complete capability prompt (identity + how-it-works + output expectations) with no agent-internal coupling.
- **NFR17:** Atomic-by-agent commit strategy: every PR converts exactly one Vortex agent's complete dependency graph (SKILL.md + references/* + manifest updates + tests + slash-command wrapper + audit report citations). No mixed-state commits land on `main`.
- **NFR18:** Migration tooling under `scripts/migration/i97/` is reusable (per Migration-Specific Technical Requirements > Implementation Considerations). Tooling for I98 (Gyre) and I99 (Team Factory) inherits the architecture without re-authoring core logic.
- **NFR19:** Rollback path remains operational: until 4.1.0 ships, npm tag `4.0.x` continues serving the v5/early-v6 format; operators can pin to 4.0.x if 4.1.0-rc surfaces issues.
