---
initiative: convoke
artifact_type: adr
qualifier: i97-naming-convention-reconciliation
created: '2026-04-28'
status: accepted
schema_version: 1
related_initiative: I97
related_decision: D1
supersedes: none
---

# ADR-001: Naming Convention Reconciliation

**Status:** Accepted (2026-04-28)
**Initiative:** I97 (BMAD v6.3+ source format adoption)
**Related Decision:** D1 from architecture document
**Related Requirements:** PRD Decision 2; FR5; FR6; FR8

## Context

BMAD-METHOD's marketplace expects agent skills to follow BMM-canonical naming convention (`bmad-{module-code}-agent-{first-name}` per BMB `bmad-agent-builder` template). The reference is upstream BMM's own agents (`bmad-agent-analyst` for Mary, `bmad-agent-architect` for Winston, etc.) — first-name-based, module-code-prefixed.

Convoke's existing slash-command skills follow a different convention: `bmad-agent-bme-{role}` (role-based, module-prefixed differently). The 7 Vortex agent slash-commands are:

- `.claude/skills/bmad-agent-bme-contextualization-expert/`
- `.claude/skills/bmad-agent-bme-discovery-empathy-expert/`
- `.claude/skills/bmad-agent-bme-research-convergence-specialist/`
- `.claude/skills/bmad-agent-bme-hypothesis-engineer/`
- `.claude/skills/bmad-agent-bme-lean-experiments-specialist/`
- `.claude/skills/bmad-agent-bme-production-intelligence-specialist/`
- `.claude/skills/bmad-agent-bme-learning-decision-expert/`

The marketplace PR rejection (2026-04-27) flagged the broader format gap; naming convention divergence is a sub-component. PRD Decision 2 surfaced three resolution options: (a) rename all 7 to BMB convention, (b) override BMB convention, (c) hybrid.

PRD Vision (Journey 1) commits to operators experiencing "zero re-learning" and "no menu code drift" post-migration. That commitment constrains the resolution space.

## Decision

**Hybrid naming.** Internal canonical names follow BMB convention; slash-command wrapper directories keep current names as compatibility aliases.

Concretely:

- **Internal canonical name** (in `module.yaml` `agents:` array `code:` field, in `module-help.csv` `skill` column, in agent SKILL.md frontmatter `name:` field): `bmad-bme-agent-{first-name}` — `bmad-bme-agent-emma`, `bmad-bme-agent-isla`, `bmad-bme-agent-liam`, `bmad-bme-agent-mila`, `bmad-bme-agent-wade`, `bmad-bme-agent-noah`, `bmad-bme-agent-max`
- **Slash-command wrapper directory** (under `.claude/skills/`): UNCHANGED — `bmad-agent-bme-{role}/` per current state. Operators continue invoking the slash commands they know.
- **Wrapper SKILL.md content**: updated to reference the converted agent SKILL.md path (compatibility alias layer)
- **Agent source directory** (under `_bmad/bme/_vortex/agents/`): UNCHANGED — `{role}/` per current state (e.g., `contextualization-expert/`)

The name divergence is between **internal-canonical** (manifest references) and **wrapper-display** (slash-command surface). The two layers point at the same SKILL.md file.

## Consequences

**Positive:**

- Marketplace acceptance is satisfied — `module.yaml` agents[] declarations use BMM-canonical names; marketplace reviewer sees expected naming.
- PRD Vision Journey 1 honored — operators continue invoking `bmad-agent-bme-contextualization-expert` (or fuzzy "Emma") as before; no documentation re-read; no menu code drift.
- 60% addon segment (marketplace install) gets canonical names; 40% standalone segment (npm install + slash-command invocation) gets unchanged names. Both segments served.
- Pattern-C-friendly factoring constraint (NFR16) is preserved — converting workflow `references/` files later to standalone workflow skills is a relocate-and-rename operation, not a re-author. Naming flexibility maintained.

**Negative / Trade-offs:**

- **Aliasing layer overhead.** Two name representations for the same agent. Documentation must clarify which name appears in which context (manifest vs slash-command vs agent SKILL.md frontmatter).
- **Cognitive load for new contributors.** A new dev agent or operator may initially be confused why the agent has "two names." Mitigation: explicit "Internal canonical" vs "Slash-command alias" labels in documentation.
- **Future maintenance discipline.** When new agents are added (post-I97), the same hybrid pattern must apply consistently. Cannot drift toward all-BMB or all-role naming.

**Implementation requirements:**

- Each `_bmad/bme/_vortex/agents/{role}/SKILL.md` frontmatter `name:` field uses canonical (BMB) name
- Each `.claude/skills/bmad-agent-bme-{role}/SKILL.md` wrapper updated atomically (per-agent PR per ADR-004) to reference converted agent SKILL.md
- `module.yaml` `agents:` array entries use canonical (BMB) names in `code:` field
- `module-help.csv` `skill` column uses canonical (BMB) names

## Alternatives Considered

**Alternative A: Rename all 7 to BMB convention** (e.g., `.claude/skills/bmad-agent-bme-contextualization-expert/` → `.claude/skills/bmad-bme-agent-emma/`)

- **Rejected because:** Violates PRD Vision Journey 1 "zero re-learning" commitment. Operators with active Vortex engagements would need to re-read documentation to discover new slash command names. Journey 1 is a load-bearing PRD commitment; renaming-driven user churn directly contradicts it.

**Alternative B: Override BMB convention** (keep `bmad-agent-bme-{role}` everywhere, including in `module.yaml` agents[] codes)

- **Rejected because:** Maximum divergence from upstream BMM canonical. Marketplace reviewer (`bmadcode`) explicitly flagged the v5/early-v6 format gap on 2026-04-27 PR rejection — overriding canonical naming risks a second rejection. Following the cited path (BMB convention internally) signals goodwill and reduces re-review friction.

## Cross-References

- Architecture document: `_bmad-output/planning-artifacts/convoke-arch-bmad-v63-source-format-adoption.md` Section "D1"
- PRD: `_bmad-output/planning-artifacts/convoke-prd-bmad-v63-source-format-adoption.md` Decision 2
- Diagnostic: `_bmad-output/implementation-artifacts/spike-marketplace-packaging-delta.md` Section "Three operator decisions surfaced"
- Memory: `project_marketplace_structural_adoption.md`
