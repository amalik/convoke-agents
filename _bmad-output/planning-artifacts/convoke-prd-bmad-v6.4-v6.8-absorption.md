---
stepsCompleted:
  - step-01-init
  - step-02-discovery
  - step-02b-vision
  - step-02c-executive-summary
  - step-03-success
  - step-04-journeys
  - step-05-domain
  - step-06-innovation
  - step-07-project-type
  - step-08-scoping
  - step-09-functional
  - step-10-nonfunctional
  - step-11-polish
  - step-12-complete
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
  - 'RESOLVED 2026-06-21 (Step 8): MVP = E2+E4+E7 (floor + differentiator). E1 = Phase 2 fast-follow (async marketplace submit; BYO-URL is MVP discoverability floor). E3/E5/E6 = Phase 3 / v4.2 (spike + demand-gated). Rationale: prove-payback-first; E7 is the offense that matters, E6 is demand-unvalidated reach, E1 has unbounded external-gatekeeper latency.'
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
status: complete
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

One constraint governs the whole effort, and Convoke states it plainly — because honesty is the standard a Covenant-led product is held to: **offense and defense compete for constrained maintainer hours, so the defensive floor must demonstrably pay back within a stated horizon.** Judged against that constraint and the success metrics, v4.1's scope is resolved as a tight MVP — **E2+E4+E7 (the floor plus the differentiator)** — with marketplace discoverability (E1) as a Phase-2 fast-follow and the capability spikes (E3/E5/E6) deferred to v4.2. The full rationale and phasing are in *Project Scoping & Phased Development*.

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
- **N-cadence = Convoke's declared BMAD *compat-floor*, not feature-parity.** Binding policy caps the lag at **≤N-3 (firm)**; the current N-6 gap closes toward **≤N-2 at ship** (scope-dependent; see *Project Scoping*).
- **Marketplace discoverability:** PR *submitted*; success = accepted **OR** BYO-URL fallback documented+verified. **BYO-URL is the accepted compat floor; marketplace (E1) is polish.**
- **Operator Covenant compliance ≥ 82%**, measured by the **identical method as the baseline audit**.

### Technical Success
- **Floor capability proven (class-dependent):** release-channels lets an operator absorb a *declaration-only* upstream update with **zero Convoke source/logic change** (conformance-required is bounded/mechanical; breaking invokes the protocol — see the absorption ternary in the architecture).
- **v4.1 absorption effort captured as a baseline** (instrumented *during* this initiative) for future cadence comparison.
- All 3 spike epics (E3/E5/E6): go/no-go criteria **pre-registered before execution**, resolved before commit.
- **Blast-radius contained:** E4/E2 ship migrations + parity; E6 additive.
- **E7 graduates OC-R5 to enforced** across **all `_bmad/bme/` pause-point skills (mechanically enumerated)**.

### Measurable Outcomes

| # | Outcome | Metric | Measurable when |
|---|---|---|---|
| MO1 | N-cadence committed | Binding policy caps compat-floor lag **≤N-3** (firm); at-ship gap → **≤N-2** (scope-dependent). *N = compat-floor, not feature-parity* | Policy at ship; gap per scope |
| MO2 | Floor capability proven | **Class-dependent:** a *declaration-only* (Class A) upstream update absorbs with **0 Convoke source/logic change**; *conformance-required* (Class B) is bounded/mechanical; *breaking* (Class C) invokes the protocol | At ship |
| MO2b | Baseline captured | v4.1 absorption effort instrumented + recorded | During execution |
| MO3 | E7 OC-R5 enforced | % of `_bmad/bme/` **pause-point skills (mechanically enumerated)** with self-confirm enforcement ≥ target | At ship |
| MO4 | Covenant not regressed | Audit **≥ 82%, same method as baseline**; no individual Right drops | At ship |
| MO5 | Marketplace conformance | PR submitted; accepted **OR** BYO-URL fallback documented+verified | Submitted at ship; acceptance external |
| MO6 | E6 demand-gated | Lightweight signal (**≥N friction-log/operator requests**) gates spike; **no signal → defer to demand-pull, not kill** | At E6 spike (pre-commit) |
| MO7 | Parity preserved | **0 operator-facing regressions** across defined classes (below), via PF1-style battery | At ship |
| MO8 | Uncertainty retired | Go/no-go criteria **authored before** each spike runs; 3/3 resolved before commit | During execution |

