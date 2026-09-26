---
initiative: convoke
artifact_type: epic
qualifier: s4-channel-hub
created: '2026-09-26'
status: ready
schema_version: 1
qualifier_role: operator-authored
---

# Epic: S4 — The `convoke` Channel Hub (`s4`)

**Created 2026-09-26 by operator ruling.** Builds the option ADR-001 selected.

**Ruling:** [`adr/channel-integrity/adr-001-the-distribution-unit.md`](adr/channel-integrity/adr-001-the-distribution-unit.md)
— accepted 2026-09-26, **S4 now, S2 the destination**, with **C10** (registry gains
`kind: skill`; the hub is named `convoke`) and **C11** (the hub *fronts* the CLIs before
absorbing them).
**Evidence:** [`convoke-note-channel-integrity-findings-2026-09-26.md`](convoke-note-channel-integrity-findings-2026-09-26.md)

## Why

Convoke's runtime bootstrap is a `bin` entry in `package.json`. **The thing that builds the
runtime is not itself in the channel** — which is why Gyre cannot travel, why a skill that
arrives alone cannot repair itself, and why the marketplace manifest publishes seven agents
by accident of authorship rather than a product by design. ADR-001 **C5** records these as
one defect. The hub is the one thing that closes it.

The pattern has production precedent and is not invented here: NVIDIA/skills publishes
**one** plugin exposing one skill (`nvidia-skill-finder`) against a catalog of 383;
HuggingFace publishes one plugin, `hf-cli`. Nobody runs both channels at parity — upstream's
own marketplace copy is a generation behind its skills.sh copy.

## Scope: two stories

| Story | What it changes |
|---|---|
| `s4-1-1` | **The `convoke` hub skill exists and bootstraps the runtime.** It detects an absent runtime, names what is missing, states the command that obtains it, and **fronts** `convoke-install`, `convoke-update` and `convoke-doctor` by calling the existing binaries (C11 — it does **not** absorb them). Shape is constrained, not free: `preflight-soft-warn` requires *"stderr WARNING + exit 0 pass-through; never `process.exit(non-zero)`"*; Operator Rights **OC-R1** and **OC-R5** make a bare refusal a FAIL (`skip`/`abort` are exits, not fallback values); **OC-R3** wants a sentence of rationale naming a consequence, which a component name and a command do not supply. Reference implementation: upstream `skills/bmad-prd/SKILL.md` step 1. **In the same change:** flip the `skill,convoke` registry row from `proposed` to `in-dev`, **and close A2's gap** — its tracked-source assertion branches on `kind === 'agent'`, so today a shipped skill row would assert a file exists without checking it (ADR-001 C10's recorded ⚠️, and the presence-only hole ADR-004 §3 warns about). |
| `s4-1-2` | **`.claude-plugin/marketplace.json` becomes a declaration rather than a by-product.** It currently declares seven `_bmad/bme/_vortex/agents/*` paths, which is how `bmad-bme-agent-wade` became publicly listed without anyone publishing it. Under S4 the manifest declares what Convoke *means* to publish. **Two things must be stated, not assumed:** removing a declared path does **not** retract an existing listing — there is no self-serve retraction, and Wade's listing persists regardless; and the manifest must not point at the hub before the hub exists, so this story **follows `s4-1-1`** and does not run beside it. |

## Preconditions and blockers, stated

- **⛔ C8 binds and is not satisfied by this epic.** *"Nothing new is published until the
  discovery surface is declared and checkable."* `s4-1-2` supplies the **declaration**.
  The **check** is a new CI check, which **ADR-001 C1 does not permit under the ratified
  baseline** — all three meta-model deliverables shipped and its ADR-001 records *"Three
  deliverables, no epic, budget held."* So either the baseline is re-ratified for one
  check, or `s4-1-2` lands declared-but-unchecked and that is recorded as an accepted risk.
  **This is an operator decision and it gates publication, not authoring.**
- **The hub's internals are not designed here.** Whether it is declared as a
  `config.yaml` workflow with `standalone: true` (ADR-004 C2's second shape) or needs a
  third shape is a `s4-1-1` design question; if a third shape, ADR-004 needs amending and
  that is a ratification, not a story.

## Not in scope, stated as decisions

- **Absorbing the three CLIs.** C11 defers it deliberately: fronting puts the bootstrap in
  the channel without rewriting three working CLIs, and keeps the binaries for the ~40%
  standalone segment whose delivery path is `convoke-export`. Absorption becomes a later,
  measurable step.
- **S2 — promoting the 29 workflows and 14 contracts.** The declared destination. Needs a
  full re-ratification, an ADR-004 amendment for the contract shape, and an answer on
  `.gyre/` (ADR-001 C2, C4). Not started.
- **The six verified defects.** `cir` owns three of them
  ([`convoke-epic-channel-integrity-remediation.md`](convoke-epic-channel-integrity-remediation.md));
  the other three resolve elsewhere, as that epic records.
- **`IN-235`–`IN-238`.** Intakes, not stories.

## Constraint on every story

**Derive, never transcribe.** Every figure in the evidence note carries its command. The
superseded PRD failed this rule and fourteen of its figures were wrong.
