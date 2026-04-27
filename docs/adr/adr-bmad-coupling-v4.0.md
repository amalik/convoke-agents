---
initiative: convoke
artifact_type: adr
qualifier: bmad-coupling-v4.0
created: '2026-04-27'
schema_version: 1
---

# Architecture Decision Record: BMAD Coupling Strategy for Convoke 4.0

**Status:** ACCEPTED
**Date:** 2026-04-27
**Decision Makers:** Amalik (project lead), Winston (architect)
**Supersedes:** N/A (first formal strategic-bet ADR)

---

## Context

Convoke is a downstream extension of [BMAD METHOD](https://github.com/bmad-code-org/BMAD-METHOD), an agent-skill framework. Convoke 4.0 is the first release Convoke explicitly acts on its identity as an *ecosystem product* — not a side project — with everything that implies for distribution, governance, and sustainability.

Convoke 4.0 is also the first instance of a named, reusable release class — `host_framework_sync` — adopting BMAD METHOD v6.3.0 upstream. The playbook for this class ships alongside this ADR (see [`docs/host-framework-sync-playbook.md`](../host-framework-sync-playbook.md)).

The strategic question this ADR resolves: **How tightly should Convoke couple to BMAD?** This is not a one-time choice; it has cost-and-risk implications for every release. Convoke's actual value composition today is BMAD-leveraged — agent skill format (SKILL.md spec), install path (`.claude/skills/`), marketplace distribution (BMAD plugins marketplace), and config conventions (`_bmad/_config/`) all derive from BMAD investment. The coupling question is whether to lean INTO that derivation (and accept the risk that BMAD's trajectory shapes ours) or lean OUT (and accept the cost of independent framework-establishment).

Sprint 1 of the v6.3 adoption initiative produced three pre-registered experiments validating the foundational bets behind this ADR (see [`_bmad-output/planning-artifacts/convoke-note-sprint-1-experiments.md`](../../_bmad-output/planning-artifacts/convoke-note-sprint-1-experiments.md)):

- **EXP1 (migration dry-run on one agent):** PASS — 5-phase migration applies cleanly to a sandbox fixture; doctor-baseline unchanged. Validates that BMAD-coupled migration tooling is operationally viable.
- **EXP2 (marketplace PR pathfinder):** PASS via Path C — registry submission opens at upstream `bmad-code-org/bmad-plugins-marketplace`; manual schema-match closes M12a per OP-4 framing. Validates that BMAD-coupled distribution channel is operationally viable.
- **EXP3 (platform-agnostic exporter smoke test):** PASS — Carson agent exports to Claude Code + Copilot + Cursor adapters cleanly. Validates that BMAD coupling does NOT trap Convoke's agent skills into a single-platform corner; "best opinionated downstream of BMAD" is compatible with multi-platform reach.

The Sprint 1 outcomes establish the empirical floor: BMAD coupling, as practiced at v6.3 adoption, is operationally viable across migration + distribution + portability. The ADR formalizes the strategic posture this implies.

---

## Decision

**Verbatim from PRD `convoke-prd-bmad-v6.3-adoption/executive-summary.md:38` (strategic-bet body — bolded lead-in label `**Strategic bet (explicit, revalidated each major upstream release):**` elided as label-only; body character-identical including em-dashes per NFR18 zero-drift contract):**

> Convoke's value grows by being the best opinionated downstream of BMAD, not by being an independent agent framework. This release leans INTO BMAD coupling — marketplace distribution, shared config conventions, upstream tracking — accepting the risk that if BMAD's trajectory falters, Convoke falters with it. The bet is revalidated at each major upstream release (v6.4, v7.0, ...).

This is a **hypothesis, not a commitment** (per PM5). The bet is recorded so it can be revalidated. The Revalidation Trigger section below names the conditions under which this ADR should be re-opened.

---

## Alternatives Considered

### Alternative 1 — Lean OUT of BMAD coupling

**Description:** Treat Convoke as an independent agent framework with optional BMAD compatibility. Convoke runtime would not depend on BMAD; BMAD compatibility would be an opt-in adapter (e.g., a Convoke-to-BMAD-format converter). Marketplace presence would be one of many distribution channels rather than the canonical one.

