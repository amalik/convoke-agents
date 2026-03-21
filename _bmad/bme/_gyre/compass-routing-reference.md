# Compass Routing Reference — Gyre Pattern

> **Status:** Authoritative | **Version:** 1.0 | **Created:** 2026-03-21
>
> This is the **authoritative** routing reference for the Gyre Pattern. All step-file Compass sections MUST reference this document for routing decisions.

---

## Gyre Overview

The Gyre Pattern has 4 agents across 4 streams, connected by 4 handoff contracts:

```
                      ┌─────────────────────────────────────────────┐
                      │            GYRE PATTERN                      │
                      │         4 Streams · 4 Agents                 │
                      └─────────────────────────────────────────────┘

  ┌──────────┐    GC1    ┌──────────┐    GC2    ┌──────────┐    GC3    ┌──────────┐
  │ Scout 🔎  │─────────▶│ Atlas 📐  │─────────▶│  Lens 🔬  │─────────▶│ Coach 🏋️  │
  │  Detect   │ artifact │  Model   │ artifact │ Analyze  │ artifact │  Review  │
  └──────────┘          └──────────┘          └──────────┘          └──────────┘
                              ▲                                          │
                              │                  GC4                     │
                              └──────────────────────────────────────────┘
                                            feedback
```

**Contract Types:**
- **GC1–GC3** (forward flow): Artifact contracts — agent produces a schema-compliant artifact file
- **GC4** (feedback loop): Coach amends the capabilities model; Atlas respects amendments on regeneration

---

## Routing Mechanisms

Gyre uses a simpler routing model than Vortex — it's a linear pipeline with one feedback loop. Routing is primarily **action-driven** (what the user wants to do next) rather than **evidence-driven** (what evidence suggests).

| Mechanism | Description | Contracts | Compass Row Pattern |
|-----------|-------------|-----------|-------------------|
| **Schema-driven** | Artifact produced, schema declares target | GC1–GC3 | "Your [artifact] is ready for [Agent]" |
| **Feedback-driven** | Coach amendments feed back to Atlas | GC4 | "Model updated — regenerate to apply amendments" |
| **Action-driven** | User chooses next workflow by intent | All | "If you want to [action], run [workflow]" |

---

## Handoff Contract Reference

### Artifact Contracts (GC1–GC3)

These contracts have schema definitions in `_bmad/bme/_gyre/contracts/`. Each artifact produced by the source agent must conform to the schema.

| Contract | Flow | Schema File | Expected Artifact | Trigger Condition |
|----------|------|-------------|-------------------|-------------------|
| **GC1** | Scout 🔎 → Atlas 📐 | `contracts/gc1-stack-profile.md` | Stack Profile — technology categories, archetype, guard answers, confidence level | Stack detection complete; classification confirmed by user |
| **GC2** | Atlas 📐 → Lens 🔬 | `contracts/gc2-capabilities-manifest.md` | Capabilities Manifest — ≥20 capabilities relevant to detected stack, each with domain, description, why-it-matters | Model generation complete; capabilities curated for the stack |
| **GC3** | Lens 🔬 → Coach 🏋️ | `contracts/gc3-findings-report.md` | Findings Report — absence-based findings with severity, confidence, evidence, capability refs; cross-domain compounds | Gap analysis complete; all domains analyzed and correlated |

### Feedback Contract (GC4)

| Contract | Flow | Routing Type | Trigger Condition | What the Target Agent Receives |
|----------|------|-------------|-------------------|-------------------------------|
| **GC4** | Coach 🏋️ → Atlas 📐 | Feedback-driven | Coach captures model amendments (keep/remove/edit) and missed-gap feedback during review | Atlas receives: amendment list (capabilities to remove, edit, or add) + user feedback on missed gaps. Respected on next model regeneration. |

---

## Complete Routing Decision Matrix

### Scout 🔎 — Detect (Stream 1)

| Workflow | Route 1 | Route 2 | Route 3 |
|----------|---------|---------|---------|
| `stack-detection` | → Atlas 📐 `model-generation` — Stack Profile (GC1) ready for model generation | → Scout 🔎 `stack-detection` — Re-detect after project changes | → Coach 🏋️ `model-review` — Review existing model with new stack context |

### Atlas 📐 — Model (Stream 2)

