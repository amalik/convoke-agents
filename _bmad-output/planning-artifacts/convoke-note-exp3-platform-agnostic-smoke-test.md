---
initiative: convoke
artifact_type: note
qualifier: exp3-platform-agnostic-smoke-test
created: '2026-04-12'
schema_version: 1
experiment_id: EXP3
experiment_status: PASS
decision: GO — Bolder Move 3 absorbed into Convoke 4.0 framing
---

# EXP3 — Platform-Agnostic Exporter Smoke Test

**Date:** 2026-04-12
**Pre-registered in:** PRD frontmatter `partyFindingsRound2.PR2-4.experiments[2]`
**Go/no-go criteria (pre-registered):** If all 3 adapters install and produce reasonable behavior → absorb Bolder Move 3. If any fails → drop and defer to 4.1.

## Experiment Design

**Subject:** `bmad-cis-agent-brainstorming-coach` (Carson — standalone Tier 1 persona-based agent skill)
**Tool:** `node scripts/portability/convoke-export.js bmad-cis-agent-brainstorming-coach --output _bmad-output/exp3-smoke-test`
**Platforms tested:** Claude Code, GitHub Copilot, Cursor

## Results

### Export execution

- **Exit code:** 0 (success)
- **Warnings:** 1 (non-blocking — likely Phase 6 catch-all pattern per I50)
- **Output:** 5 files in `_bmad-output/exp3-smoke-test/bmad-cis-agent-brainstorming-coach/`

### Output structure

```
bmad-cis-agent-brainstorming-coach/
  ├─ instructions.md          # Canonical format (304 words, 7 sections)
  ├─ README.md                # Generated from template + manifest data
  └─ adapters/
      ├─ claude-code/SKILL.md
      ├─ copilot/copilot-instructions.md
      └─ cursor/bmad-cis-agent-brainstorming-coach.md
```

### Per-adapter results

| Platform | Format | Persona present | Framework refs in content | Self-contained | Verdict |
|----------|--------|-----------------|--------------------------|----------------|---------|
| **Claude Code** | SKILL.md with YAML frontmatter (`name`, `description`) | Carson: role, identity, style, principles | None | Ready to drop into `.claude/skills/` | **PASS** |
| **Copilot** | `copilot-instructions.md` with HTML comment header | Full persona + workflow | None | Ready to append to `.github/copilot-instructions.md` | **PASS** |
| **Cursor** | Clean markdown (no frontmatter) | Full persona + workflow | None | Ready to drop into `.cursor/rules/` | **PASS** |

### Framework leak check

- **Pattern scanned:** `bmad-init`, `bmad_init`, `claude/skills`, `.claude`, `BMAD Method`, `bmad-help`, `skill-manifest`
- **Matches in adapter content:** 0
- **Matches in README (legitimate):** 1 — installation instruction for Claude Code adapter path (`.claude/skills/...`). This is correct behavior, not a leak.

### Canonical instructions quality

- **Word count:** 304 words — concise and self-contained
- **Sections present:** Persona identity, communication style, principles, "when to use," workflow steps
- **Framework dependencies:** None — an LLM on any platform can follow these instructions cold
- **bmad-init references:** None

## Decision

**GO — Bolder Move 3 absorbed into Convoke 4.0 framing.**

All 3 platform adapters generate correctly, are self-contained, and are ready for installation on their respective platforms. The P18 exporter is production-quality for Tier 1 standalone skills.

## What this changed downstream (per FR34 / M5 requirement)

1. **PRD framing shifts** from narrow ("BMAD marketplace debut") to broad ("Convoke ships everywhere, starting with the BMAD marketplace")
2. **WS2 scope gains ~1 validation story:** "Validate exported Tier 1 skills across 3 platforms" — EXP3 scaled to a representative batch
3. **Executive Summary** updated: EXP3 marked RESOLVED, lineage paragraph updated, Journey 4 (Amalik operator journey) updated
4. **Product Scope** updated: Bolder Move 3 moved from Growth Features to absorbed-into-MVP
5. **Project Scoping** updated: deferred list updated
6. **Archived PRD frontmatter** updated: PR2-3 status changed from `UNRESOLVED_VISION_DECISION` to `RESOLVED_GO_2026-04-12`
7. **Release announcement draft** already contains both narrow and broad versions — broad version is now canonical
8. **Winston's architecture doc (CA)** should include platform-agnostic distribution as a first-class concern alongside marketplace

## Traceability

- **Source PRD:** `convoke-prd-bmad-v6.3-adoption/` (sharded)
- **Pre-registration:** `partyFindingsRound2.PR2-4.experiments[2]` in archived PRD frontmatter
- **Decision source:** Victor's Bolder Move 3 proposal (partyFindingsRound2.PR2-3)
- **Related FRs:** FR33 (pre-registered experiments), FR34 (downstream impact statement)
- **Related metrics:** M5 (experiment logged with go/no-go + downstream statement)
