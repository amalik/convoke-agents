# P4: Enhance Module — Architecture

**Initiative:** P4 — Enhance Module
**Created:** 2026-03-08
**Status:** Architecture approved, ready for implementation
**Reviewed by:** Morgan, Bond, Wendy, Winston, John, Victor, Emma, Max, Isla, Mila, Liam, Wade, Noah, Carson, Maya, Sally

---

## Vision

Convoke delivers value through two complementary facets:
- **Vortex** (`_bmad/bme/_vortex/`) — New agent teams (additive value)
- **Enhance** (`_bmad/bme/_enhance/`) — Capability upgrades for existing BMAD agents (multiplicative value)

Vortex adds what BMAD doesn't have. Enhance makes what BMAD already has better.

---

## First Enhancement: RICE Initiatives Backlog for John PM

John PM currently handles PRDs, epics, stories, and course corrections — but has no workflow for **strategic prioritization above the PRD level**. The initiatives backlog workflow fills that gap.

### Tri-Modal Workflow

| Mode | Purpose | Priority |
|------|---------|----------|
| **Triage** | Ingest review findings (party-mode transcripts, audit outputs) and propose RICE-scored backlog items | Ship first |
| **Review** | Reprioritize existing backlog — rescore, adjust statuses, add/remove items | Ship second |
| **Create** | Build a new RICE backlog from scratch | Ship third |

### Why Triage First

The highest-friction activity is converting multi-agent review outputs into structured, scored backlog items. Today this is manual. Triage mode automates: take a review transcript, extract findings, propose RICE scores, and update the backlog with user approval.

---

## Phased Delivery

### v1 — Brain (current sprint target)

- Tri-modal workflow (Triage > Review > Create)
- Single-file output (current `initiatives-backlog.md` table format)
- RICE scoring engine with guided questions for each factor
- Triage mode ingests review outputs and proposes scored items
- Track labels ("Keep the lights on" / "Move the needle")
- Epic groupings and exploration candidates sections
- Patch-based agent attachment (add menu item to `pm.md`)

### v2 — Container Evolution

- Individual initiative files with RICE frontmatter metadata
- Auto-generated summary view from individual files
- Backlog.md-compatible file format (compatible, not dependent)
- Cross-agent routing ("next actions by agent" section)
- Threshold rule: migrate to individual files when backlog exceeds ~30 items

### v3 — Extension Mechanism

- Propose dynamic `<extensions>` tag to BMAD Method
- Agents check for extension files at activation time
- Replace patch-based attachment with declarative extension
- Enable broader Enhance module ecosystem

---

## Directory Structure

### v1

```
_bmad/bme/_enhance/
├── config.yaml
├── extensions/
│   └── bmm-pm.yaml                         # Documents the menu patch
├── workflows/
│   └── initiatives-backlog/
│       ├── workflow.md                      # Entry point (tri-modal)
│       ├── steps-t/                         # Triage mode
│       │   ├── step-t-01-ingest.md          # Load review/transcript
│       │   ├── step-t-02-extract.md         # Extract findings
│       │   ├── step-t-03-score.md           # Propose RICE scores
│       │   └── step-t-04-update.md          # Update backlog with approval
│       ├── steps-r/                         # Review mode
│       │   ├── step-r-01-load.md            # Load current backlog
│       │   ├── step-r-02-rescore.md         # Walk through items, adjust scores
│       │   └── step-r-03-update.md          # Regenerate prioritized view
│       ├── steps-c/                         # Create mode
│       │   ├── step-c-01-init.md            # Set up backlog metadata
│       │   ├── step-c-02-gather.md          # Gather initiatives from sources
│       │   ├── step-c-03-score.md           # RICE score each initiative
│       │   └── step-c-04-prioritize.md      # Generate prioritized view
│       └── templates/
│           ├── rice-scoring-guide.md        # RICE methodology reference for agent scoring
│           └── backlog-format-spec.md      # Heading structure, table columns, changelog format
└── guides/
    └── ENHANCE-GUIDE.md
```

### v2 additions

```
_bmad-output/planning-artifacts/
├── initiatives/                             # Individual files (v2)
│   ├── D5-problem-framing.md
│   ├── P4-enhance-module.md
│   └── ...
├── initiatives-backlog.md                   # Auto-generated summary
└── initiatives-board.md                     # Optional board export
```

---

## Agent Attachment

### v1 — Patch Approach

Add one menu item to `_bmad/bmm/agents/pm.md`:

```xml
<item cmd="IB or fuzzy match on initiatives-backlog"
      exec="{project-root}/_bmad/bme/_enhance/workflows/initiatives-backlog/workflow.md">[IB] 📦 Initiatives Backlog (Convoke Enhance)</item>
```

