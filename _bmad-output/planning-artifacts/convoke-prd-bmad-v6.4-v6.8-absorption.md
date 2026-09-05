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
  whyNow: 'Upstream at N-7 (v6.10, re-baselined 2026-08-09; was N-6/v6.8 at authoring); gap threatens faithful-downstream credibility; spikes scoped; v4.0 about to ship → natural commitment-locking moment'
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
absorption_window: 'v6.4–v6.12'
window_amended: '2026-09-05'
window_amendment_note: 'Re-baselined a SECOND time, v6.10 → v6.12 (2026-09-05), on the same Option-B narrow basis. Delta classified Class A across the board; MVP epic scope unchanged and no story added. Filename qualifier `bmad-v6.4-v6.8-absorption` now understates the window by FOUR minor versions and is retained only pending the governed rename tracked as backlog I121; `absorption_window` above is authoritative. Applies identically to the paired arch and epic artifacts.'
openScopeDecisions:
  - 'RESOLVED 2026-08-09: absorption window re-baselined v6.4–v6.8 → v6.4–v6.10 (narrow amendment, Option B). Trigger: upstream shipped v6.9.0 + v6.10.0 after the 2026-06-21 ratification, and the local dev tree has run BMAD 6.9.0 since 2026-06-27 — i.e. E2 was scoped to conform to a schema the maintainer was no longer running. Mechanical classification of the full v6.9+v6.10 delta returned Class A across the board (see "v6.9–v6.10 Delta Classification"), so MVP epic scope is UNCHANGED and the re-baseline costs ~0 implementation. What changes: the declared floor (needed for NFR2 ≤N-3 headroom), E5 shrinks (upstream retired bmad-investigate), and the delta becomes AD9 baseline entry #1 as a Class-A record.'
  - 'RESOLVED 2026-06-21 (Step 8): MVP = E2+E4+E7 (floor + differentiator). E1 = Phase 2 fast-follow (async marketplace submit; BYO-URL is MVP discoverability floor). E3/E5/E6 = Phase 3 / v4.2 (spike + demand-gated). Rationale: prove-payback-first; E7 is the offense that matters, E6 is demand-unvalidated reach, E1 has unbounded external-gatekeeper latency.'
inputDocuments:
  - _bmad-output/planning-artifacts/convoke-covenant-operator.md
  - _bmad-output/planning-artifacts/convoke-spec-covenant-compliance-checklist.md
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

# Product Requirements Document - Convoke v4.1 (Upstream BMAD Absorption)

**Author:** Amalik
**Date:** 2026-06-21 · **Window amended:** 2026-08-09

> **Absorption window: v6.4 → v6.12.** Widened from v6.8 on 2026-08-09 and again from v6.10 on 2026-09-05 (Option B, narrow re-baseline, both times). The `v6.4-v6.8` filename qualifier now understates the window by four minor versions and is retained only pending the governed rename (backlog **I121**); frontmatter `absorption_window` is authoritative. **MVP epic scope is unchanged** — both added deltas classified Class A across the board. See *v6.9–v6.10 Delta Classification* and *v6.11–v6.12 Delta Classification*.

## Executive Summary

Every downstream framework extension faces an existential tension: **drift too far from its upstream and it becomes an unmaintained fork; chase every upstream release by hand and it never ships value of its own.** Convoke v4.1 resolves this tension structurally — absorbing upstream BMAD Method changes from **v6.4 through v6.10** not as a defensive scramble, but as the vehicle for shipping Convoke's own differentiated value.

The bookkeeping: Convoke's declared product baseline is BMAD v6.3 (`compat-preflight.js` `REQUIRED_BMAD_VERSION`); upstream head is **v6.10.0**, leaving Convoke seven releases behind (**N-7**). *(Authored at N-6/v6.8; re-baselined 2026-08-09 when upstream shipped v6.9.0 and v6.10.0. A third version is in play and worth stating plainly: the maintainer's local dev tree has run BMAD **6.9.0** since 2026-06-27 — so the product baseline, the dev environment, and upstream head are three different numbers.)* v4.1 is a focused, time-bounded catch-up Initiative (backlog **I113**), committed under the 2026-05-25 **Option F** decision, and **gated on the v4.0 ship**.

