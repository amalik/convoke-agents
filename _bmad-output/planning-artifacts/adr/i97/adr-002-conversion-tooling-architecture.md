---
initiative: convoke
artifact_type: adr
qualifier: i97-conversion-tooling-architecture
created: '2026-04-28'
status: accepted
schema_version: 1
related_initiative: I97
related_decision: D2
supersedes: none
---

# ADR-002: Conversion Tooling Architecture

**Status:** Accepted (2026-04-28)
**Initiative:** I97 (BMAD v6.3+ source format adoption)
**Related Decision:** D2 from architecture document
**Related Requirements:** FR1; FR2; FR3; FR4; FR9; FR10; NFR16

## Context

Converting 7 Vortex agent SKILL.md files from BMAD v5/early-v6 XML-in-markdown format to BMAD v6.3+ outcome-based markdown is the core mechanical work of I97. The conversion is content transformation: extracting persona, capabilities, and activation logic from XML elements and emitting clean markdown sections (`## Identity`, `## Communication Style`, `## Principles`, `## On Activation`, `## Capabilities`).

The diagnostic (`spike-marketplace-packaging-delta.md`) confirmed two facts:

1. **BMB tooling exists and works** — `bmad-agent-builder` and `bmad-workflow-builder` (already shipped at `_bmad/bmb/skills/`) both expose `build-process` action with "convert" mode. The marketplace reviewer (`bmadcode`) explicitly cited this path: "the bmad builder skills can also help you convert as needed."
2. **BMB output may need manual fixup** — diagnostic evaluation surfaced cases where BMB conversion required adjustment (persona drift on long agents, hardcoded error-string preservation for Operator Covenant fail-loud signal, capability menu code preservation). Not catastrophic gaps; addressable per-agent.

Three resolution options:

- A) BMB canonical, no manual fixup
- B) Hand-rolled converter (BMB supplementary)
- C) BMB canonical with documented manual-fixup contract

## Decision

**BMB tooling canonical with documented manual-fixup contract.** Per-agent conversion runs `bmad-agent-builder` `build-process` "convert" mode + `bmad-workflow-builder` `build-process` "convert" mode against the agent's existing files. Output is reviewed against a per-agent fixup checklist before merge.

The fixup checklist is a reusable artifact at `scripts/migration/format-conversion/fixup-checklist.md`. It documents the patterns BMB tooling does not preserve automatically:

- **Persona preservation** — verify role, identity, communication_style, principles match pre-migration semantics; flag any drift on long agents
- **Hardcoded error-string preservation** — verify Operator Covenant fail-loud patterns survive (OC-R3 rationale signal); BMB's outcome-based template may strip these in favor of "trust the LLM" — re-add deliberately where load-bearing
- **Capability menu code preservation** — verify menu codes (LP, PV, CS, etc.) match pre-migration menu exactly; no drift
- **Workflow file path preservation** — per FR12, workflow source files (`workflows/{name}/workflow.md`) are NOT modified; only agent-internal `references/{name}.md` files are derived from them

The fixup checklist is reusable for I98 (Gyre) and I99 (Team Factory) per NFR18 (migration tooling reusability).

## Consequences

**Positive:**

- **Cited-path goodwill** — using BMB tooling per marketplace reviewer's explicit recommendation reduces re-review friction; relationship-positive read.
- **Bounded conversion effort** — diagnostic confirmed BMB produces correct shape; fixup is targeted, not from-scratch.
- **Reusable fixup checklist** — same checklist runs against Gyre (4 agents) and Team Factory (1 agent) when those migrations fire. NFR18 honored.
- **Empirical learnings captured** — patterns surfaced during BMB review get added to fixup checklist as discovered, becoming durable knowledge.
- **Honest about tooling gaps** — explicit fixup contract acknowledges BMB output isn't perfect for Convoke-specific patterns (Operator Covenant signal preservation in particular).

**Negative / Trade-offs:**

- **Per-agent operator review required.** BMB output cannot be merged sight-unseen; operator (or dev agent) reviews against fixup checklist. Adds per-agent review time. Mitigated by checklist being concrete and bounded.
- **Checklist drift risk.** If checklist is not updated when new patterns are discovered, future migrations may miss them. Mitigation: ADR-002 review at each migration completion to capture lessons.
- **BMB upstream changes risk.** If BMAD-METHOD ships breaking changes to BMB tooling during I97 development, fixup checklist may need amendment mid-flight. Mitigation: per Risk Mitigations in PRD Domain section, watch BMAD release notes during I97 dev.

## Alternatives Considered

**Alternative A: BMB canonical, no manual fixup**

- **Rejected because:** Diagnostic (`spike-marketplace-packaging-delta.md`) explicitly surfaced cases where BMB output needed adjustment. Treating BMB output as merge-ready risks losing Operator Covenant fail-loud signal and persona drift on long agents. Both are load-bearing for I97's behavioral preservation success criterion (PRD Outcome 4).

**Alternative B: Hand-rolled converter (BMB supplementary)**

- **Rejected because:** Defeats the purpose of using upstream tooling. Marketplace reviewer cited BMB path explicitly; bypassing it forfeits the relationship-positive read and creates Convoke-specific tooling that diverges from BMM ecosystem conventions. Also: more authoring work upfront for diminishing returns (BMB already works for ~80% of conversion).

## Cross-References

- Architecture document: `_bmad-output/planning-artifacts/convoke-arch-bmad-v63-source-format-adoption.md` Section "D2"
- PRD: `_bmad-output/planning-artifacts/convoke-prd-bmad-v63-source-format-adoption.md` Distinctive Approach + FR1-12
- Diagnostic: `_bmad-output/implementation-artifacts/spike-marketplace-packaging-delta.md` "BMB conversion tooling" section
- Tooling reference: `_bmad/bmb/skills/bmad-agent-builder/`, `_bmad/bmb/skills/bmad-workflow-builder/`
- Fixup checklist artifact: `scripts/migration/format-conversion/fixup-checklist.md` (authored at workflow start)
