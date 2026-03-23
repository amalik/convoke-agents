# Gyre Pattern Module

Technical inventory for the `_bmad/bme/_gyre` module — production readiness discovery through stack analysis, contextual model generation, and absence detection. Gyre analyzes your codebase to find what's missing before you ship.

## Agents (4)

| # | Agent | ID | Icon | Role | File |
|---|-------|----|------|------|------|
| 1 | Scout | `stack-detective` | 🔎 | Stack Detection | `agents/stack-detective.md` |
| 2 | Atlas | `model-curator` | 📐 | Model Generation | `agents/model-curator.md` |
| 3 | Lens | `readiness-analyst` | 🔬 | Readiness Analysis | `agents/readiness-analyst.md` |
| 4 | Coach | `review-coach` | 🏋️ | Review & Feedback | `agents/review-coach.md` |

**Registry:** `scripts/update/lib/agent-registry.js` (single source of truth)

## Workflows (7)

### Scout — Stack Detection (1 workflow)
| Workflow | Directory |
|----------|-----------|
| `stack-detection` | `workflows/stack-detection/` |

### Atlas — Model Generation (1 workflow)
| Workflow | Directory |
|----------|-----------|
| `model-generation` | `workflows/model-generation/` |

### Lens — Readiness Analysis (2 workflows)
| Workflow | Directory |
|----------|-----------|
| `gap-analysis` | `workflows/gap-analysis/` |
| `delta-report` | `workflows/delta-report/` |

### Coach — Review (1 workflow)
| Workflow | Directory |
|----------|-----------|
| `model-review` | `workflows/model-review/` |

### Orchestration (1 workflow)
| Workflow | Directory |
|----------|-----------|
| `full-analysis` | `workflows/full-analysis/` |

### Validation (1 workflow)
| Workflow | Directory |
|----------|-----------|
| `accuracy-validation` | `workflows/accuracy-validation/` |

## Handoff Contracts (4)

### Artifact Contracts (GC1-GC3) — schema files in `contracts/`
| Contract | Flow | Schema |
|----------|------|--------|
| GC1 | Scout → Atlas, Lens | `contracts/gc1-stack-profile.md` |
| GC2 | Atlas → Lens, Coach | `contracts/gc2-capabilities-manifest.md` |
| GC3 | Lens → Coach | `contracts/gc3-findings-report.md` |

### Feedback Contract (GC4) — amendment loop
| Contract | Flow | Schema |
|----------|------|--------|
| GC4 | Coach → Atlas | `contracts/gc4-feedback-loop.md` |

## File Structure

```
_bmad/bme/_gyre/
├── README.md                            # This file
├── config.yaml                          # Module configuration
├── compass-routing-reference.md         # Complete routing tables
├── agents/
│   ├── stack-detective.md               # Scout 🔎
│   ├── model-curator.md                 # Atlas 📐
│   ├── readiness-analyst.md             # Lens 🔬
│   └── review-coach.md                  # Coach 🏋️
├── contracts/
│   ├── gc1-stack-profile.md             # Stack Profile artifact schema
│   ├── gc2-capabilities-manifest.md     # Capabilities Manifest schema
│   ├── gc3-findings-report.md           # Findings Report schema
│   └── gc4-feedback-loop.md             # Feedback Loop schema
└── workflows/
    ├── full-analysis/                   # Orchestrator (all agents)
    ├── stack-detection/                 # Scout
    ├── model-generation/                # Atlas
    ├── model-review/                    # Coach
    ├── gap-analysis/                    # Lens
    ├── delta-report/                    # Lens
    └── accuracy-validation/             # Atlas (spike/validation)
```

## Output Artifacts

Gyre writes its artifacts to `_bmad-output/gyre-artifacts/`:

| Artifact | Format | Producer |
|----------|--------|----------|
| Stack Profile | `.gyre/stack-profile.yaml` | Scout (GC1) |
| Capabilities Manifest | `.gyre/capabilities.yaml` | Atlas (GC2) |
| Findings Report | `.gyre/findings.yaml` | Lens (GC3) |
| Feedback Log | `.gyre/feedback.yaml` | Coach (GC4) |
| Delta Report | `.gyre/delta-report.yaml` | Lens |
