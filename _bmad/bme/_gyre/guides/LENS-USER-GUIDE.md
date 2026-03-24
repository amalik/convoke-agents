# Lens 🔬 User Guide

**(readiness-analyst.md)**

- **Version:** 1.0.0
- **Module:** Gyre Pattern (Production Readiness)
- **Last Updated:** 2026-03-24

---

## Quick Start

**Who is Lens?** Lens is a thorough analyst who compares your capabilities manifest against what actually exists in your project. Lens detects *absences* — capabilities that should be present for your stack but aren't — and surfaces cross-domain patterns where gaps compound each other's risk.

**When to use Lens:**

- Atlas has generated a capabilities model and you want to find gaps
- You've made changes to your project and want to see what's improved (delta report)
- You need a severity-prioritized view of what's missing

**Lens vs Other Gyre Agents:**

| If you want to... | Use... |
|---|---|
| Know what tech stack a project uses | **Scout** 🔎 |
| Generate a capabilities model for that stack | **Atlas** 📐 |
| Find what's missing from the project | **Lens** 🔬 |
| Review and refine the findings | **Coach** 🏋️ |

**What you'll get:** A Findings Report (`.gyre/findings.yaml`) with absence-based findings tagged by severity, confidence, and source — plus cross-domain compound findings that show how gaps amplify each other.

---

## How to Invoke

**Claude Code (skills) — recommended:**

```
/bmad-agent-bme-readiness-analyst
```

**Claude Code (terminal) / Other AI assistants:**

```bash
cat _bmad/bme/_gyre/agents/readiness-analyst.md
```

**Claude.ai:**

Open `_bmad/bme/_gyre/agents/readiness-analyst.md` and paste its contents into your conversation.

---

## Menu Options

| # | Code | Description |
|---|------|-------------|
| 1 | **MH** | Redisplay Menu Help |
| 2 | **CH** | Chat with Lens about analysis and findings |
| 3 | **AG** | Analyze Gaps — compare capabilities against what exists |
| 4 | **DR** | Delta Report — track progress between analysis runs |
| 5 | **FA** | Full Analysis — run the complete Gyre pipeline |
| 6 | **PM** | Start Party Mode |
| 7 | **DA** | Dismiss Agent |

Select by number, code, or fuzzy text match.

---

## Workflows

### [AG] Analyze Gaps

Loads the Capabilities Manifest (GC2) and searches the project filesystem for evidence of each capability. Produces a severity-prioritized findings report.

- **Prerequisite:** `.gyre/capabilities.yaml` must exist (run Atlas first)
- **Output:** `.gyre/findings.yaml` (GC3 contract)
- **When to use:** After model generation, or after significant project changes

**How Lens analyzes:**

1. **Load manifest** — reads the capabilities model
2. **Observability analysis** — searches for observability evidence (logging, metrics, tracing, alerting)
3. **Deployment analysis** — searches for deployment evidence (CI/CD, containerization, environment config, rollback)
4. **Cross-domain correlation** — identifies compound patterns where gaps in different domains amplify each other
5. **Present findings** — severity-first summary with blockers, recommended, and nice-to-have counts

**Finding tags:**

| Tag | Meaning |
|---|---|
| **Severity** | blocker / recommended / nice-to-have |
| **Source** | static-analysis (file evidence) or contextual-model (inferred from model) |
| **Confidence** | high / medium / low |

Each finding includes a brief rationale for its severity classification.

**Compound findings:** Lens identifies cross-domain patterns — for example, "no health checks" + "no deployment rollback" is a compound risk where each gap makes the other more dangerous. Compound findings are suppressed when either component has low confidence.

**Novelty ratio:** Lens reports what proportion of findings come from the contextual model vs static analysis ("X of Y findings are contextual"), so you know how much of the analysis is evidence-based vs model-driven.

### [DR] Delta Report

Compares current findings against a previous analysis run to show what changed.

- **Prerequisite:** `.gyre/findings.yaml` must exist from a previous run
- **Output:** Delta analysis with change tags
- **When to use:** After making improvements, to track progress

**Delta tags:**

- **[NEW]** — Finding appeared since last run
- **[CARRIED]** — Finding persists from previous run
- **Resolved** — Finding from previous run no longer present (you fixed it)

On first run, all findings are tagged [NEW] and saved as the baseline for future comparisons.

### [FA] Full Analysis

Same as Scout's Full Analysis — runs the complete pipeline. Lens handles step 4 (gap analysis).

---

## Philosophy

- **Absences, not misconfigurations** — Lens looks for what's missing, not what's wrong with what exists. A missing health check is a finding; a misconfigured health check is not Gyre's scope.
- **Evidence-based honesty** — Every finding shows its source and confidence level. Lens doesn't inflate severity to look thorough.
- **Compound thinking** — Individual gaps are important, but gaps that amplify each other are critical. Lens surfaces these relationships explicitly.
- **Progress, not perfection** — The delta report exists because production readiness is a journey. Tracking resolved findings is as important as finding new ones.

---

## Chat with Lens

Use **[CH]** to discuss analysis topics:

- "Why is this finding marked as a blocker?"
- "What evidence would you need to see to resolve this finding?"
- "Can you explain the compound relationship between these two gaps?"
- "My project is internal-only — should security findings still be blockers?"

---

## Troubleshooting

**"GC2 not found" error**

Lens requires a Capabilities Manifest. Run Atlas's **[GM]** workflow first, then return to Lens.

**Too many findings, hard to prioritize**

Start with blockers only — these are the gaps with the highest risk. Use Coach to review and potentially downgrade findings that aren't relevant to your context.

**Delta report shows all [NEW]**

This is expected on the first run. The current findings become the baseline. Run **[DR]** again after your next analysis to see meaningful deltas.

**Findings seem wrong for my project**

The findings depend on Atlas's capabilities model. If the model includes irrelevant capabilities, use Coach to remove them. Lens will exclude removed capabilities on re-analysis.

---

## Tips

- **Read the severity rationale.** Lens provides a brief explanation for every severity classification. If you disagree, Coach lets you adjust.
- **Compound findings are your highest-value signal.** They reveal systemic gaps that individual findings miss. Pay attention to these.
- **Run delta reports after sprints.** Tracking resolved findings over time gives leadership visibility into readiness progress.
- **The novelty ratio tells you how much to trust.** A high contextual ratio means the model is doing more inference and less evidence-finding. Consider whether the model needs refining through Coach.

---

## Credits

- **Agent:** Lens (Readiness Analyst)
- **Module:** Gyre Pattern v1.0.0
- **Pattern:** Convoke Agent Architecture

---

*Scout finds the facts. Atlas builds the model. Lens finds the gaps. Coach helps you act on them.*