**Why rejected:**
1. **Value composition is already BMAD-derived.** Convoke's agent skill format, install path, slash-command activation, and BMM module structure are all derived from BMAD investment. Decoupling would mean a multi-quarter rewrite — multiplying maintenance surface without proportional value gain.
2. **Maintainer bandwidth is solo + agent-assisted.** Sustaining an independent agent framework requires ongoing investment in the framework layer itself (spec evolution, runtime, distribution mechanics). Convoke's maintainer cannot sustain that load and also ship the agents that constitute Convoke's actual user-facing value.
3. **Ecosystem-energy cost.** Downstream-of-BMAD positioning lets Convoke benefit from BMAD's reach (marketplace traffic, conventions, upstream improvements) without bearing the framework-establishment burden. Independent framework positioning would force Convoke to compete for the same attention while still building atop BMAD-derived primitives — a worst-of-both-worlds posture.

### Alternative 2 — Defer coupling decision

**Description:** Ship Convoke 4.0 with status-quo coupling (whatever it was at 3.x) without explicit framing, and revisit the decision at v4.5 once more usage data is available. Avoid pinning the strategic bet now.

**Why rejected:**
1. **Convoke 4.0 IS a `host_framework_sync` release.** Coupling is already happening at the workstream level (migration to BMAD v6.3 + marketplace registration + `bmm-dependencies.csv` registry). Shipping without explicit framing creates incoherent positioning between what we deliver and what we say — users see BMAD-coupled behavior; release notes are silent on whether that's intentional.
2. **Per PM4 + PM5, "named release class without a recorded strategic bet = vapor."** The PRD makes the strategic bet a ship-blocking artifact (M15). Deferring the decision means deferring the release.
3. **More data won't change the cost-benefit shape.** The arguments for/against coupling are structural (maintainer bandwidth, value composition, ecosystem leverage) — they're stable regardless of usage data. Deferral would be procrastination, not deliberation.

### Alternative 3 — Hybrid coupling

**Description:** Selective BMAD coupling per workstream. Couple distribution (marketplace) and config conventions; decouple agent runtime and skill format. Convoke would ship a Convoke-native skill format that's BMAD-importable but not BMAD-derived.

