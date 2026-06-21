---
stepsCompleted:
  - step-01-init
  - step-02-discovery
  - step-02b-vision
  - step-02c-executive-summary
vision:
  posture: 'Offensive with a defensive floor'
  statement: 'Move Convoke from reactive catch-up firefighting to a managed downstream cadence, using the v6.4–v6.8 absorption as the vehicle to ship differentiated value'
  defensiveFloor: 'E4 release-channels + a BINDING N-cadence policy commitment (machinery without the commitment is over-engineering)'
  offense:
    trueDifferentiation: 'E7 Operator Covenant enforcement (Convoke-unique, evidence-backed by the 82% baseline audit)'
    reachExpansion: 'E6 Web Bundles — distribution reach, NOT a differentiator; demand-contingent (40% standalone segment is estimated, not measured); spike must gate on demand validation, not just technical feasibility'
  coreInsight: 'For a downstream framework, currency is not overhead — but winning means building the mechanism that makes currency cheap so it stops competing with differentiation'
  honestyCaveat: 'Offense and defense compete for constrained maintainer hours; the floor must demonstrably pay back within a stated horizon — which is why the conformance-only-vs-all-seven scope decision is deferred to Step 8 with success metrics'
  whyNow: 'Upstream at N-6 (v6.8); gap threatens faithful-downstream credibility; spikes scoped; v4.0 about to ship → natural commitment-locking moment'
  narrativeThread: 'The defensive floor earns the right to play offense'
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

## Executive Summary

Every downstream framework extension faces an existential tension: **drift too far from its upstream and it becomes an unmaintained fork; chase every upstream release by hand and it never ships value of its own.** Convoke v4.1 resolves this tension structurally — absorbing upstream BMAD Method changes from **v6.4 through v6.8** not as a defensive scramble, but as the vehicle for shipping Convoke's own differentiated value.

The bookkeeping: Convoke's baseline is BMAD v6.3; upstream head is v6.8.0, leaving Convoke six releases behind (**N-6**). v4.1 is a focused, time-bounded catch-up Initiative (backlog **I113**), committed under the 2026-05-25 **Option F** decision, and **gated on the v4.0 ship**.

The strategic posture is **offensive with a defensive floor**. The *defensive floor* is twofold: **release-channels** (E4 — let operators pin Convoke's BMAD floor and opt into newer upstream separately) plus a **newly-established, binding N-cadence policy** — a v4.1 deliverable, not a pre-existing fact — committing Convoke to a defined lag behind upstream. Together they convert "staying current" from a recurring fire drill into a managed, structural capability. **That floor earns the right to play offense.**

The offense is two honestly-distinct payloads. **E7 — Operator Covenant enforcement — is Convoke's true differentiator:** where competing agent frameworks compete on capability density, Convoke competes on **operator-experience-as-architecture** — making the human operator the first-class *resolver* of every decision a skill cannot safely make alone. This is **evidence-backed and improving, not proven-perfect**: the baseline Covenant audit scores 82% compliance with documented caveats. **E6 — Web Bundles — is a different kind of payload: distribution *reach*, not differentiation** — a net-new channel (Gemini Gems, ChatGPT Custom GPTs) for the standalone segment, whose value is **demand-contingent** on an estimated ~40% of users and must be validated, not assumed.

### What Makes This Special

v4.1 is the release where Convoke proves it can be **both faithful and opinionated** — fully conformant to a fast-moving upstream *and* carrying differentiated value most downstreams never sustain. The core insight: **for a downstream framework, currency is not overhead — but winning means building the mechanism that makes currency cheap, so it stops competing with differentiation.** The release-channels-plus-policy floor is that mechanism; the Operator Covenant is the differentiation it protects.

The work splits into two tracks with different commitment profiles. The **Conformance track** — marketplace structural adoption (E1), module-help schema rename (E2), release-channels (E4) — is forced, structural, largely one-way-door work Convoke must do to remain a faithful downstream. The **Capability track** — TOML customization (E3), `bmad-investigate`/decision-log evaluation (E5), Web Bundles (E6) — is optional, spike-gated, two-way-door work. **Reversibility and strategic-value are orthogonal:** E6 and E7 stay load-bearing for positioning even where reversible, and must not be cut merely because they are "optional."

One constraint governs the whole effort, and Convoke states it plainly — because honesty is the standard a Covenant-led product is held to: **offense and defense compete for constrained maintainer hours, so the defensive floor must demonstrably pay back within a stated horizon.** Whether v4.1 ships all seven epics or conformance-only (E1/E2/E4 + E7) with capabilities deferred to v4.2 is **deliberately left to Scoping (Step 8)**, to be judged against success metrics rather than decided up front.

## Project Classification

- **Project Type:** Two-track versioned bundle — Conformance track (E1/E2/E4: forced, structural, one-way doors) + Capability track (E3/E5/E6: optional, spike-gated, two-way doors) + E7 (operator-experience enforcement; spike-cleared 2026-06-21).
- **Domain:** Staying a faithful downstream of a fast-moving upstream framework (the N-cadence problem) → ecosystem conformance + distribution parity + operator-experience standards.
- **Complexity:** Execution LOW→MEDIUM · Assurance MEDIUM · **Scope-uncertainty HIGH** (3 of 7 spike-gated; requires pre-registered go/no-go criteria) · Reversibility mixed (one-way E1/E4 vs two-way E3/E5/E6) · **Strategic-value** orthogonal to reversibility · **External-dependency** (E1 marketplace PR acceptance by `bmadcode` — unbounded-latency schedule risk, not assurance) · **Blast-radius** (E4/E2 touch shipped installs; E6 additive).
- **Project Context:** Brownfield with active distribution channels (npm ~40% / marketplace ~60%, estimated); gated on I97/v4.0 ship (`depends: I97 close`).
