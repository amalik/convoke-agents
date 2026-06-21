---
stepsCompleted:
  - step-01-init
  - step-02-discovery
  - step-02b-vision
  - step-02c-executive-summary
  - step-03-success
  - step-04-journeys
  - step-05-domain
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

## Success Criteria

### User Success
- Operator can **pin their BMAD floor and opt into newer upstream independently** (E4).
- Operator **never hits a silently-skipped activation step or pause point** (E7/OC-R5).
- Standalone operator can obtain a **working Web Bundle** (E6) — **demand-pull gated** (MO6).

### Business Success
- **N-cadence = Convoke's declared BMAD *compat-floor*, not feature-parity.** Binding policy caps the lag at **≤N-3 (firm)**; the current N-6 gap closes toward **≤N-2 at ship (scope-dependent, ratified Step 8)**.
- **Marketplace discoverability:** PR *submitted*; success = accepted **OR** BYO-URL fallback documented+verified. **BYO-URL is the accepted compat floor; marketplace (E1) is polish.**
- **Operator Covenant compliance ≥ 82%**, measured by the **identical method as the baseline audit**.

### Technical Success
- **Floor capability proven (binary):** release-channels lets an operator absorb a *compat-only* upstream update with **zero Convoke code change**.
- **v4.1 absorption effort captured as a baseline** (instrumented *during* this initiative) for future cadence comparison.
- All 3 spike epics (E3/E5/E6): go/no-go criteria **pre-registered before execution**, resolved before commit.
- **Blast-radius contained:** E4/E2 ship migrations + parity; E6 additive.
- **E7 graduates OC-R5 to enforced** across **all `_bmad/bme/` pause-point skills (mechanically enumerated)**.

### Measurable Outcomes

| # | Outcome | Metric | Measurable when |
|---|---|---|---|
| MO1 | N-cadence committed | Binding policy caps compat-floor lag **≤N-3** (firm); at-ship gap → **≤N-2** (scope-dependent, Step 8). *N = compat-floor, not feature-parity* | Policy at ship; gap per scope |
| MO2 | Floor capability proven | **Binary:** operator absorbs a compat-only upstream update with **0 Convoke code change** | At ship |
| MO2b | Baseline captured | v4.1 absorption effort instrumented + recorded | During execution |
| MO3 | E7 OC-R5 enforced | % of `_bmad/bme/` **pause-point skills (mechanically enumerated)** with self-confirm enforcement ≥ target | At ship |
| MO4 | Covenant not regressed | Audit **≥ 82%, same method as baseline**; no individual Right drops | At ship |
| MO5 | Marketplace conformance | PR submitted; accepted **OR** BYO-URL fallback documented+verified | Submitted at ship; acceptance external |
| MO6 | E6 demand-gated | Lightweight signal (**≥N friction-log/operator requests**) gates spike; **no signal → defer to demand-pull, not kill** | At E6 spike (pre-commit) |
| MO7 | Parity preserved | **0 operator-facing regressions** across defined classes (below), via PF1-style battery | At ship |
| MO8 | Uncertainty retired | Go/no-go criteria **authored before** each spike runs; 3/3 resolved before commit | During execution |

**Operator-facing regression classes (MO7):** ① persona/voice drift · ② menu-code changes · ③ output format/schema · ④ command/capability availability · ⑤ activation-sequence + `on_complete` hook execution. *(Skill set enumerated mechanically via `grep _bmad/bme/`.)*

## Product Scope

### MVP — Minimum Viable Product
**E2 + E4 + E7** (floor + differentiator). *Assumption: BYO-URL is the accepted compat floor; marketplace (E1) is polish, not a faithfulness requirement.*

### Growth Features (Post-MVP)
**E1** (marketplace discoverability), **E6** (Web Bundles reach — demand-pull gated).

### Vision (Future)
**E3** (TOML collapsing wrapper patterns), **E5** (`bmad-investigate`/decision-log), automated drift-absorption at steady N-1.

*Formal conformance-vs-all-seven scope decision ratified in Step 8 against the Measurable Outcomes above.*

## User Journeys