The strategic posture is **offensive with a defensive floor**. The *defensive floor* is twofold: **release-channels** (E4 — let operators pin Convoke's BMAD floor and opt into newer upstream separately) plus a **newly-established, binding N-cadence policy** — a v4.1 deliverable, not a pre-existing fact — committing Convoke to a defined lag behind upstream. Together they convert "staying current" from a recurring fire drill into a managed, structural capability. **That floor earns the right to play offense.**

The offense is two honestly-distinct payloads. **E7 — Operator Covenant enforcement — is Convoke's true differentiator:** where competing agent frameworks compete on capability density, Convoke competes on **operator-experience-as-architecture** — making the human operator the first-class *resolver* of every decision a skill cannot safely make alone. This is **evidence-backed and improving, not proven-perfect**: the baseline Covenant audit scores 82% compliance with documented caveats. **E6 — Web Bundles — is a different kind of payload: distribution *reach*, not differentiation** — a net-new channel (Gemini Gems, ChatGPT Custom GPTs) for the standalone segment, whose value is **demand-contingent** on an estimated ~40% of users and must be validated, not assumed.

### What Makes This Special

v4.1 is the release where Convoke proves it can be **both faithful and opinionated** — fully conformant to a fast-moving upstream *and* carrying differentiated value most downstreams never sustain. The core insight: **for a downstream framework, currency is not overhead — but winning means building the mechanism that makes currency cheap, so it stops competing with differentiation.** The release-channels-plus-policy floor is that mechanism; the Operator Covenant is the differentiation it protects.

The work splits into two tracks with different commitment profiles. The **Conformance track** — marketplace structural adoption (E1), module-help schema rename (E2), release-channels (E4) — is forced, structural, largely one-way-door work Convoke must do to remain a faithful downstream. The **Capability track** — TOML customization (E3), `bmad-investigate`/decision-log evaluation (E5), Web Bundles (E6) — is optional, spike-gated, two-way-door work. **Reversibility and strategic-value are orthogonal:** E6 and E7 stay load-bearing for positioning even where reversible, and must not be cut merely because they are "optional."

> **E5 amendment (2026-08-09).** Upstream **retired `bmad-investigate` in v6.10** with the published rationale *"reached identical conclusions at higher cost."* E5's `bmad-investigate` half is therefore **closed no-go by upstream evidence** — the spike was run for us, and the answer is negative. Only the `.decision-log` half of E5 survives to v4.2. This is scope subtraction at zero cost, and a small validation of the spike-gating discipline: the two-way door stayed closed until evidence arrived.

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
- **N-cadence = Convoke's declared BMAD *compat-floor*, not feature-parity.** Binding policy caps the lag at **≤N-3 (firm)**; the current N-7 gap closes toward **≤N-2 at ship** (scope-dependent; see *Project Scoping*).
  - **Why the window had to widen (the NFR2 argument).** This is the structural reason the re-baseline was not optional. Absorbing only through v6.8 would set the floor at 6.8 while upstream already sits at 6.10 — **N-2 at best on ship day, and worse for every upstream release during the sprint.** A binding ≤N-3 policy would be at or through its cap the moment it was published. Absorbing through v6.10 sets the floor at 6.10, restoring real headroom under the cap. A cadence policy breached at birth is not a floor.
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
**Opening:** Catching up to upstream is a multi-week fire drill — *this very N-7 absorption is the scar* (and the fact that it grew from N-6 to N-7 mid-planning is the scar's sharpest edge).
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
- **Module-help schema conformance:** `after`/`before` → `preceded-by`/`followed-by`, per v6.7 (E2). **Mechanically verified 2026-08-09** (`mechanical-research-enumeration`): of the 10 `module-help.csv` files in the tree, exactly **one** is on the old `after`/`before` schema — `_bmad/bme/_vortex/module-help.csv`, Convoke-owned. FR11's premise holds. **But the same sweep surfaced a second Convoke-owned file that FR11 does not describe:** `_bmad/bme/_team-factory/module-help.csv` uses a *third*, non-conformant column set entirely (`module,phase,name,code,sequence,workflow-file,command,required,agent,options,description,output-location,outputs,` — note the trailing comma), which is neither the old schema nor the new one. It needs a **conversion**, not a rename. See E2 scope note.
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
- **E2 — Module-help schema conformance.** Two distinct sub-surfaces, confirmed by source enumeration 2026-08-09 (**not** one, as originally scoped):
  1. **Rename** — mechanical `after`/`before` → `preceded-by`/`followed-by` in `_bmad/bme/_vortex/module-help.csv` (the only file on the old schema).
  2. **Conversion** — `_bmad/bme/_team-factory/module-help.csv` is on a third, non-conformant column set and needs restructuring to the canonical 13-column header (plus removal of its trailing comma). Higher risk than the rename: column semantics must be mapped, not renamed, so it carries its own parity check.

  Delta-only migration in `registry.js`; validation via `derive-counts-from-source` (enumerate `module-help.csv` files, do not hardcode "1" or "2"); blast-radius (touches shipped installs) → migration + parity. *This sub-surface split predates v6.9/v6.10 and was missed at authoring; it is the only MVP scope growth from the 2026-08-09 amendment.*
- **E1 — Marketplace structural restructure.** `skills/` at root + `module.yaml` + `module-help.csv` per PR #9 spec; **inherits I97's PRD + Arch + 5 ADRs**; `plugin_name` override (`convoke-agents` npm vs module code); **BYO-URL fallback path documented + verified** (MO5); **reachable demand-signal/"request" path** (Samira's sub-journey).
- **E7 — Covenant enforcement.** Extend the v6.8 self-confirmation discipline to **OC-R5 pause points** across all `_bmad/bme/` pause-point skills (mechanically enumerated); per-skill retrofit; **`sequence-after: A8 Epic 1B`** to avoid double-touching activation sequences.
- **E3/E5/E6 — Spike harnesses.** Each ships a technical probe + **pre-registered go/no-go** (MO8). E6 adds Web-Bundle export format (`SKILL.md` + `INSTRUCTIONS.md` ZIP) + the demand-signal channel; **E5 evaluates `.decision-log` only** — its `bmad-investigate` half is closed no-go by upstream's v6.10 retirement (see E5 amendment above); E3 probes whether `_bmad/custom/` TOML collapses wrapper patterns.

### Implementation Considerations
- **Reuse existing tooling:** `migration-runner`, `refresh-installation`, `validator` (agents/workflows/config/manifest), `config-merger` — migration files carry **delta logic only**.
- **Architecture rules (project-context):** `no-hardcoded-versions`, `no-process-cwd-in-libs`, `slash-command-ux-for-user-facing-tools`, `covenant-compliance-for-convoke-skills`, **namespace-decision per story** (v4.1 touches both `_bmad/bme/` *and* `scripts/update/` + upstream-conformance surfaces — flag the boundary explicitly).
- **Parity:** PF1-style battery for MO7; `test-fixture-isolation` for all new tests.
- **Process discipline:** atomic-by-agent commits; `lint-passes-before-review`; `verification-pipefail`.

## v6.9–v6.10 Delta Classification *(added 2026-08-09 with the window re-baseline)*

The window widened from v6.8 to v6.10. Per **FR6** every upstream change must be classified into the absorption ternary before it can be scoped. Below is that classification, run against the source tree rather than against release notes — release notes state what upstream changed, not what Convoke is coupled to.

**Result: Class A across the board.** No item in v6.9 or v6.10 forces a Convoke source or logic change. MVP epic scope is therefore unchanged by the re-baseline.

| Upstream change | Rel | Class | Evidence (mechanically verified 2026-08-09) |
|---|---|---|---|
| `bmad-automator` deprecated → `bmad-loop` module | 6.10 | **A** | Zero references to either name anywhere in the tree. No coupling to break. |
| `bmad-investigate` **retired** | 6.10 | **A** | Registered in 4 manifests (`skill-manifest.csv` ×1, `bmad-help.csv` ×1, `files-manifest.csv` ×3, `bmm/module-help.csv` ×1) — but all four are **BMAD-owned and installer-refreshed**, and `validator.js` asserts on **none** of them (0 grep hits). Convoke's own references are documentation-only (this PRD, ADR-001, two notes). |
| `post-install-message` registry field | 6.10 | **A** | Zero occurrences in the tree; Convoke's `src/module.yaml` and `_bmad/bme/_vortex/module.yaml` do not use it. The field is **new, optional, and additive** — Convoke conforms by omission. *(Noted as an opportunity, not an obligation: it is a first-class slot for the `convoke-install-vortex` post-install instructions currently carried in prose. Route to E1/Epic 4 as a nice-to-have, not to E2.)* |
| `sprint-status.yaml` gains `action_items` | 6.9 | **A** | Convoke's `sprint-status.yaml` has no `action_items` key, and the file is **generated and consumed by upstream-owned skills** (`bmad-sprint-planning`, `bmad-retrospective`), not by Convoke code. Affects the maintainer's dev process; does not touch the shipped product. |
| New installer platform targets (hermes-agent, CodeWhale) | 6.9 | **A** *(capability gap logged)* | Upstream's installer target list does not bind Convoke's exporter. Convoke's `scripts/portability/generate-adapters.js` emits **copilot + cursor** adapters only. Conformance is unaffected — but for the ~40% standalone segment, target-coverage parity is a **capability** question. → v4.2, with an AD5 compat-surface-audit pass. |
| `uv run` standardization (v7 breaking pre-announcement) | 6.9 | **A** *(watch)* | Convoke ships **zero** `.py` files and no `_bmad/bme/` skill invokes `python3`. Exposure is **inherited only** — agent activation calls BMAD-owned `_bmad/scripts/resolve_customization.py`. Action at v7: check `convoke-doctor` prerequisite docs. Nothing more. |
| Canonical shared memlog (`src/scripts/memlog.py`) | 6.9 | **C-candidate**, opt-in | Not forced — Convoke is not coupled to it. But it is the one item with strategic weight: Vortex handoff contracts **HC1–HC10** and the initiative-lifecycle backlog *are* Convoke's working-memory substrate, and upstream now ships a canonical one. Sitting on it vs. competing with it is a deliberate architectural choice. → **new v4.2 spike**, logged so it is not lost. |
| `bmad-architecture` rewrite (`ARCHITECTURE-SPINE.md` source of truth) | 6.9 | — *(capability)* | Convoke's `convoke-arch-*.md` artifacts are a different shape. Artifact-governance taxonomy may want a spine-shaped entry. → v4.2. |
| `bmad-forge-idea`; party-mode custom parties + persistent memory + preloaded "Code Review Crew" | 6.9/6.10 | — *(overlap)* | **Positioning overlap, not code.** `bmad-forge-idea` overlaps Vortex Hypothesize/Externalize (Liam/Wade); the five-lens Code Review Crew overlaps Gyre's `review-coach` and the Covenant audit lenses. → run the **Capability Evaluation Framework** overlap analysis before v4.2 scoping (`capability-form-factor-evaluation` rule). |
| Edge Case Hunter named-set generalization (+50–100% catch rate); deletion audit integrated | 6.10 | — *(process)* | Not absorption scope. But it **recalibrates `code-review-convergence`** in `project-context.md`: that rule's Round-1/Round-2 gate is tuned against observed finding volume (the Story 7.3 scar — 3 rounds, 30 findings). A materially sharper Round-1 hunter trips the "any HIGH → Round 2" gate more often. Rule still holds; its cost model shifts. |
| `validate-skills` exempts deprecated skills from trigger-phrase check | 6.10 | **A** | Additive. Useful downstream for U15 (4.0 deprecation notices) — deprecated Convoke skills no longer need trigger phrases to pass validation. |

### What this result means for the PRD's central bet

MO2 claims a *declaration-only* upstream update absorbs with **zero Convoke source/logic change**, enabled by the data/logic separation constraint. The v6.9+v6.10 delta is the **first real-world test of that claim against releases Convoke did not plan for** — two full minors, ~20 discrete changes, arriving unannounced after the architecture was ratified. It absorbed at Class A with zero forced code change.

That is genuine evidence, and it should be recorded as such — but it should be **weighted honestly**, because a Covenant-led product is held to that standard:

- It is **n=1**, on a window that happened to contain no contract-bearing changes Convoke consumes. A single Class-A window does not establish that Class-A is the common case; it establishes that Class-A is *achievable* and that the classifier can *detect* it.
- The result is partly **structural luck**: Convoke's parallel-install model (not a package dependency) and its zero-Python surface are what made `uv run` and the manifest churn inert. Those properties were not designed as currency insurance, though they function as it.
- The honest reading is **"the bet survived its first unplanned test,"** not "currency is solved."

**Therefore:** this delta is recorded as **AD9 baseline entry #1**, classified Class A, `files_touched: 0`, `effort:` classification-only. It is a legitimate MO2b data point and the first entry in the cadence baseline — which is precisely what AD9 exists to accumulate.

## v6.11–v6.12 Delta Classification *(added 2026-09-05 with the second window re-baseline)*

The window widened from v6.10 to v6.12. Per **FR6** every upstream change must be classified into the absorption ternary before it can be scoped. The classification below was run against the **source tree** — `git diff v6.10.0 v6.12.0` over a real clone of `bmad-code-org/BMAD-METHOD` — and deliberately **not** against the release notes, per the finding recorded in the v6.9–v6.10 pass: release notes state what upstream changed, not what Convoke is coupled to.

Raw delta: **651 files, +28,625 / −26,230**. The great majority is documentation, i18n and website; the load-bearing churn is in `src/bmm-skills/`, `src/core-skills/`, `src/scripts/` and `tools/installer/`.

**Result: Class A across the board.** No item in v6.11 or v6.12 forces a Convoke source or logic change. MVP epic scope is unchanged, and unlike the previous re-baseline this one adds **no** story.

| Upstream change | Class | Evidence (mechanically verified 2026-09-05) |
|---|---|---|
| `src/bmm-skills/` restructured: `1-analysis` / `2-plan-workflows` / `3-solutioning` / `4-implementation` → `agents` / `plan` / `ship` / `v6-shims` | **A** | **Changes no installed path and no skill ID.** Upstream's own `v6-shims/README.md` states it: *"The folder is grouping only: the installer discovers skills recursively and installs each one under its own `name`, so nesting here does not change any installed path or skill ID."* Independently, Convoke references those source paths only in `_bmad/_config/*.csv` (BMAD-owned, installer-refreshed) and in `tests/fixtures/portability-project/`, a frozen fixture upstream churn cannot reach. No Convoke source resolves them. |
| **Four skills retired outright, with NO shim** — unlike the 14 deprecated IDs in `v6-shims/`: `bmad-check-implementation-readiness`, `bmad-agent-tech-writer`, `bmad-index-docs`, `bmad-shard-doc` | **A** | Convoke's references are name-keyed lookup tables in `scripts/portability/classify-skills.js` — dispatch rules that simply stop firing — plus one comment in `scripts/audit/audit-bmm-dependencies.js`. `scripts/update/lib/validator.js` asserts on none of them (0 grep hits). Crucially, `classify-skills.js` **reads and rewrites manifest rows in place and never deletes them** (`:521`→`:621`), so the retirements do not silently drop rows. `bmad-index-docs` and `bmad-shard-doc` are additionally **vendored** by Convoke under `_bmad/core/skills/` and `_bmad/core/tasks/`, so they remain part of the shipped product regardless of upstream. |
| `resolve_customization.py` refactored → `from config_utils import …` (new sibling module) + PEP 723 `requires-python >=3.11` | **A** *(inherited exposure — watch)* | CLI contract preserved (`--skill`, `--key` both intact). The script is BMAD-owned in `_bmad/scripts/`, installer-refreshed, and Convoke ships zero `.py` files, so AD5's property (b) holds. **But activation now requires TWO co-located files where it required one** — a partial refresh breaks every agent activation, Convoke's included. This is an operator-environment concern, not a Convoke code change: it strengthens the case for backlog **I132**'s preflight soft-warn rather than changing the class. |
| **Eight skill names added** (count 46 → 50) — but **four are shimmed replacements, not net-new**: `bmad-build` ← `bmad-quick-dev`, `bmad-build-auto` ← `bmad-dev-auto`, `bmad-walkthrough` ← `bmad-checkpoint-preview`, and `bmad-deep-recon` ← the three `bmad-*-research` skills consolidated. Genuinely new: `bmad-editorial-review`, `bmad-project-context`, `bmad-review`, `bmad-review-verification-gap`. | **A** *(capability overlap → v4.2)* | **Zero exact-name collisions** in the Convoke tree. Recorded because a first substring pass reported 14 — every one an artefact of `bmad-review` ⊂ `bmad-review-edge-case-hunter`, `bmad-build` ⊂ `bmad-workflow-builder`. The old IDs all keep working via `v6-shims/`, which upstream commits to shipping by default until v7 (*"Removal rides the v7 cut — never a 6.x minor"*) — so this is additive for any consumer, Convoke included. Positioning overlap remains, and it is a capability question rather than a conformance one: `bmad-project-context` against `bmad-generate-project-context` + `project-context.md`; `bmad-review` / `bmad-review-verification-gap` / `bmad-deep-recon` against Gyre's `review-coach` and `code-review-convergence`. → run the Capability Evaluation Framework overlap analysis at v4.2 scoping (`capability-form-factor-evaluation`). |
| `module-help.csv` schema | **A** | **Header unchanged** at both tags — the same 13 columns in `src/bmm-skills/` and `src/core-skills/`. **E2's migration target is therefore stable**: Stories 2.1 and 2.4 do not move. |
| Installer: `shim-policy.js` and `modules/git-env.js` new; `uv-check.js`, `manifest.js`, `manifest-generator.js`, `core/installer.js` modified | **A** | Upstream-owned install machinery. AD5 property (a) — parallel install, no package dependency on `bmad-method` — continues to hold, so installer churn is inert for Convoke. |

### What this result means for the PRD's central bet

This is **AD9 baseline entry #2**, and it is the second consecutive Class-A window. Two things make it a *stronger* test than the v6.9–v6.10 window, and one thing keeps it from being decisive:

- **It contained structural churn, not just additive change.** A four-way directory restructure of `src/bmm-skills/` and four unshimmed skill retirements are exactly the shape that should force downstream work. Neither did. The v6.9–v6.10 window, by contrast, contained no contract-bearing changes at all.
- **The property doing the work is now identifiable.** Class A here rests on two structural facts: Convoke's references to upstream skill names are *dispatch rules* rather than *assertions*, and `classify-skills.js` never deletes manifest rows. The first is a design property worth protecting; the second is closer to luck, and AD5's audit assertions should cover it.
- **It is still n=2, and both windows were classified by the same person using the same method.** Two Class-A results establish that the cheap-currency bet is *holding*, not that it is proven. The honest reading is unchanged from 2026-08-09: **the bet has now survived two unplanned tests.**

**Consequence for Epic 1 (Managed Currency).** The MVP's assisted operator-declaration remains adequate, and the case for building the *automated* classifier weakens with each cheap window. Two data points do not yet justify the 10-story engine; the trigger for re-opening it is a Class B/C window or a classification pass that costs materially more than one session. Recorded here so the decision rests on the accumulating distribution AD9 exists to build, rather than on appetite.

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
- **FR11b:** The system converts Convoke module-help files that are on a **non-conformant column set** (neither the pre- nor the post-v6.7 schema) to the canonical 13-column header. *Distinct from FR11: a structural conversion with column-semantics mapping, not a field rename. Added 2026-08-09 — source enumeration found `_bmad/bme/_team-factory/module-help.csv` on a third column vocabulary (`module,phase,name,code,sequence,workflow-file,command,required,agent,options,description,output-location,outputs,`) that FR11 does not describe. Columns with no canonical target (`sequence`, `agent`, `options`) must be resolved explicitly, and a dropped column requires operator confirmation (OC-R5).*
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
