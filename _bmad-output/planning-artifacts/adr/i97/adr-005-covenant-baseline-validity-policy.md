---
initiative: convoke
artifact_type: adr
qualifier: i97-covenant-baseline-validity-policy
created: '2026-04-28'
status: proposed
schema_version: 1
related_initiative: I97
related_decision: D6
supersedes: none
---

# ADR-005: Covenant Baseline-Validity Policy

**Status:** Proposed (2026-04-28) → To be Accepted at Epic 4 spec authoring (per-Right matrix execution)
**Initiative:** I97 (BMAD v6.3+ source format adoption)
**Related Decision:** D6 from architecture document
**Related Requirements:** PRD Decision 3; FR17-20; NFR7; NFR15

## Context

The Operator Covenant Compliance Checklist (`_bmad-output/planning-artifacts/convoke-spec-covenant-compliance-checklist.md`) defines seven Operator Rights (OC-R1 through OC-R7). Convoke's existing audit reports certify Vortex compliance against these rights; the most recent baseline is **A26 Vortex HC-cluster audit (2026-04-26)**, which audited 9 workflows × 7 Rights = 63 cells. Predecessor audits (A24, A25, others) extend the baseline.

I97's format migration (XML-in-markdown → outcome-based markdown) changes the textual content of every agent SKILL.md file. The change *may* invalidate baseline audit cells:

- Cells that test for **format-dependent patterns** (e.g., presence of specific `<step>` tags with hardcoded error strings) become meaningless against v6.3+ markdown.
- Cells that test for **structural patterns** (e.g., does the agent invoke a specific workflow path? does activation include config loading?) remain valid.
- Cells that test for **semantic patterns** (e.g., does persona convey curiosity? does communication style match documented norms?) require human re-evaluation.

Three resolution options:

- A) Declare all baseline audits valid for both formats (cheap, possibly dishonest)
- B) Re-run all baseline cells on converted source (expensive, exhaustive)
- C) Per-Right (OC-R1..R7) judgment — some Rights re-audit, others declare baseline valid

PRD Decision 3 deferred this decision to Epic 4 spec authoring; this ADR captures the architectural-level policy. The per-Right rationale matrix (which Rights re-audit, which declare valid) is authored at Epic 4 spec authoring.

## Decision

**Per-Right (OC-R1..R7) decision policy.** Some Rights re-audit, others declare baseline valid. The per-Right rationale matrix is authored as part of Epic 4 spec authoring (not this architecture document).

The architectural-level commitment:

- **Each of the 7 Operator Rights is evaluated independently** for baseline validity post-format-change.
- **Rights whose audit cells test format-dependent patterns** (likely OC-R3 rationale, OC-R5 surface-what-matters) — these get re-audited per cell against converted source. Cell-level non-regression rule (NFR7) applies.
- **Rights whose audit cells test structural patterns** (likely OC-R7 pacing) — these can declare baseline valid with explicit rationale documented in the per-Right matrix.
- **Rights whose audit cells test semantic patterns** (likely OC-R2 priority, OC-R6 control) — these require operator judgment; per-Right matrix specifies whether re-audit or declaration applies.

**Architectural-level rules** (binding for Epic 4 execution):

1. **No blanket policies.** Per-Right judgment is mandatory; no "all valid" or "all re-audit" shortcuts.
2. **Explicit rationale per Right.** The per-Right matrix in Epic 4 spec must document *why* each Right's baseline is declared valid OR which cells re-audit.
3. **Cell-level non-regression where re-audit applies.** For Rights whose cells re-audit, every cell that passed in baseline (notably A26 + predecessors) must pass post-migration. NFR7 enforced.
4. **Atomic per-agent application.** Re-audit work for converted agent X happens within agent X's conversion PR (per ADR-004 atomic-by-agent commit pattern + NFR12 atomic methodology artifact update).

## Consequences

**Positive:**

- **Surgical re-audit work.** Only format-dependent cells re-audit; structural cells skip. Reduces re-audit volume from 63+ cells per agent (full re-audit) to a manageable subset.
- **Honest about format-change semantics.** Doesn't pretend baselines remain valid for cells that legitimately become meaningless under format change.
- **Epic 4 spec authoring becomes the per-Right matrix authoring venue.** Architecture-level policy is durable; execution-level matrix is sprint-planning-time work where the operator has full context.
- **Per-Right judgment is reviewable.** Each "declare valid" or "re-audit" choice carries explicit rationale that can be challenged.
- **Cell-level non-regression rule (NFR7) preserved.** No regression in compliance percentage where re-audit applies; declarations don't paper over regressions.

**Negative / Trade-offs:**

- **Per-Right matrix authoring effort.** Operator must work through 7 Rights × ~2-3 cell categories each = ~15-20 explicit rationale entries. Bounded but non-trivial.
- **Risk of insufficient re-audit.** If the operator declares valid a Right whose cells were actually format-dependent, regressions could ship undetected. Mitigation: pre-merge code-review-convergence pass on the per-Right matrix at Epic 4 spec authoring; reviewer verifies declarations against actual cell semantics.
- **Architecture-level policy must be revisited if Operator Covenant evolves.** If new Rights are added or existing Rights amended post-I97, this ADR's "per-Right judgment" framing applies but the per-Right matrix itself is initiative-scoped.

## Alternatives Considered

**Alternative A: Declare all baseline audits valid for both formats**

- **Rejected because:** Dishonest for format-dependent cells. A cell that tests for a specific `<step>` tag pattern in v5 XML format becomes meaningless against v6.3+ markdown — declaring it "valid" misrepresents what the audit verified. Operator Covenant's credibility depends on audit results being faithful to what was actually tested.

**Alternative B: Re-run all baseline cells on converted source**

- **Rejected because:** Expensive. A26 Vortex HC-cluster alone is 63 cells; predecessor audits add more. Re-running every cell across 7 agents is many cell-hours of operator time. Most cells are structural (e.g., "does the agent use config loading via bmad-init?") and re-audit value is low — they pass identically post-migration. Better to surgically re-audit format-dependent cells and explicitly declare structural cells.

## Cross-References

- Architecture document: `_bmad-output/planning-artifacts/convoke-arch-bmad-v63-source-format-adoption.md` Section "D6" + Section "Architecture Validation Results > Important gaps"
- PRD: `_bmad-output/planning-artifacts/convoke-prd-bmad-v63-source-format-adoption.md` FR17-20, NFR7, Decision 3
- Diagnostic: `_bmad-output/implementation-artifacts/spike-marketplace-packaging-delta.md` "Three operator decisions surfaced" Decision 3
- Operator Covenant: `_bmad-output/planning-artifacts/convoke-covenant-operator.md` (OC-R1..R7 definitions)
- Compliance Checklist: `_bmad-output/planning-artifacts/convoke-spec-covenant-compliance-checklist.md`
- Baseline audit reference: A26 Vortex HC-cluster (2026-04-26) at `_bmad-output/planning-artifacts/convoke-report-operator-covenant-audit-vortex-hc-cluster-2026-04-26.md`
- Sibling ADR: ADR-003 (Covenant survival audit harness consumes the per-Right policy at execution time)
