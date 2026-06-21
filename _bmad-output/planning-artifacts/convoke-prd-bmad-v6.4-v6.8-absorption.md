---
stepsCompleted:
  - step-01-init
  - step-02-discovery
classification:
  projectType: 'Two-track versioned bundle — Conformance track (E1/E2/E4: forced, structural, one-way doors) + Capability track (E3/E5/E6: optional, spike-gated, two-way doors) + E7 (operator-experience enforcement; spike-cleared 2026-06-21, scoped)'
  domain: 'Staying a faithful downstream of a fast-moving upstream framework (N-cadence) → ecosystem conformance + distribution parity + operator-experience standards (Operator Covenant)'
  complexity:
    execution: 'LOW→MEDIUM (per-epic spread; E2 trivial → E1/E4 real engineering)'
    assurance: 'MEDIUM (E7 Covenant-preservation)'
    scopeUncertainty: 'HIGH (3 of 7 spike-gated) — requires pre-registered spike go/no-go criteria'
    reversibility: 'Mixed — one-way (E1/E4) vs two-way (E3/E5/E6)'
    strategicValue: 'Orthogonal axis — E6/E7 load-bearing despite two-way doors; do not cut under schedule pressure'
    externalDependency: 'E1 marketplace PR acceptance by bmadcode — unbounded-latency schedule risk, not assurance'
    blastRadius: 'Touches-shipped-installs (E4 release-channels, E2 schema) vs additive (E6 Web Bundles)'
  projectContext: 'Brownfield with active distribution channels (npm ~40% / marketplace ~60%, estimated); gated on I97/v4.0 ship (depends: I97 close)'
openScopeDecisions:
  - 'v4.1 = conformance-only (E1/E2/E4 + E7) with capabilities (E3/E5/E6) deferred to v4.2 — OR all seven? → resolve in Step 8 (Scoping) with success metrics in hand'
inputDocuments:
  - _bmad-output/planning-artifacts/convoke-note-v6-3-resequencing-and-v4-1-catchup-2026-05-25.md
  - _bmad-output/planning-artifacts/adr/v4-1/adr-001-guardrails-covenant-enforcement.md
  - _bmad-output/planning-artifacts/convoke-report-implementation-readiness-e7-decoupling-2026-06-21.md
  - project-context.md
  - _bmad-output/planning-artifacts/convoke-prd-bmad-v63-source-format-adoption.md
workflowType: 'prd'
initiative: convoke
artifact_type: prd
qualifier: bmad-v6.4-v6.8-absorption
related_initiative: I113
status: draft
created: '2026-06-21'
schema_version: 1
---

# Product Requirements Document - Convoke v4.1 (Upstream BMAD v6.4–v6.8 Absorption)

**Author:** Amalik
**Date:** 2026-06-21