Convention: enhanced menu items use 📦 prefix and "(Convoke Enhance)" suffix for discoverability.

### v3 — Dynamic Extension (future BMAD Method proposal)

```yaml
# _bmad/bme/_enhance/extensions/bmm-pm.yaml
target_agent: bmm/pm
menu_items:
  - cmd: "IB or fuzzy match on initiatives-backlog"
    exec: "{project-root}/_bmad/bme/_enhance/workflows/initiatives-backlog/workflow.md"
    label: "[IB] 📦 Initiatives Backlog"
```

Agent activation would check:
```xml
<extensions path="{project-root}/_bmad/bme/_enhance/extensions/" agent="pm" />
```

This is a one-line backwards-compatible change to the BMAD agent activation pattern. Proposed to BMAD Method after v1 proves the concept.

---

## Config

```yaml
name: enhance
version: 1.0.0
description: "Enhance module — capability upgrades for existing BMAD agents"
workflows:
  - name: initiatives-backlog
    entry: workflows/initiatives-backlog/workflow.md
    target_agent: bmm/agents/pm.md
    menu_patch_name: "initiatives-backlog"
# dependencies: reserved for future use
```

*Updated 2026-03-15: Aligned with PRD config.yaml schema per implementation readiness review. Previous schema used `submodule_name`/`enhancements[]` — replaced with `name`/`workflows[]` to match installer integration requirements.*

Output goes to the target module's existing output folder (e.g., `planning-artifacts` for BMM), not a new one.

---

## RICE Scoring Engine

The workflow guides users through scoring with calibrated questions:

| Factor | Scale | Guided Question |
|--------|-------|-----------------|
| **Reach** | 1-10 | "How many users per quarter will this affect? (10 = all users, 1 = edge case)" |
| **Impact** | 0.25-3 | "What's the per-user impact? (3 = massive, 2 = high, 1 = medium, 0.5 = low, 0.25 = minimal)" |
| **Confidence** | 20-100% | "How confident are we in these estimates? (100% = measured data, 50% = educated guess, 20% = speculation)" |
| **Effort** | 1-10 | "Relative effort in story points? (1 = trivial, 10 = multi-epic)" |

Score = (Reach x Impact x Confidence) / Effort

---

## v2 Initiative File Format

```yaml
---
id: P4
title: Enhance module
category: Platform & Product Vision
track: Move the needle
status: Backlog
source: Product owner
rice:
  reach: 8
  impact: 3
  confidence: 0.7
  effort: 6
  score: 2.8
labels: [enhance, architecture, bmad-method]
epic: null
depends_on: []
assigned_agent: null
created: 2026-03-08
updated: 2026-03-08
---

# P4: Enhance Module

New BME section (`_bmad/bme/_enhance/`) that adds workflows and menu items
to existing BMAD agents (BMM, CIS, BMB, TEA, Core). First enhancement:
RICE initiatives backlog workflow for John PM. Positions Convoke as both
"new teams" and "BMAD made better."
```

Backlog.md-compatible in spirit (markdown + frontmatter), RICE-enriched (quantitative scoring they don't have), BMAD-native (track labels, epic groupings, agent routing).

---

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Location | `_bmad/bme/_enhance/` | Parallel to Vortex — both are Convoke value |
| Output folder | Reuse target module's output | Backlog goes to `planning-artifacts`, not a new folder |
| Menu marking | 📦 + "(Convoke Enhance)" | Discoverability without confusion |
| Extension limit | 2-3 items per agent max | Prevent menu bloat |
| v1 file format | Single file (current table) | Sufficient for <30 items, ships faster |
| v2 file format | Individual files + generated summary | Scales beyond 30, better git history |
| Backlog.md | Compatible, not dependent | Ecosystem leverage without hard coupling |
| Triage priority | Ship first among three modes | Highest-friction activity, most daily value |
| Attachment mechanism | Patch now, propose extension hook later | Evidence before architecture |

---

## Constraints

- Max 2-3 Enhance menu items per agent to prevent menu bloat
- Enhance workflows must work if the target agent is updated upstream (no tight coupling to agent internals)
- No hard dependency on external tools (Backlog.md compatibility is optional)
- Extension mechanism proposal to BMAD Method only after v1 proves the pattern

---

## Upstream Contribution Story

"We needed to extend John PM with a backlog workflow. We built the Enhance module, used it ourselves, and proved that agent extensibility works. Here's the pattern and here's why BMAD Method should support it natively with a dynamic `<extensions>` tag."

Evidence first, RFC second.

---

## Change Log

| Date | Change |
|------|--------|
| 2026-03-08 | Architecture created from two multi-agent reviews (BMB + Architect panel, then Vortex + CIS + Sally panel with Backlog.md research). Phased approach confirmed: triage-first v1, individual files v2, extension mechanism v3. |