**Operator-facing regression classes (MO7):** ① persona/voice drift · ② menu-code changes · ③ output format/schema · ④ command/capability availability · ⑤ activation-sequence + `on_complete` hook execution. *(Skill set enumerated mechanically via `grep _bmad/bme/`.)*

## Product Scope (Summary)

- **MVP (Phase 1):** E2 + E4 + E7 — the floor plus the differentiator.
- **Growth (Phase 2, fast-follow):** E1 — marketplace discoverability.
- **Vision (v4.2, spike/demand-gated):** E3, E5, E6.

*The conformance-vs-all-seven decision is resolved (MVP = E2+E4+E7); full rationale, phasing, and risk mitigation are in **Project Scoping & Phased Development** below. Assumption: BYO-URL is the accepted compat floor; marketplace (E1) is discoverability polish, not a faithfulness requirement.*

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

## Domain-Specific Requirements

Developer-tooling / framework-extension domain — **no regulatory compliance** (no HIPAA/PCI/GDPR; Convoke processes no end-user PII). The domain's analog of "compliance" is **ecosystem conformance**: the contracts a downstream must honor to remain installable and faithful.

### Ecosystem-Conformance Constraints *(the domain's "compliance")*
- **Marketplace structural contract:** `skills/` at repo root + `module.yaml` + `module-help.csv`, per the PR #9 rejection spec (E1).
- **Module-help schema conformance:** `after`/`before` → `preceded-by`/`followed-by`, per v6.7 (E2).
- **v6.3+ source format:** outcome-based markdown — already adopted in v4.0/I97; **must not regress**.
- **Operator Covenant:** Convoke's self-imposed governance standard — compliance ≥ 82% baseline (E7, MO4).

### Integration Constraints
- **Parallel-install model:** Convoke installs *side-by-side* with BMAD, **not as a dependency** (`node_modules/bmad-method` absent in the canonical dev tree). Conformance is structural/contractual, not package-linked.
- **Cross-platform export targets:** the `.agents/skills/` standard (v6.5) + Web Bundles (E6) — surfaces Convoke *conforms to*, doesn't own.

### Domain Risks & Mitigations
- **Behavioral parity (content, not code):** Convoke is LLM-interpreted prompts; "compat" is *behavioral*, verified via the PF1-style battery (MO7), not compiled checks.
- **External-gatekeeper dependency:** marketplace acceptance is outside Convoke's control → BYO-URL fallback (MO5).
- **Upstream-drift:** the N-cadence problem itself → release-channels + binding policy (the floor).

## Innovation & Novel Patterns

*Honest scoping: the majority of v4.1 is adoption/execution, not breakthrough. Two aspects are genuinely novel — both operational/architectural, not feature-level.*

### Detected Innovation Areas
1. **Currency-as-funded-differentiation operating model.** Not a feature — an *operating model* for the downstream-fork dilemma. Make upstream-currency a *managed structural capability* (release-channels + binding N-cadence policy) **specifically to free maintainer capacity for a differentiator.** Most downstream extensions treat currency as overhead; v4.1 treats it as the thing that *funds* offense. ("The defensive floor earns the right to play offense.")
2. **Operator-experience-as-architecture, enforced (E7).** The Operator Covenant is the Blue Ocean axis (competitors compete on capability density). E7's novelty is the *mechanism*: graduating an operator right (OC-R5 pause) from authorial convention to **agent-self-confirmed runtime enforcement** — repurposing upstream's activation-guardrail discipline for operator-experience guarantees, not just agent obedience.

### Market Context & Competitive Landscape
- No competing BMAD downstream publishes an operator-experience covenant or an explicit N-cadence operating policy *(per current marketplace landscape; not exhaustively surveyed)*.
- Both novelties differentiate **posture**, not capability surface — which is exactly the Blue Ocean play.

### Validation Approach
- Operating model → MO2 (floor pays back) + MO2b (baseline captured): *does currency actually become cheap?*
- Covenant enforcement → MO3 (OC-R5 enforced) + MO4 (compliance ≥ 82%, same method).

