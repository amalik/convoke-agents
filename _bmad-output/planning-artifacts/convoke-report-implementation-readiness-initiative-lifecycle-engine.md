---
stepsCompleted:
  - step-01-document-discovery
  - step-02-prd-analysis
  - step-03-epic-coverage-validation
  - step-04-ux-alignment
  - step-05-epic-quality-review
  - step-06-final-assessment
inputDocuments:
  brief: _bmad-output/planning-artifacts/convoke-brief-initiative-lifecycle-engine.md
  brief_distillate: _bmad-output/planning-artifacts/convoke-brief-initiative-lifecycle-engine-distillate.md
  prd: _bmad-output/planning-artifacts/convoke-prd-initiative-lifecycle-engine.md
  architecture: null
  epics: null
  ux: null
initiative: convoke
artifact_type: report
qualifier: implementation-readiness-initiative-lifecycle-engine
created: '2026-04-18'
schema_version: 1
status: complete
completed: '2026-04-18'
assessment_type: pre-architecture-ir-gate
---

# Implementation Readiness Assessment Report

**Date:** 2026-04-18
**Project:** Convoke — Initiative Lifecycle Engine (ILE-1)
**Assessed By:** John (PM) via `bmad-check-implementation-readiness`
**Assessment Type:** Pre-Architecture IR gate (same pattern as v6.3 Adoption's Apr 12 IR)

## Document Inventory

| Document | Location | Status |
|----------|----------|--------|
| Brief | `convoke-brief-initiative-lifecycle-engine.md` | Complete |
| Brief distillate | `convoke-brief-initiative-lifecycle-engine-distillate.md` | Complete |
| PRD | `convoke-prd-initiative-lifecycle-engine.md` | Complete, 12/12 steps, polished |
| Architecture | Not yet started | Expected — IR runs pre-Architecture per v6.3 pattern |
| Epics & Stories | Not yet created | Expected — follows Architecture |
| UX Design | N/A | Not applicable (CLI + markdown + agent conversation) |

## PRD Analysis

### Functional Requirements

**Total FRs: 63** across 9 capability areas:

| Capability Area | FRs | Count |
|-----------------|-----|-------|
| Intake, Qualification & Lane Management | FR1–FR13 | 13 |
| Portfolio Visibility & Navigation | FR14–FR22 | 9 |
| Reactive Behaviors & Trust Contract | FR23–FR29 | 7 |
| Observability Signals | FR30–FR32 | 3 |
| Shared Data Model, Integration & Governance | FR33–FR40 | 8 |
| Onboarding, Help & Error Communication | FR41–FR48 | 8 |
| Interaction Safety & Recovery | FR49–FR52 | 4 |
| Schema Evolution, Migration & Lifecycle Completeness | FR53–FR59 | 7 |
| Developer Tooling & Debugging | FR60–FR63 | 4 |

All 63 FRs follow the "[Actor] can [capability]" format. Each is testable, implementation-agnostic, and traces back to at least one prior discovery section (journey, success criterion, domain requirement, project-type requirement, or scoping decision) — verified during PRD workflow Step 9 Reverse Engineering pass.

### Non-Functional Requirements

**Total NFRs: 36** across 9 categories:

| Category | NFRs | Count |
|----------|------|-------|
| Performance | NFR1–NFR4 | 4 |
| Security & Data Handling | NFR5–NFR8 | 4 |
| Reliability & Trust | NFR9–NFR14 | 6 |
| Maintainability | NFR15–NFR18 | 4 |
| Integration & Compatibility | NFR19–NFR23 | 5 |
| Observability (System-Level) | NFR24–NFR27 | 4 |
| Usability (Developer-Tool DX) | NFR28–NFR31 | 4 |
| Backwards Compatibility | NFR32–NFR34 | 3 |
| Reproducibility | NFR35–NFR36 | 2 |

Categories intentionally skipped: Scalability (single-user-per-repo model, not user-growth) and Accessibility (CLI + markdown inherently screen-reader readable; no visual UI to audit). Skip rationale documented in the PRD.

### Additional Requirements

Beyond FRs and NFRs, the PRD captures:

- **6 Success Criteria** (3 user-success pairs + business-success with time horizons + 2 leading indicators + 4 outcome metrics with explicit hypotheses)
- **4 Falsification Criteria** (testable disconfirmations of the Portfolio-as-Code thesis)
- **2 Kill Criteria** (explicit adoption and reactive-layer thresholds with decision owner, observation window, pivot pathway)
- **3-Question Kill-Moment Diagnostic Framework** (execution vs. thesis vs. segment pivot)
- **4 TACs** (propose-before-commit fixtures; doctor green; cross-skill round-trip; performance SLO)
- **4 Observability Signals** (S1 reactive misfire rate; S2 qualifying-gate abandon rate; S3 backlog entropy; S4 cross-skill inconsistency)
- **Seed error-code registry** (20 codes across 4 categories: USER, CONFIG, INTERNAL, UNCERTAIN)
- **Dependency Graph** (5 edges between MVP items)
- **4-Tier Contingency Ladder** with validation-signal-impact annotations + descope governance (triggers, precedence, disagreement-breaking, re-scope-up mechanism)
- **3 Positioning Framings** (Lifecycle-as-Commit-Discipline; Agent-Accountable Decisions; Zero-Install Enterprise Governance)
- **Christensen-Honest Framing** (sustaining innovation with disruptive delivery mechanism)
- **Architecture-Phase Open Questions** (6 explicit: rendering medium; interaction pattern; reactive detection mechanism; conflict resolution; failure UX surface; minimal lifecycle-process subset)

### PRD Completeness Assessment

**Rating: Excellent (5/5)**

- **Format:** BMAD Standard — all 12 workflow steps complete, polished for flow and coherence, cross-references added between complementary scope sections.
- **Information Density:** High — 10 rounds of Advanced Elicitation plus multiple Party Mode reviews tightened every section. No conversational padding.
- **Measurability:** Every FR is testable; every NFR names a verification method (CI gate, fixture-based test, static analysis, manual measurement, or post-MVP review).
- **Traceability:** Reverse Engineering pass in PRD Step 9 confirmed every FR traces back to at least one prior section. No orphan FRs. No uncovered capabilities.
- **Implementation-Leakage:** FRs describe WHAT (capabilities); HOW-details live in Project-Type Requirements and are explicitly flagged as implementation considerations, not binding constraints.
- **Altitude Discipline:** NFR1/NFR2 scope clarified (end-to-end with LLM-exclusion sub-target); NFR11 conceptually rewritten (data format readability, not skill runtime); NFR15 softened (target not hard cap).
- **Completeness vs. Brief:** All Brief vision items appear in PRD. Party-mode findings (reactive layer as moat, standards-grounded × developer-native, Christensen framing) all explicit in Innovation section.

**No PRD gaps identified.** The PRD meets or exceeds the v6.3 Adoption quality bar (50 FRs, 33 NFRs, 16 failure modes) — ILE-1's 63 FRs, 36 NFRs, and 4+ failure mechanisms (falsification + kill criteria + diagnostic framework + contingency ladder) represent comparable or greater rigor.

## Epic Coverage Validation

**Status:** Deferred. Epics have not yet been created — this IR is running pre-Architecture per the same pattern v6.3 Adoption used (Apr 12 IR ran before Architecture).

**Substitute analysis: PRD FR → Capability-Area Grouping (100% internal coverage)**

Every one of the 63 FRs is grouped under exactly one of 9 capability areas in the PRD. The capability areas map to MVP items (cross-referenced in the Scope section):

| Capability Area | FRs | Maps to MVP item |
|-----------------|-----|------------------|
| Intake, Qualification & Lane Management | FR1–FR13 | MVP #3 (initiatives-backlog rework) |
| Portfolio Visibility & Navigation | FR14–FR22 | MVP #2 (portfolio-status rework) |
| Reactive Behaviors & Trust Contract | FR23–FR29 | MVP #3 (reactive behaviors) |
| Observability Signals | FR30–FR32 | MVP #5 (observability) |
| Shared Data Model, Integration & Governance | FR33–FR40 | MVP #1 + MVP #4 (shared model + integration contracts) |
| Onboarding, Help & Error Communication | FR41–FR48 | MVP #6 (onboarding UX) + cross-cutting error contract |
| Interaction Safety & Recovery | FR49–FR52 | Cross-cutting across all MVP items |
| Schema Evolution, Migration & Lifecycle Completeness | FR53–FR59 | MVP #1 (schema) + separate Growth for full CLI uninstall |
| Developer Tooling & Debugging | FR60–FR63 | Cross-cutting; ships as part of MVP #1–#6 |

**Internal coverage: 63/63 FRs (100%) mapped to MVP items.** Zero orphan FRs; zero capability areas without an MVP anchor.

**Note:** Full epic-level coverage validation will be performed after CE (Create Epics and Stories) runs post-Architecture. The capability-area → MVP-item mapping above provides the traceability source for future story decomposition.

**Recommendation at this stage:** re-run IR Steps 3 + 5 (Epic Coverage + Epic Quality) after CE produces the epics document. v6.3 Adoption's IR explicitly noted this re-run recommendation.

## UX Alignment Assessment

**UX Document Status:** Not found — not applicable.

ILE-1 is a `developer_tool` with `productNature: capability-layer`. It ships as CLI + agent-invoked skills + markdown contracts. There is no visual UI, no web/mobile components, no screen-based interaction design. PRD classifies this explicitly and documents the rationale in "Project Classification" and "Project-Type Requirements → Skipped Sections (visual_design)."

**Is UX implied?** No. The PRD's "User Journeys" section describes *conversational* and *file-level* interactions (invoke skill, accept/reject proposal, edit frontmatter) — not visual interfaces. The closest "UX" concerns in the PRD:

- **NFR28–31 Usability (Developer-Tool DX):** CLI error messages with remediation guidance, contextual help sub-commands, progress indication, plain-text-first output. These are captured in NFRs.
- **UX Quality Risk** (User Journeys section): invocation-experience clumsiness risk flagged for post-MVP UX sub-review. This is a targeted observation, not a missing UX document.
- **Journey 5 (Failure Recovery)** and **Journey 7 (Inheriting a Backlog)** surface interaction-level concerns that became FR49–FR52 (Interaction Safety & Recovery: destructive-op confirmation, undo, progress indication, error recovery).

**Alignment Issues:** None. The Developer-Tool DX concerns are consistently treated across PRD (NFRs) and will land in Architecture (rendering medium, interaction pattern — both explicitly listed as Architecture-phase open questions).

**Warnings:** None.

## Epic Quality Review

**Status:** Deferred. Epics have not yet been created. Full epic quality review will run after CE (Create Epics and Stories) produces the epics document post-Architecture.

**Substitute: proto-epic structure assessment from PRD Scoping section**

The PRD's "Project Scoping & Phased Development" section contains what will become the epic structure. Assessing the proto-structure against epic-quality best practices:

**User-value focus (per best practices):** ✅
- Every MVP item has a user-value framing, not a technical milestone. MVP #2 "Portfolio-status lifecycle-aware view" is user-value ("users see stages, lanes, WIP"), not "database setup". MVP #3 "Reactive behaviors (trust-preserving)" is user-value ("proposals users accept/reject"), not "event model implementation". No technical-only epics anticipated.

**Epic independence (no forward dependencies):** ✅
- The explicit dependency graph in the PRD shows 5 edges: #1 → {#2, #4, #6}; #4 → #3; #5 → #2 (UX surface only). No cycles. No forward dependencies (later items don't require earlier items to be completed first in a way that breaks independence).

**Sprint decomposition (per PRD):** ✅
- Sprint 1: MVP #1 (shared data model)
- Sprint 2: MVP #4 (integration contracts)
- Sprint 3: MVP #2 (portfolio-status rework)
- Sprint 4: MVP #3 (reactive behaviors)
- Sprint 5: MVP #5 (observability)
- Sprint 6: MVP #6 (onboarding UX)
- Sprint 7: buffer/polish
- Each sprint builds on prior; no sprint requires a later sprint's output.

**Brownfield indicators:** ✅
- ILE-1 is explicitly brownfield. Integration points with existing Convoke skills (initiatives-backlog, portfolio-status, migrate-artifacts) are named in MVP #4. Migration from pre-ILE-1 state is specified in Project-Type Requirements → Migration Guide.

**Contingency ladder as epic-quality affordance:** ✅
- The 4-tier contingency ladder (with validation-signal impact, trigger precedence, disagreement-breaking, re-scope-up mechanism) provides descope guidance that traditional epic structures lack. CE should preserve this when decomposing.

**API freeze discipline:** ✅
- NFR17 mandates CHANGELOG entries for any schema change; NFR13 mandates atomic writes; NFR23 mandates cross-skill version match. These become acceptance criteria within relevant stories.

**Proto-epic quality assessment: no issues detected.** The PRD has the structural foundation for clean epic decomposition. Standard best-practice violations (technical epics, forward dependencies, premature DB creation) are architecturally prevented by the dependency graph and ship-essential/thesis-essential distinction.

**Note:** Full epic quality review cannot be completed until CE produces the epics document. Recommend re-running IR Step 5 post-CE. v6.3 Adoption's IR made the same recommendation and CE was able to produce 28 stories with 100% FR coverage using the same pre-epic-phase structural foundation.

## Summary and Recommendations

### Overall Readiness Status

# READY (with conditions)

The PRD is complete, polished, and internally consistent. Architecture and Epics have not been produced yet (consciously — this is a pre-Architecture IR gate), so two steps (Epic Coverage, Epic Quality) could not be fully assessed against existing artifacts. This is the expected state at this point in the pipeline and matches the pattern v6.3 Adoption used.

### Assessment Results Summary

| Check | Result | Details |
|-------|--------|---------|
| **Document Discovery** | ✅ Pass | Brief + distillate + PRD found. No duplicates. No conflicts. |
| **PRD Analysis** | ✅ Pass | 63 FRs + 36 NFRs extracted. PRD scores 5/5 on completeness, measurability, traceability, altitude discipline. |
| **Epic Coverage** | ⚠️ Deferred | Epics not yet created. Capability-area → MVP-item mapping: 63/63 FRs (100%) anchored. |
| **UX Alignment** | ✅ N/A | ILE-1 is CLI + agent-native. No visual UI to audit; DX concerns captured in NFRs. |
| **Epic Quality** | ⚠️ Deferred | Epics not yet created. Proto-epic structure in PRD Scoping passes all best-practice checks. |

### Critical Issues Requiring Immediate Action

**None.** Zero critical issues detected across all assessable steps.

### Conditions for Full Readiness

1. **Run `bmad-create-architecture`** — answers the Architecture-phase open questions (6 explicit: rendering medium, interaction pattern, reactive detection mechanism, conflict resolution, failure UX surface, minimal lifecycle-process subset). Locks the shared data model (markdown-as-source vs. structured backing). Locks version compatibility (v6.2 + v6.3 vs. gate behind v6.3).

2. **Run PRD Validation** (`bmad-validate-prd`) — systematic 12-check pass against PRD standards. v6.3 Adoption achieved 5/5 / 12-check pass. Recommended before Architecture or in parallel.

3. **Run CE (`bmad-create-epics-and-stories`)** — decomposes 63 FRs into implementable stories along the 7-sprint architecture build order.

4. **Re-run IR Steps 3 + 5 after CE** — validates epic FR coverage (Step 3) and epic quality (Step 5) once epics exist. Produces the final "READY (no conditions)" status.

### PRD ↔ Brief Alignment Assessment

| Dimension | Alignment |
|-----------|-----------|
| **Problem framing** | Brief's cognitive-load thesis → PRD Executive Summary restates it ✅ |
| **Co-primary personas** | Brief's consulting team lead + solo practitioner → PRD Journeys 1-8 cover both ✅ |
| **Positioning (Portfolio-as-Code)** | Brief's framing → PRD Innovation section treats as one of 3 framings ✅ |
| **Strategic decisions** (amplifier-first, capability-differentiation-first) | Brief decisions → PRD respects throughout (non-goals, validation metrics, positioning) ✅ |
| **v1 scope** (6 MVP items) | Brief outline → PRD Success Criteria details + Scoping adds strategy/governance ✅ |
| **Success criteria** (3 user criteria: <60s, no altitude change, auto-land findings) | Brief → PRD Success Criteria section (mechanistic + experiential pairs) ✅ |
| **Non-goals** (BRM, OKRs, WSJF, ESG, multi-user) | Brief → PRD Vision (deferred) ✅ |
| **Open questions** | Brief distillate 7 questions → PRD captures all 6 architecture-phase + 1 UX risk ✅ |

**Brief and PRD are fully aligned.** Every Brief item is either preserved in the PRD, refined through elicitation into more precise PRD content, or explicitly deferred to a later phase with documented rationale.

### Comparison to v6.3 Adoption Reference Bar

| Dimension | v6.3 Adoption | ILE-1 | Comparison |
|-----------|---------------|-------|------------|
| FRs | 50 | 63 | ILE-1 greater |
| NFRs | 33 | 36 | ILE-1 greater |
| Failure modes / falsification | 16 FMs | 4 falsification + 2 kill criteria + 3-question diagnostic + 4-tier contingency | Comparable, different structure |
| PRD validation score | 5/5 | Not yet run (recommended) | — |
| IR assessment | Pre-CE IR (pattern established) | Pre-Architecture IR (earlier in pipeline) | Earlier gate; conscious choice |
| Architecture-phase open questions | 6 documented | 6 documented | Matched |
| Pre-registered experiments | 3 (EXP1, EXP2, EXP3) | None explicit — validation via scheduled month-3/6 innovation reviews instead | Different approach; equivalent rigor |

**ILE-1 meets or exceeds v6.3 Adoption's quality bar.** Where approaches differ (month-3/6 reviews vs. pre-registered experiments), the difference is intentional — ILE-1 is a product-capability initiative where user adoption is the primary validation signal; v6.3 was a framework-adoption initiative where specific transformations (bmad-init retirement, marketplace publish) required pre-registered experiments. Both approaches are standards-grade.

### Recommended Next Steps (in order)

1. **Now: Run `bmad-create-architecture`** for ILE-1 — Architecture resolves the 6 open questions and produces the technical design.
2. **After Architecture: Run `bmad-validate-prd`** — 12-check systematic pass. Target 5/5.
3. **After Architecture: Re-run IR Step 3** — if any Architecture decisions change which FRs are in scope, update coverage analysis.
4. **Run CE (`bmad-create-epics-and-stories`)** — decompose into stories along the 7-sprint build order with dependency-graph awareness.
5. **Re-run IR Steps 3 + 5 after CE** — validates epic FR coverage and epic quality with the full artifact set.
6. **Sprint 0 pre-work** — identify harness instrumentation needs (for NFR1/2 measurement), fixture scaffolding (for TAC1 four uncertain cases), and architecture decisions documented as ADRs.
7. **Sprint 1: Execute** — begin MVP #1 (shared data model) with TAC3 cross-skill round-trip test gating the contract.

### Final Note

This assessment validated PRD ↔ Brief alignment across 63 FRs, 36 NFRs, 6 Architecture-phase open questions, and the 4-tier contingency ladder. **Zero critical issues found.** Two checks (Epic Coverage, Epic Quality) are deferred by design — they cannot be fully assessed until CE runs post-Architecture. The quality bar set at the initiation of this session ("match v6.3 Adoption rigor") has been met or exceeded in every assessable dimension.

**Assessed by:** John (PM) via `bmad-check-implementation-readiness`
**Date:** 2026-04-18
**Assessment status:** COMPLETE