### Journey 1 — Priya, the BMAD-addon operator *(primary; happy path + set-and-forget variant)*
**Opening:** Priya runs Convoke as a BMAD extension (~60% marketplace segment). Today she *dreads* Convoke updates — each might break against her team's BMAD version — so she pins old and falls behind.
**Rising action:** v4.1 ships release-channels (E4). Priya pins her BMAD compat-floor and opts into v4.1 *deliberately*; the module-help schema rename (E2) applies via a clean migration.
**Climax:** The update lands with zero surprises — she chose when, nothing broke.
**Variant (set-and-forget):** Priya doesn't *want* to manage versions. She selects a sane **default channel** and lets Convoke track it automatically — currency-as-managed-default, not currency-as-chore.
**Failure path:** If the E2 migration can't apply cleanly, Priya sees a Covenant-compliant next-action (OC-R6), not an error wall.
**Resolution:** Updating is a decision *or* a sane default — never a gamble. → **Reveals: E4 release-channels + default channel, E2 migration+parity+failure messaging, E1 discoverability.**

### Journey 2 — Samira, the Vortex Standalone operator *(secondary + signal-path sub-journey)*
**Opening:** Samira uses Convoke's Vortex agents *outside* Claude Code (~40% standalone segment). She wants them as a ChatGPT Custom GPT for her non-technical team. Today: no path.
**Rising action:** v4.1's E6 Web Bundles *(if demand-validated)* gives her a self-contained export.
**Signal-path sub-journey:** Samira isn't in the dev loop and doesn't know the backlog exists. For demand-pull (MO6) to work, she needs a **low-friction, documented "request a bundle" path** that turns her need into a signal the maintainer can actually see — otherwise MO6 is unmeasurable for the very segment it serves.
**Climax:** Her team uses Vortex discovery in a tool they already live in.
**Resolution:** Convoke's value reaches beyond the dev-tool boundary. → **Reveals: E6 Web Bundles, demand-pull gate (MO6), reachable demand-signal channel.**

### Journey 3 — The Covenant moment *(the differentiator)*
**Opening:** Any operator runs a Convoke skill. Mid-workflow, the agent hits a decision it can't safely resolve alone.
**Rising action:** *Pre-E7*, a flaky agent might short-circuit the pause, guess, and march on — the operator silently loses a decision. *Post-E7*, activation self-confirms every step executed, and the decision point **halts and waits**.
**Climax:** The operator is handed the resolution — with context — exactly when it matters.
**Resolution:** The operator *never silently loses control*. Operator-experience-as-architecture, made enforced. → **Reveals: E7 OC-R5 enforcement, the differentiator.**

### Journey 4 — Amalik, the maintainer *(operations + breaking-change failure path)*
**Opening:** Catching up to upstream is a multi-week fire drill — *this very N-6 absorption is the scar*.
**Rising action:** Post-v4.1, the next upstream minor drops. With release-channels + the binding N-cadence policy, Amalik absorbs a *compat-only* update with **zero Convoke code change** (MO2), or a bounded, instrumented effort vs the captured v4.1 baseline (MO2b).
**Failure path (breaking change):** When upstream ships a *breaking* change, "zero code change" does not apply. Release-channels must **distinguish compat-only vs breaking**, and the N-cadence policy must define a **breaking-change protocol**. Honest framing: the floor *reduces* heroics, it does not eliminate them.
**Climax/Resolution:** Currency stops being heroic for the common case; the rare breaking case is bounded and pre-defined rather than improvised. → **Reveals: E4 compat-vs-breaking distinction + N-cadence breaking-change protocol, MO2/MO2b.**

### Journey 5 — The lapsed/forked operator *(re-engagement; proof-of-thesis)*
**Opening:** An operator pinned an ancient version or forked Convoke because a past update burned them. They no longer trust currency.
**Rising action:** v4.1's whole thesis is "currency made safe." A documented **re-entry/migration path from an ancient pin or fork** lets them rejoin on a pinned floor, opting into newer upstream only when ready.
**Climax:** The operator Convoke *lost* comes back — the strongest possible evidence the floor works.
**Resolution:** Trust in currency is rebuildable. → **Reveals: fork/ancient-pin re-entry + migration path.**

### Journey Requirements Summary
| Journey | Epics exercised | Outcomes | New requirements surfaced |
|---|---|---|---|
| Priya (addon operator) | E4, E2, E1 | MO1, MO5, MO7 | E4 default channel; E2 failure messaging (OC-R6) |
| Samira (standalone operator) | E6 | MO6 | Reachable demand-signal channel |
| Covenant moment | E7 | MO3, MO4 | — |
| Amalik (maintainer) | E4 + N-cadence policy | MO2, MO2b | Compat-vs-breaking distinction; breaking-change protocol |
| Lapsed/forked operator | E4 + migration | (re-engagement) | Fork/ancient-pin re-entry path |

*Coverage check: every epic appears in ≥1 journey; every journey grounds ≥1 Measurable Outcome or surfaces a concrete new requirement.*
