# Atlas 📐 User Guide

**(model-curator.md)**

- **Version:** 1.0.0
- **Module:** Gyre Pattern (Production Readiness)
- **Last Updated:** 2026-03-24

## Quick Start

**Who is Atlas?** Atlas is a knowledgeable curator who generates a capabilities manifest unique to your project's detected tech stack. Atlas combines industry standards (DORA, OpenTelemetry, Google PRR), current best practices from web research, and your guard question answers to build a model of what production readiness looks like *for your specific project* — not a generic checklist.

**When to use Atlas:**

- Scout has produced a Stack Profile and you need a capabilities model
- You want to regenerate the model after amending it through Coach
- You need to validate model accuracy against a known stack

**Atlas vs Other Gyre Agents:**

| If you want to... | Use... |
|---|---|
| Know what tech stack a project uses | **Scout** 🔎 |
| Generate a capabilities model for that stack | **Atlas** 📐 |
| Find what's missing from the project | **Lens** 🔬 |
| Review and refine the findings | **Coach** 🏋️ |

**What you'll get:** A Capabilities Manifest (`.gyre/capabilities.yaml`) with 20+ capabilities across observability, deployment, reliability, and security domains — each with a plain-language description.

## How to Invoke

**Claude Code (skills) — recommended:**

```
/bmad-agent-bme-model-curator
```

**Claude Code (terminal) / Other AI assistants:**

```bash
cat _bmad/bme/_gyre/agents/model-curator.md
```

**Claude.ai:**

Open `_bmad/bme/_gyre/agents/model-curator.md` and paste its contents into your conversation.

## Menu Options

| # | Code | Description |
|---|------|-------------|
| 1 | **MH** | Redisplay Menu Help |
| 2 | **CH** | Chat with Atlas about capabilities and models |
| 3 | **GM** | Generate Model — build a capabilities manifest from the Stack Profile |
| 4 | **AV** | Accuracy Validation — validate model quality against test repos |
| 5 | **FA** | Full Analysis — run the complete Gyre pipeline |
| 6 | **PM** | Start Party Mode |
| 7 | **DA** | Dismiss Agent |

Select by number, code, or fuzzy text match.

## Workflows

### [GM] Generate Model

Loads the Stack Profile (GC1) and generates a contextual capabilities manifest tailored to your project's tech stack.

- **Prerequisite:** `.gyre/stack-profile.yaml` must exist (run Scout first)
- **Output:** `.gyre/capabilities.yaml` (GC2 contract)
- **When to use:** After stack detection, or when regenerating the model

**How Atlas generates capabilities:**

1. **Load profile** — reads Stack Profile and checks for existing amendments from Coach (GC4)
2. **Generate capabilities** — uses stack context + industry standards (DORA metrics, OpenTelemetry, Google PRR) to produce domain-specific capabilities
3. **Web enrichment** — searches for current best practices relevant to your stack
4. **Write manifest** — produces the final capabilities.yaml

**Capability domains:** observability (6-10 capabilities), deployment (5-8), reliability (4-6), security (3-5).

**Capability sources:**

- **standard** — derived from industry standards (DORA, OTel, PRR)
- **practice** — discovered via web search for current best practices
- **reasoning** — inferred from stack context by Atlas

**Limited coverage warning:** If fewer than 20 capabilities are generated, Atlas surfaces a warning and offers you the choice to continue or abort.

**Amendment respect:** When regenerating, Atlas preserves your previous Coach amendments — removed capabilities stay removed, edited descriptions stay edited.

### [AV] Accuracy Validation

Validates model quality by scoring capabilities against synthetic ground truth across multiple stack archetypes.

- **Output:** Accuracy report with per-archetype scores
- **When to use:** Quality gate before trusting the model for gap analysis

**Scoring:**

- 1.0 = Relevant (appropriate for this stack)
- 0.5 = Partially relevant (tangential or poorly described)
- 0.0 = Irrelevant (no relation to stack)

**Gate:** Must achieve ≥70% accuracy across ≥3 stack archetypes. If any archetype falls below 70%, Atlas iterates.

### [FA] Full Analysis

Same as Scout's Full Analysis — runs the complete pipeline. Atlas handles step 3 (model generation).

## Philosophy

- **Context over generic** — Every capability is relevant to *this* stack. Atlas doesn't dump a universal checklist; it reasons about what matters for Node.js on Kubernetes differently than Python on ECS.
- **Standards inform, they don't dictate** — DORA and OpenTelemetry are starting points, not requirements. Atlas adapts to your project's actual architecture.
- **Transparency** — Each capability shows its source (standard, practice, or reasoning) so you know where it came from and can judge accordingly.
- **Team ownership** — The capabilities manifest belongs to your team. Amendments persist. The model improves with use.

## Chat with Atlas

Use **[CH]** to discuss model generation topics:

- "Why did you include distributed tracing for my project?"
- "What DORA metrics are relevant to my stack?"
- "Can you explain the difference between standard and practice sources?"
- "My project is a CLI tool, not a web service — should I regenerate?"

## Troubleshooting

**"GC1 not found" error**

Atlas requires a Stack Profile to generate the model. Run Scout's **[DS]** workflow first, then return to Atlas.

**Model seems too generic**

Check that Scout's guard answers are accurate — Atlas uses them to tune the model. If guard answers are wrong or missing, re-run Scout's **[DS]** with corrected answers, then regenerate.

**Fewer than 20 capabilities generated**

Atlas surfaces a limited-coverage warning. This can happen with unusual or very simple stacks. You can continue (the model is still useful) or abort and check if Scout's stack classification is accurate.

**Amendments disappeared after regeneration**

Atlas reads GC4 (Coach amendments) before regenerating. If amendments are missing, check that `.gyre/capabilities.yaml` contains the `amended` and `removed` flags from your last Coach review.

## Tips

- **Don't skip Scout.** Atlas needs the Stack Profile as input. Running Atlas without it produces an error, not a generic model.
- **Web search results are fresh.** Atlas searches for current-year best practices every time — no stale caches. This means models improve naturally over time.
- **Regeneration preserves your work.** Coach amendments survive regeneration. You don't lose your customizations when the model updates.
- **Capabilities.yaml IS the cache.** In anticipation mode, Atlas's model is reused rather than regenerated. This is by design — the model is stable until you explicitly regenerate.

## Credits

- **Agent:** Atlas (Model Curator)
- **Module:** Gyre Pattern v1.0.0
- **Pattern:** Convoke Agent Architecture

---

*Scout finds the facts. Atlas builds the model. Lens finds the gaps. Coach helps you act on them.*