**Why rejected:**
1. **Skill format and runtime are already BMAD-derived.** The canonical SKILL.md spec, slash-command activation pattern, and BMM module structure are BMAD primitives Convoke uses verbatim. Decoupling means the same multi-quarter rewrite as Alternative 1, scoped narrowly — same cost, less benefit.
2. **Mixed signals erode positioning.** "We're BMAD downstream for distribution but our agent format is something else" is a confusing pitch. Users either choose BMAD-compatible tools (in which case Convoke's hybrid is overhead) or they don't (in which case Convoke's BMAD-distribution-coupling is friction). The "best opinionated downstream of BMAD" value proposition requires consistent coupling, not selective.
3. **Hybrid is the worst of both worlds for revalidation.** Lean-out is revalidatable on framework-velocity terms; lean-in is revalidatable on BMAD-trajectory terms. Hybrid requires revalidating both layers separately — twice the work, less clarity.

---

## Consequences

### Positive

1. **Convoke benefits from BMAD's marketplace, shared config conventions, and agent-format ecosystem** without paying the framework-establishment cost. This is the explicit cost-leverage trade behind the Decision.
2. **Maintainer bandwidth scales** because Convoke focuses on the agent layer (where Convoke's value lives — Vortex, Gyre, Forge, Helm, BMM extensions) rather than the framework layer.
3. **Future v6.4 / v7.0 adoption has a named, reusable template** — the `host_framework_sync` release class formalized in [`docs/host-framework-sync-playbook.md`](../host-framework-sync-playbook.md). Innovation hypothesis I1 (`≥50% content reuse for v6.4/v7.0 maintainers`) becomes verifiable.
4. **Silent breakage becomes surfaced.** The `bmm-dependencies.csv` registry + `convoke-doctor` BMM-dependency check turn upstream BMAD changes that affect Convoke into visible WARNINGs/errors at install time, not mysterious agent failures at runtime.

### Negative

1. **Convoke's release velocity is partially gated by BMAD's.** Major BMAD revs trigger `host_framework_sync` releases; if BMAD ships slower, Convoke ships slower in concert.
2. **BMAD ecosystem-health risk is now Convoke's risk.** If BMAD upstream stops shipping (≥9 months) OR major-version cadence breaks OR project leadership changes affect BMAD direction, Convoke faces a strategic re-evaluation that this ADR's Revalidation Trigger formalizes.
3. **Convoke users inherit BMAD design choices.** Some are excellent (canonical skill format, marketplace distribution); some are quirky (`_bmad/` directory naming preserved for compatibility — see Convoke's no-rename rule). Coupling means Convoke can't unilaterally fix BMAD's quirks.
4. **Strategic bet is by definition revisable.** This ADR is not a commitment to BMAD coupling forever — it's a hypothesis recorded with named owner + named trigger conditions. If BMAD's trajectory falters, Convoke pivots, and this ADR is superseded by `adr-bmad-coupling-v4.x.md` or similar.

---

## Revalidation Trigger

**Condition.** This ADR is re-opened (revalidated) at any of the following events:

1. **At each BMAD major upstream release** (v6.4, v7.0, v7.5, …). Each major rev is a natural revalidation gate — the `host_framework_sync` playbook execution itself includes a "revalidate ADR" step.
2. **If BMAD upstream stops shipping for ≥9 months** (a ship-cadence health check; threshold based on v6.x cadence observed in 2025-2026).
3. **If BMAD major-version cadence breaks unexpectedly** (e.g., a v7.0 release skipped over v6.4 with breaking changes that don't follow the established BMAD release-cycle pattern).
4. **If BMAD project leadership changes** affect the strategic direction Convoke depends on (e.g., maintainer transition with stated direction changes).

**Owner.** **Amalik (project lead).** Revalidation is the project lead's responsibility. Winston (architect) is the secondary signatory on the follow-on ADR.

**Process.**

1. **Re-run Sprint 1 experiments** (EXP1 migration dry-run + EXP2 marketplace PR pathfinder) at the new upstream release version. Optionally re-run EXP3 (platform-agnostic exporter) if BMAD changed the canonical skill format.
2. **Assess Convoke's value composition** against the alternatives in this ADR. If Lean-OUT or Hybrid alternatives have become materially more viable (e.g., maintainer bandwidth changed; BMAD reach changed; Convoke's user base changed), update the assessment.
3. **Author follow-on ADR** at `docs/adr/adr-bmad-coupling-v4.x.md` (or `v5.0.md`, etc., per release version) capturing one of three outcomes:
   - **GO** — coupling continues; this ADR is superseded only in date, not in substance.
   - **PIVOT** — adjustment within the coupling posture (e.g., add hybrid elements; revise revalidation threshold).
   - **DECOUPLE** — full strategic pivot away from BMAD coupling; major framing reset (Convoke positioning, distribution, runtime all rethought).

**Anti-vapor framing (per PM5).** Revalidation is not "we'll think about it." It is a concrete protocol with a named owner, named conditions, and a defined output (follow-on ADR with one of three explicit outcomes). The bet remains a hypothesis, not a commitment.

---

## References

- **PRD (canonical source for the strategic bet):** [`_bmad-output/planning-artifacts/convoke-prd-bmad-v6.3-adoption/index.md`](../../_bmad-output/planning-artifacts/convoke-prd-bmad-v6.3-adoption/index.md) (sharded; entry point) → especially `executive-summary.md:38` (verbatim quote in Decision section above).
- **Sprint 1 experiments artifact (empirical floor):** [`_bmad-output/planning-artifacts/convoke-note-sprint-1-experiments.md`](../../_bmad-output/planning-artifacts/convoke-note-sprint-1-experiments.md).
- **`host_framework_sync` playbook (operationalizes this strategic bet):** [`docs/host-framework-sync-playbook.md`](../host-framework-sync-playbook.md).
- **PRD success criteria — M15 (this ADR):** [`success-criteria.md:62`](../../_bmad-output/planning-artifacts/convoke-prd-bmad-v6.3-adoption/success-criteria.md).
- **Innovation hypothesis I1 (playbook reusability):** [`innovation-novel-patterns.md:11-30`](../../_bmad-output/planning-artifacts/convoke-prd-bmad-v6.3-adoption/innovation-novel-patterns.md).
- **Operating principles PM4 + PM5 (anti-vapor + hypothesis-not-commitment framing):** [`success-criteria.md`](../../_bmad-output/planning-artifacts/convoke-prd-bmad-v6.3-adoption/success-criteria.md) — Operating Principles section.
- **Repo organization conventions ADR (format precedent):** [`_bmad-output/planning-artifacts/convoke-adr-repo-organization-conventions-2026-03-22.md`](../../_bmad-output/planning-artifacts/convoke-adr-repo-organization-conventions-2026-03-22.md).
