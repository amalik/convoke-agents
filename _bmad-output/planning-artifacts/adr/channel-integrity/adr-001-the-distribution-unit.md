---
initiative: convoke
artifact_type: adr
qualifier: channel-integrity-the-distribution-unit
created: '2026-09-26'
status: active
decision_status: proposed
accepted: none
schema_version: 1
related_initiative: 'Channel integrity (2026-09-26)'
related_decision: 'ADR-004 (invocable-unit declaration); meta-model ADR-001 (name registry)'
related_epic: none
supersedes: none
qualifier_role: operator-authored
signoff_by: none
---

# ADR-001: What unit does Convoke distribute?

**Status:** **PROPOSED — RULING OPEN.** No option is selected. This ADR exists to make
the ruling cheap, not to pre-empt it.
**Proposed:** 2026-09-26
**Decision owner:** Amalik
**Evidence:** [`convoke-note-channel-integrity-findings-2026-09-26.md`](../../convoke-note-channel-integrity-findings-2026-09-26.md)

---

## Context

Convoke's unit of value is a **module**: agents, workflows, handoff contracts and a
config, coherent together. Every agent-skill distribution channel in existence has a
unit of **one skill**.

Upstream BMAD resolved the same tension on 2026-09-05 (PR #2768, merged to `main`,
+10,907 / −35,677, in no tagged release) and **not** by atomising its personas. It made
the flow addressable: 5 persona skills, 22 personaless process skills, and a `bmad` hub
skill that materialises the runtime. A lone skill self-diagnoses and names the command
that repairs it.

Convoke's measured position, derived 2026-09-26: **7 of 11 agents reachable, 0 of 29
workflows, 0 of 14 contracts.** The seven personaless skills that do exist are all
Convoke's own tooling. Convoke put its plumbing in the channel and kept its product
out of it.

### Why this is an ADR and not a requirement set

A PRD for this work was drafted on 2026-09-26 and **superseded the same day**. Five
independent reviews found that its requirements had already foreclosed three of the
four options below while the document declared the question open. A requirement set
cannot be written before this ruling without deciding it by accident. That is the
lesson this ADR encodes.

### Constraints the ruling must respect — all verified, none assumed

1. **The meta-model budget is spent.** All three ratified deliverables shipped:
   `_bmad/bme/_config/name-registry.csv`, `scripts/audit/name-registry-integrity.js`
   wired at `ci.yml:231`, and meta-model ADR-001 (accepted 2026-09-05), which records
   *"Three deliverables, no epic, budget held."* **Zero new ADRs, registries or checks
   are available under the ratified baseline.** An option needing them needs a new
   ratification first.
2. **`ADR-004 C2` already fixed the declaration shapes** — an agent in
   `agent-registry.js`, or a `config.yaml` workflow entry with `standalone: true`. It
   *considered and rejected* a third shape: *"the repo would then have three ways to
   declare an invocable unit instead of two."* Making contracts addressable needs that
   ADR amended, not assumed.
3. **`preflight-soft-warn` (`project-context.md:419`) names this case.** Future
   dependency preflights *"MUST follow the same contract: stderr WARNING + exit 0
   pass-through; never `process.exit(non-zero)`"*, because false-positive hard-blocks
   *"would trap operators with legitimate non-standard installs (git-clone, monorepo,
   **alternative distribution channels**)."* Any option whose skills refuse to run
   collides with this rule and with Operator Rights OC-R1 and OC-R5, and needs a
   recorded amendment rather than silence.
4. **`team-state-directories` is absolute.** A team keeping state owns `.<team>/` at
   the project root; Gyre's `full-analysis/step-01-initialize.md` branches on
   `.gyre/capabilities.yaml`. Any option that makes Gyre's workflows addressable from a
   plugin cache must say what happens to that file.
5. **No cadence cap may be stated as N-1.** `convoke-arch-bmad-v6.4-v6.8-absorption.md:230`
   records the floor at **N-8** and warns a literal N-1 *"would be in breach on day one
   and would soft-warn permanently."*
6. **Two segments, one codebase.** ~60% BMAD-addon, for whom the channel is the
   doorway; ~40% standalone, who need the whole module and are served by
   `convoke-export`.
7. **There is no self-serve retraction from skills.sh.** A published name is durable.

## Options

### S1 — Installer-led

npm plus `convoke-install-*` remains the only supported path. Channel listings become
funnel entries that state their dependency.

- **Serves:** the 40% standalone segment fully.
- **Starves:** the 60% addon segment, whose channel this is not.
- **Cost:** lowest. No new declaration shape; constraint 1 respected.
- **Collides with:** constraint 3 if the funnel entry *refuses* rather than warns.

### S2 — Publish the differentiator

Promote the 29 workflows and 14 contracts to addressable personaless skills. Personas
go thin. The module stays the unit of *coherence*; it stops being the unit of
*distribution*.

- **Serves:** both segments, in principle.
- **Cost:** highest declared. 43 new addressable units, 43 names from a registry whose
  budget is spent, and an ADR-004 amendment for the contract shape (constraint 2).
  **Note the mechanism partly exists** — `refresh-installation.js` already generates a
  wrapper per `standalone: true` workflow, but **zero** Vortex or Gyre workflows carry
  that flag today, so this is a data change plus a per-module wiring change, not new
  machinery.
- **Collides with:** constraints 1, 2, 4.

### S3 — Two artifacts, one source

`_bmad/bme/` stays the authoring source; a build step emits the channel tree.

- **Serves:** both segments.
- **Cost:** a generator and a drift gate. Constraint 1 forbids the gate under the
  current budget.
- **Note:** this is the option the superseded PRD's FR13 silently eliminated by
  requiring skills to *exist in the repository*.

### S4 — Router stub

One installer/finder plugin on the marketplace; the full catalog on skills.sh. Uses the
channel asymmetry rather than fighting it.

- **Precedent:** the only pattern large suites actually run. NVIDIA/skills (**383**
  skills) publishes one plugin exposing one skill, `nvidia-skill-finder`.
  HuggingFace/skills publishes one plugin, `hf-cli`, and the other 25 arrive through
  its own CLI.
- **Serves:** the 60% addon segment through a channel with real semver dependencies.
- **Cost:** moderate; needs a hub skill, which Convoke does not have — its installer is
  a `bin` entry, which is also why Gyre cannot travel.
- **Note:** upstream's own marketplace copy is a generation behind its skills.sh copy.
  Nobody runs both channels at parity.

## Decision

**OPEN.** To be ruled by Amalik.

A ruling should state: the option; whether it re-ratifies the baseline budget
(constraint 1); whether it amends ADR-004 (constraint 2) and `preflight-soft-warn`
(constraint 3); and what happens to `.gyre/` (constraint 4).

## Consequences

Recorded once ruled.

## Not in this ADR

- **The six defects** in the findings note are remediation and do not depend on this
  ruling, except FR-style work on making the flow addressable. They can proceed as a
  mini-epic on the `fic` / `tfr-epic-1` precedent.
- **The maturity ledger correction** is independent and carries a clock: the document
  is client-facing and was presented on 2026-09-22 containing statements that are false
  in the reassuring direction.
- **The air-gapped / internal-registry gap** the ledger calls *"real and unsolved"* is
  narrowed by no option here and remains open.
