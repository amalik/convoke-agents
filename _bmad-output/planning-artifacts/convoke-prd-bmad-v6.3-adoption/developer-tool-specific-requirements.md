# Developer-Tool Specific Requirements

## Project-Type Overview

Convoke is a `developer_tool` in the `general` domain. Unlike traditional developer tools (SDKs, libraries, CLI frameworks), Convoke ships **LLM-interpreted content** (prompts, skills, workflow definitions) alongside a thin layer of JS/Python CLI tooling. This hybrid nature means the "API surface" is split: a small CLI surface for human operators and a large content surface that is consumed by Claude Code rather than called programmatically.

This section captures project-type-specific technical requirements for 4.0. Several subsections are intentionally brief because the content is already documented elsewhere in the PRD; cross-references are noted.

## Language Matrix

| Layer | Language/Format | Role | Target audience |
|-------|-----------------|------|-----------------|
| **Agent content** | Markdown (SKILL.md, agent files) | Prompts, personas, workflow steps | Claude Code (LLM runtime) |
| **Configuration** | YAML (`config.yaml`, `module.yaml`) | Module metadata, user settings | Convoke installer + operator |
| **Manifests** | CSV (`skill-manifest.csv`, `bmm-dependencies.csv`) | Tooling registries | Convoke scripts |
| **CLI tooling** | JavaScript (Node 18+) | `convoke-install`, `convoke-update`, `convoke-doctor`, `convoke-version`, etc. | Developer/consultant operator |
| **Scripts/audits** | Python 3.10+ (with `uv`) and JavaScript | Ad-hoc scripts for audits, migration, validation | Maintainer + CI |

**4.0-specific language changes:** None. The language matrix is stable across the release; 4.0 changes *how* content is loaded (direct-load migration) and *where* it's distributed (marketplace), not *what languages* are used.

## Installation Methods

4.0 introduces a second installation path. Both paths must produce equivalent post-install state (validated per Technical Success WS2 parity check).

| Method | Command | Status in 4.0 | Target user |
|--------|---------|---------------|-------------|
| **Standalone CLI (primary, existing)** | `npm install -g convoke-agents && convoke-install` | Supported; remains the primary path | Existing Convoke users, users with existing Convoke workflows |
| **BMAD marketplace (new)** | BMAD community module browser → select `convoke` → install | New in 4.0; `trust_tier: unverified` initially | New users discovering Convoke via BMAD, colleagues of existing users |
| **Direct git clone + manual install** | `git clone` + `convoke-install` | Unchanged — power-user path, not advertised | Contributors, debuggers |

**Cross-reference:** Installation flow details are in Journey 3 (Samira's marketplace install) and WS2 scope in the Executive Summary.

**Upgrade path:** `convoke-update` remains the canonical upgrade command regardless of install method. Auto-migration handles the `bmad-init` → direct-load transition (WS1).

## API Surface

Convoke exposes **no programmatic API** — there is no `require('convoke-agents')` import path, no HTTP endpoints, no callable library. The "API surface" is split across three modalities:

**1. CLI surface** (for operators):
- `convoke-install` / `convoke-install-vortex` / `convoke-install-gyre` — installation commands
- `convoke-update` — upgrade flow including auto-migration
- `convoke-doctor` — health checks including WS4 governance registry validation
- `convoke-version` — version display
- `convoke-migrate` — manual migration trigger
- Plus future: `convoke-install <module>` (from P3 team installer architecture, not this release)

**2. Claude Code skill surface** (for the LLM runtime):
- `.claude/skills/<skill-name>/SKILL.md` for each installed skill
- Activation protocol per BMAD v6.3 convention (must be v6.3-compliant after 4.0)
- Skill discovery via `bmad-skill-manifest.yaml` and `skill-manifest.csv`

**3. Convoke extension surface** (for operator-authored customizations):
- Operators can write custom skills that extend BMM agents (e.g., Priya's custom note-taking skill from Journey 2)
- Extensions register in `_bmad/_config/bmm-dependencies.csv` per WS4 governance rule
- This is a new first-class surface introduced by WS4 — prior Convoke versions had no formal extension registration

**4.0-specific API surface changes:**
- WS1 retires the `bmad-init` skill activation pattern — all skills now load config directly
- WS3 removes three skills from the surface (`bmad-agent-qa`, `bmad-agent-sm`, `bmad-agent-quick-flow-solo-dev`), absorbed into Amelia
- WS4 adds the extensions registration surface (operators can now formally register custom skills)

## Code Examples

**Existing agent invocation patterns are unchanged by 4.0.** Users invoke agents the same way in 3.2.0 and 4.0:

- Ask to talk to an agent by name: "talk to Winston," "talk to John"
- Invoke a skill directly: "run lets create PRD," "triage the initiatives backlog"
- The agent menu and command interactions are identical post-migration

**Cross-reference:** Journey 1 (Priya's silent upgrade) demonstrates the continuity — her Isla stream produces the same output structure after the upgrade as before. This is enforced by PF1 validation (M9).

**4.0-specific code examples (new):**
- **Manual extension registration** (new in WS4) — when a user creates a custom skill extending a BMM agent, they add a row to `_bmad/_config/bmm-dependencies.csv`:
  ```
  skill_name,bmm_agent,owner,registered_date
  priya-custom-note-tool,bmad-agent-pm,priya@example.com,2026-05-15
  ```
- **Marketplace install** (new in WS2) — users select Convoke in the BMAD community module browser (no command-line invocation by the user; handled by BMAD installer).

## Migration Guide

**This section is covered in depth elsewhere — see:**
- **Journey 1** for the happy-path upgrade experience
- **Journey 2** for the edge case (governance registry warning for unregistered custom skills)
- **WS1 scope** in the Executive Summary for the auto-migration mechanism
- **M3, M4** in Success Criteria for the audit and idempotency metrics
- **Sophia's release announcement draft** in frontmatter (`partyFindingsRound2.PR2-5`) for the user-facing voice

**One commitment specific to this section:** The 4.0 migration guide will be **≤1 page** and introduce **zero new concepts** users must learn. This is a structural proxy for "zero user action required to re-onboard" (per User Success criteria).

**Implementation considerations:**
- Migration guide lives at `docs/migration/3.x-to-4.0.md` or equivalent
- Links from `convoke-update` terminal output when the update runs
- Linked from CHANGELOG 4.0 entry

## Implementation Considerations

**Non-functional requirements specific to `developer_tool` project type for 4.0:**
- **Idempotency of CLI commands** — `convoke-update` must be safe to re-run without side effects (M4)
- **Path safety** — scripts accepting user paths must pass path-safety analysis (per Convoke memory feedback rule, reflected in Technical Success WS1)
- **Cross-platform support** — Convoke supports macOS, Linux, and WSL. Windows-native is not officially supported and is not in scope for 4.0. No change from 3.2.0.
- **Minimum runtime versions** — Node 18+, Python 3.10+ (the latter per BMAD v6.3 prerequisites that Convoke inherits)
- **Offline-safe** — `convoke-update` should degrade gracefully if the marketplace registry is unreachable (per BMAD's own registry client behavior, inherited)