### Risk Mitigation
- **Overclaim risk** → framed honestly as "two genuine novelties amid mostly-adoption work"; not marketed as a breakthrough release.
- Both novelties are **two-way doors at the mechanism level** (enforcement can revert; cadence policy can relax) — low innovation risk.

## Framework-Extension Specific Requirements

### Project-Type Overview
Convoke is **content (LLM-interpreted prompts) + Node.js update/migration/install tooling**, distributed via **npm + marketplace**, installed **parallel to BMAD** (not as a dependency). v4.1's technical surface is per-epic adoption against that substrate.

### Technical Architecture Considerations *(per epic)*
- **E4 — Release-channels + N-cadence policy.** Channel model (`stable`/`next`/`pinned`); `--channel` / `--pin CODE=TAG` CLI surface **wrapped as a slash-command skill** (per `slash-command-ux` rule), not bare CLI; **default-channel selection** (Priya's set-and-forget); **compat-only-vs-breaking detection + breaking-change protocol** (Amalik's failure path); manifest changes; versions read via `getPackageVersion()` (no-hardcoded-versions). The **binding N-cadence policy** ships as a governed artifact with the breaking-change protocol defined.
- **E2 — Module-help schema rename.** Mechanical `after`/`before` → `preceded-by`/`followed-by` in Convoke modules' `module-help.csv`; delta-only migration in `registry.js`; validation via `derive-counts-from-source`; blast-radius (touches shipped installs) → migration + parity.
- **E1 — Marketplace structural restructure.** `skills/` at root + `module.yaml` + `module-help.csv` per PR #9 spec; **inherits I97's PRD + Arch + 5 ADRs**; `plugin_name` override (`convoke-agents` npm vs module code); **BYO-URL fallback path documented + verified** (MO5); **reachable demand-signal/"request" path** (Samira's sub-journey).
- **E7 — Covenant enforcement.** Extend the v6.8 self-confirmation discipline to **OC-R5 pause points** across all `_bmad/bme/` pause-point skills (mechanically enumerated); per-skill retrofit; **`sequence-after: A8 Epic 1B`** to avoid double-touching activation sequences.
- **E3/E5/E6 — Spike harnesses.** Each ships a technical probe + **pre-registered go/no-go** (MO8). E6 adds Web-Bundle export format (`SKILL.md` + `INSTRUCTIONS.md` ZIP) + the demand-signal channel; E5 evaluates `bmad-investigate`/`.decision-log`; E3 probes whether `_bmad/custom/` TOML collapses wrapper patterns.

### Implementation Considerations
- **Reuse existing tooling:** `migration-runner`, `refresh-installation`, `validator` (agents/workflows/config/manifest), `config-merger` — migration files carry **delta logic only**.
- **Architecture rules (project-context):** `no-hardcoded-versions`, `no-process-cwd-in-libs`, `slash-command-ux-for-user-facing-tools`, `covenant-compliance-for-convoke-skills`, **namespace-decision per story** (v4.1 touches both `_bmad/bme/` *and* `scripts/update/` + upstream-conformance surfaces — flag the boundary explicitly).
- **Parity:** PF1-style battery for MO7; `test-fixture-isolation` for all new tests.
- **Process discipline:** atomic-by-agent commits; `lint-passes-before-review`; `verification-pipefail`.

## Project Scoping & Phased Development

### MVP Strategy & Philosophy
**Decision (ratified 2026-06-21):** The conformance-only-vs-all-seven question is resolved → **MVP = E2 + E4 + E7.**
**MVP Approach:** Platform + problem-solving MVP — ship the **defensive floor** (managed currency) and the **one true differentiator** (Covenant enforcement), prove the floor pays back (MO2), then scope v4.2 capability work against real data.
**Rationale:** E7 is the offense that matters; E6 is demand-unvalidated *reach*; E1 carries unbounded external-gatekeeper latency; the honesty constraint requires the floor to demonstrably pay back before piling on optional capability. **Prove-payback-first** minimizes the floor-eats-offense failure mode.
**Resource Requirements:** Solo-maintainer-constrained; MVP sized to fit maintainer bandwidth alongside v4.0 stabilization. **Gated on v4.0 ship** (`depends: I97 close`).