| Workflow | Route 1 | Route 2 | Route 3 |
|----------|---------|---------|---------|
| `model-generation` | → Lens 🔬 `gap-analysis` — Capabilities Manifest (GC2) ready for analysis | → Coach 🏋️ `model-review` — Review and customize model before analysis | → Atlas 📐 `accuracy-validation` — Validate model quality before proceeding |
| `accuracy-validation` | → Atlas 📐 `model-generation` — Iterate prompts if accuracy < 70% | → Lens 🔬 `gap-analysis` — Accuracy validated, proceed to analysis | |

### Lens 🔬 — Analyze (Stream 3)

| Workflow | Route 1 | Route 2 | Route 3 |
|----------|---------|---------|---------|
| `gap-analysis` | → Coach 🏋️ `model-review` — Findings Report (GC3) ready for review | → Lens 🔬 `delta-report` — Compare with previous run | → Atlas 📐 `model-generation` — Model seems wrong, regenerate |
| `delta-report` | → Coach 🏋️ `model-review` — Review changes since last analysis | → Scout 🔎 `stack-detection` — Stack may have changed, re-detect | |

### Coach 🏋️ — Review (Stream 4)

| Workflow | Route 1 | Route 2 | Route 3 |
|----------|---------|---------|---------|
| `model-review` | → Atlas 📐 `model-generation` — Amendments captured (GC4), regenerate model | → Lens 🔬 `gap-analysis` — Model reviewed, proceed to analysis | → Scout 🔎 `full-analysis` — Run complete pipeline from scratch |

---

## Inter-Module Routing (Gyre → Vortex)

Gyre findings can feed into Vortex product discovery:

| If Gyre finds... | Consider in Vortex... | Agent | Why |
|---|---|---|---|
| Critical readiness gaps blocking launch | `product-vision` or `contextualize-scope` | Emma 🎯 | Readiness gaps may redefine product scope |
| Findings that challenge assumptions | `hypothesis-engineering` | Liam 💡 | Readiness findings are testable hypotheses |
| Feedback suggesting missing capabilities | `user-interview` | Isla 🔍 | Validate missed gaps with users |

> **Note:** Inter-module routing is advisory. The user decides whether a Gyre finding warrants Vortex action.

---

## Compass Table Format

All step-file Compass sections MUST use this uniform format:

```markdown
## Gyre Compass

Based on what you just completed, here are your options:

| If you want to... | Consider next... | Agent | Why |
|---|---|---|---|
| [action/intent] | [workflow-name] | [Agent Icon] | [rationale] |
| [action/intent] | [workflow-name] | [Agent Icon] | [rationale] |
| [action/intent] | [workflow-name] | [Agent Icon] | [rationale] |

> **Note:** These are recommendations. You can run any Gyre workflow at any time.
```

**Rules:**
- **2–3 rows** per Compass table
- Agent display format: `AgentName Icon` (e.g., `Scout 🔎`, `Atlas 📐`)
- Include inter-module routing rows only in Coach's final step (findings review complete)
- `full-analysis` compass appears in step-05-review-findings only

### Agent Display Reference

| Agent | Display Format |
|-------|---------------|
| Scout | `Scout 🔎` |
| Atlas | `Atlas 📐` |
| Lens | `Lens 🔬` |
| Coach | `Coach 🏋️` |

---

## Full Compass Table (used in step-05-review-findings of full-analysis)

This comprehensive table appears only at the end of the full pipeline:

| If you want to... | Consider next... | Agent | Why |
|---|---|---|---|
| Detect or re-detect your stack | stack-detection | Scout 🔎 | New project or stack has changed |
| Generate or regenerate the model | model-generation | Atlas 📐 | First run or want fresh model |
| Review your capabilities manifest | model-review | Coach 🏋️ | Customize the model to your stack |
| Run gap analysis | gap-analysis | Lens 🔬 | Find what's missing |
| See what changed since last run | delta-report | Lens 🔬 | Track progress over time |
| Run the full pipeline | full-analysis | Scout 🔎 | Complete end-to-end analysis |
| Validate model accuracy | accuracy-validation | Atlas 📐 | Pre-pilot quality gate |

> **Note:** These are recommendations. You can run any Gyre workflow at any time.

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-03-21 | Initial creation — 4 contracts, 7 workflows, 4 agents, inter-module routing |