### MVP Feature Set (Phase 1)
**Core journeys supported:** Priya (currency-as-choice + set-and-forget), the Covenant moment, Amalik (floor-payback), lapsed/forked operator re-entry.
**Must-have capabilities:**
- **E2** — module-help schema rename (forced conformance)
- **E4** — release-channels + binding N-cadence policy + breaking-change protocol + default channel
- **E7** — OC-R5 enforcement across `_bmad/bme/` pause-point skills (`sequence-after` Epic 1B)
- **MO2b** — v4.1 absorption effort instrumented as the baseline

**Explicitly NOT in MVP:** E1, E3, E5, E6.

### Post-MVP Features
**Phase 2 (Growth — fast-follow):**
- **E1** — marketplace structural restructure. *Submit the PR async; ship MVP regardless of `bmadcode` latency; BYO-URL is the MVP discoverability floor.* Samira's demand-signal path lands here.

**Phase 3 (Vision — v4.2, deferred, spike/demand-gated):**
- **E6** — Web Bundles (demand-pull gated, MO6)
- **E3** — TOML customization (spike-gated, MO8)
- **E5** — `bmad-investigate`/`.decision-log` (spike-gated, MO8)
- Automated drift-absorption at steady N-1

### Risk Mitigation Strategy
- **Technical (floor-eats-offense):** prove-payback-first — E7 is *in* MVP, not deferred. E7 retrofit `sequence-after` Epic 1B (blast-radius).
- **Market:** E6 reach unvalidated → demand-pull gate (defer-not-kill); marketplace acceptance external → BYO-URL floor + async submit.
- **Resource:** maintainer-bandwidth → MVP is the minimum delivering floor + differentiator; all else gated. Gated on v4.0 ship.

## Functional Requirements

*Capability contract for v4.1 (MVP E2+E4+E7 + Phase-2 E1). v4.2 spike capabilities (E3/E5/E6) are intentionally excluded. Every FR traces to a journey or Measurable Outcome (bidirectional traceability validated during FR synthesis). FR identifiers are stable; non-contiguous numbering within groups reflects FRs added during review.*

### Currency Management *(E4)*
- **FR1:** An operator can pin Convoke to a chosen BMAD compat-floor.
- **FR2:** An operator can opt into a newer upstream channel independently of their pinned floor.
- **FR3:** An operator can select a default channel that Convoke tracks automatically *(set-and-forget)*.
- **FR4:** An operator can view which channel and floor they are currently on.
- **FR5:** An operator can perform channel/floor operations through Convoke's conversational skill surface.
- **FR25:** The system validates a chosen channel/floor combination and warns or refuses on an incompatible selection.

### Upstream Absorption & Cadence *(E4 + N-cadence policy)*
- **FR6:** The system can classify an upstream update as **declaration-only, conformance-required, or breaking** (the absorption ternary — see architecture; supersedes the original compat-only-vs-breaking binary).
- **FR7:** An operator can absorb a compat-only upstream update with no Convoke code change.
- **FR8:** The system applies a defined breaking-change protocol when an upstream change is breaking.
- **FR9:** Convoke publishes a binding N-cadence policy declaring its maximum compat-floor lag.
- **FR10:** The maintainer can record the v4.1 absorption effort as a reusable baseline for future cadence comparison.
- **FR24:** The system surfaces a warning when Convoke's compat-floor lag exceeds the N-cadence policy cap.

### Schema Conformance & Migration *(E2)*
- **FR11:** The system migrates Convoke modules' module-help schema to the v6.7 field convention (`after`/`before` → `preceded-by`/`followed-by`).
- **FR12:** An operator's installed Convoke is migrated to the new schema on update without manual edits.
- **FR13:** When a migration cannot apply cleanly, the operator receives a next-action message, not a bare error *(OC-R6)*.
- **FR14:** The system verifies behavioral parity across agents after a schema or channel change.

### Operator Covenant Enforcement *(E7)*
- **FR15:** A Convoke skill halts and waits for the operator at every OC-R5 decision point.
- **FR16:** A Convoke skill's agent self-confirms each activation step executed before beginning the main workflow.
- **FR17:** The system enumerates all `_bmad/bme/` pause-point skills mechanically to define enforcement coverage.
- **FR18:** The Covenant compliance audit can be re-run with the baseline method to confirm ≥ 82% (no regression).
- **FR26:** The system flags a `_bmad/bme/` skill that lacks OC-R5 self-confirm enforcement *(authoring-time durability check)*.

### Marketplace Distribution & Discoverability *(E1 — Phase 2)*
- **FR19:** Convoke is structured per the marketplace structural contract (`skills/` at root + `module.yaml` + `module-help.csv`).
- **FR20:** Convoke declares a `plugin_name` distinct from its internal module code.
- **FR21:** An operator can install Convoke via a documented BYO-URL path when a marketplace listing is unavailable.
- **FR22:** A standalone operator can submit a demand signal/request through a documented, low-friction path reachable outside the dev loop. *(MVP-cheap; decoupled from E6's build so demand can accumulate before the v4.2 E6 decision.)*

### Re-engagement & Recovery *(E4 migration)*
- **FR23:** A lapsed or forked operator can re-enter on a pinned floor via a documented migration path.

## Non-Functional Requirements

*Selective: Scalability and Accessibility are N/A (not a hosted service; CLI/content tool, no UI) and intentionally omitted.*

### Compatibility & Conformance
- **NFR1 (Parity):** 0 operator-facing regressions across the 5 classes, verified by the PF1-style battery whose coverage includes **all in-scope agents (enumerated from source)** (MO7).
- **NFR2 (Compat-floor):** Convoke declares and honors a ≤ N-3 compat-floor (binding policy — a chosen target); v6.3+ source format must not regress.
- **NFR3 (Marketplace structural):** the repo satisfies the structural contract **mechanically** (`skills/` at root, valid `module.yaml`, parseable `module-help.csv`) **and** BYO-URL install is verified end-to-end. *(External installer acceptance is an MO5 outcome, not a testable NFR.)*

### Reliability & Safety
- **NFR4 (Recoverable migrations):** migrations are **idempotent with a verified recovery path** — re-running a half-failed migration converges; never leaves a partially-written install. *(Honest: not "atomic" — `fs` isn't transactional.)*
- **NFR5 (Soft-warn preflight):** stderr WARNINGs, exit 0, never block install/update.
- **NFR6 (Blast-radius):** E2/E4 ship migrations + parity; additive changes don't mutate existing installs.

### Security & Safety
- **NFR7 (Path-safety):** user-path operations resolve + normalize + contains-check against the project root and refuse paths outside it.
- **NFR8 (No hardcoded versions/secrets):** versions via `getPackageVersion()`; no credentials in source; dependency hygiene.
- **NFR9 (Allowlist input validation):** channel/pin/CSV inputs validated against an **allowlist pattern** (semver/tag charset) — not merely "sanitized"; no arbitrary code or ref execution; CSV-injection prefix applied.

### Maintainability *(the floor-payback NFRs)*
- **NFR10 (Currency cost, class-dependent):** after v4.1, a **declaration-only (Class A)** upstream update absorbs with **0 changes to Convoke source/logic** (manifest/lockfile version bumps excluded); **conformance-required (Class B)** absorbs with bounded, mechanical, migration-assisted content edits (cheap, not zero — e.g. E2 itself); **breaking (Class C)** invokes the breaking-change protocol (MO2). The v4.1 absorption effort is captured as a baseline in a **defined unit** (maintainer-hours + files-touched + story-count) for later comparison (MO2b).
- **NFR11 (Covenant floor):** compliance ≥ 82% (baseline method); new `_bmad/bme/` skills **pass the covenant-compliance checklist = no FAIL cells** (N/A allowed with rationale) (FR26).

### Observability *(operational teeth for the "binding" policy)*
- **NFR12 (Cadence observability):** the system can report its cadence state — **current floor, declared cap, actual lag, last-absorption timestamp** — inspectable by the operator and logged. *A policy you can't observe isn't binding.*

### Performance
- **NFR13:** operator-facing ops carry **indicative budgets** (status/switch sub-second, migration single-digit seconds on a reference install) — **reported, not gated**; the CI parity battery + audit complete within a **declared CI time ceiling** (hard gate, set at implementation vs baseline); **no operation regresses > 2× against the captured baseline** (hard gate).

### Engineering Discipline *(merged provenance + governance)*
- **NFR14:** counts derive from source; migration files carry delta logic only; libs accept `projectRoot` (no `process.cwd`); every story ships **lint-clean** (`lint-passes-before-review`), verification commands honor **pipefail** (`verification-pipefail`), and a **namespace decision** is recorded.
