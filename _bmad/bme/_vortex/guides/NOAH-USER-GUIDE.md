# Noah User Guide - Production Intelligence Specialist 📡

**Agent:** Noah (production-intelligence-specialist)
**Version:** 1.6.0
**Module:** Convoke (bme) - Vortex Pattern
**Last Updated:** 2026-02-26

---

## Quick Start

**Who is Noah?**
Noah is a Production Intelligence Specialist who interprets production signals through experiment lineage and Vortex history. He guides you through the "Sensitize" stream of the Vortex pattern — reading what real-world usage reveals about product-market fit across signal interpretation, behavioral pattern detection, and portfolio-level production monitoring. Noah produces intelligence — contextual, evidence-based signal reports. He does not produce strategy or recommendations; that is Max's domain.

**When to use Noah:**
- Interpreting a production signal through the lens of the experiment that created it
- Classifying observed behavior patterns against validated experiment baselines (expected variance, regression, or novel behavior)
- Monitoring multiple graduated experiments in production simultaneously at portfolio scale
- Detecting anomalous user behavior that experiments didn't predict
- Bridging production data back to Vortex experiment history (HC4 → HC5)
- Identifying cross-experiment patterns that single-signal analysis misses
- Prioritizing which experiments need attention based on divergence severity

**Noah vs. Raw Dashboards/Analytics — which do I need?**

| | Noah 📡 (Sensitize) | Raw Dashboards/Analytics |
|---|---|---|
| **When** | After experiments — you have production data to interpret through experiment context | Anytime — you need to see raw metrics |
| **Input** | HC4 experiment context + production signals | Metrics / analytics tools |
| **Output** | HC5 signal reports (contextualized intelligence) | Numbers, charts, alerts |
| **Focus** | What does this signal mean given the experiment? (signal + context + trend) | What are the numbers? (raw metrics) |
| **Value** | Connects production reality to experiment predictions — surfaces what dashboards hide | Shows current state without experiment context |

**Decision aid:** If you have production data and need to understand what it means in context of your experiments → **Noah**. If you just need to see the numbers → dashboards. Noah turns dashboard readings into experiment-grounded intelligence.

**What you'll get:**
HC5 signal reports — contextualized intelligence reports that interpret production signals through experiment lineage, assess trends against validated baselines, flag anomalies for discovery research, and provide Max with everything needed for portfolio-level decisions. Signal + context + trend: that's the deliverable.

---

## How to Invoke Noah

### Method 1: Direct Agent File Reading (Recommended)

Read Noah's agent file to activate him. This works in any environment:

**Claude Code:**
```
Read the file at _bmad/bme/_vortex/agents/production-intelligence-specialist.md
```

**Terminal:**
```bash
cat _bmad/bme/_vortex/agents/production-intelligence-specialist.md
```

**Claude.ai:** Copy the contents of `_bmad/bme/_vortex/agents/production-intelligence-specialist.md` and paste into the chat.

---

### Method 2: Skill Activation (BMAD Environments Only)

If your environment supports BMAD skills:

```
/bmad-agent-bme-production-intelligence-specialist
```

---

## Noah's Menu Options

Once Noah activates, you'll see menu options for his available workflows:

```
1. [MH] Redisplay Menu Help
2. [CH] Chat with Noah about signal interpretation, anomaly detection, or production monitoring
3. [SI] Signal Interpretation: Interpret production signals through experiment lineage and Vortex history
4. [BA] Behavior Analysis: Analyze behavior patterns against validated experiment baselines
5. [MO] Production Monitoring: Monitor multiple production signals across active experiments
6. [PM] Start Party Mode
7. [DA] Dismiss Agent
```

### How to Select an Option

1. **Number:** Type `3` to select option 3
2. **Command Code:** Type `SI` to start signal interpretation
3. **Fuzzy Match:** Type `signal` or `behavior` or `monitoring` - Noah will match the command

---

## Workflows

### [SI] Signal Interpretation (5 steps)

Interpret a single production signal through the experiment that created it. Takes an HC4 experiment context (from Wade) and a production signal, then produces a contextualized HC5 signal report connecting observed production behavior to experiment predictions and Vortex history.

**Steps:**
1. Setup & Input Validation
2. Context Loading
3. Signal Analysis
4. Anomaly Detection
5. Synthesize & Route

**Output:** `{output_folder}/vortex-artifacts/hc5-signal-report-{date}.md`
**Time:** 45-90 minutes

**When to use Signal Interpretation:**
You have a specific production signal — a metric that moved, a threshold that was breached, a trend that shifted — and you need to understand what it means in context of the experiment that led to this production state. The signal indicates something very different depending on what was tested and what was expected.

---

### [BA] Behavior Analysis (5 steps)

Classify an observed behavior pattern against validated experiment baselines. Takes an HC4 experiment context and an observed behavior, then classifies it as expected variance, regression, or novel behavior — and produces a behavioral HC5 signal report.

**Steps:**
1. Setup & Input Validation
2. Context & Baseline Extraction
3. Behavior Classification
4. Evidence Gathering
5. Synthesize & Route

**Output:** `{output_folder}/vortex-artifacts/hc5-behavioral-report-{date}.md`
**Time:** 60-120 minutes

**The 3 Behavior Categories:**
- **Expected Variance** — Production behavior falls within experiment-predicted tolerance. The experiment predicted this range and production is confirming it. A valid finding that confirms the experiment model.
- **Regression** — Behavior diverges negatively from validated experiment performance. Something that worked in the experiment is underperforming in production. Warrants Max's attention for strategic decision.
- **Novel Behavior** — Behavior not covered by the original experiment hypothesis. Users are doing something the experiment didn't predict. Often the most valuable finding — reveals user intent the hypothesis didn't anticipate. Warrants Isla's discovery investigation.

---

### [MO] Production Monitoring (5 steps)

Monitor production signals across multiple graduated experiments simultaneously. Takes multiple HC4 experiment contexts (portfolio), monitors each experiment's signals against its baselines, prioritizes by divergence severity using the P1/P2/P3 framework, and produces a portfolio-level HC5 signal report.

**Steps:**
1. Setup & Multi-Experiment Input Validation
2. Portfolio Assembly & Baseline Mapping
3. Signal Monitoring & Divergence Assessment
4. Signal Prioritization & Anomaly Flagging
5. Synthesize & Route

**Output:** `{output_folder}/vortex-artifacts/hc5-portfolio-report-{date}.md`
**Time:** 90-180 minutes

**The P1/P2/P3 Prioritization Framework:**
- **P1 (Immediate)** — Critical divergence + wide scope + high confidence. This experiment needs Max's attention now.
- **P2 (Attention)** — Warning-level divergence OR wide scope with medium confidence. This experiment should be on Max's radar.
- **P3 (Monitor)** — Informational divergence OR narrow scope OR low confidence. Continue monitoring, no urgent action.

**When to use Production Monitoring vs. Signal Interpretation:**
- **Signal Interpretation** analyzes a single signal from a single experiment — depth over breadth
- **Production Monitoring** monitors signals across multiple experiments simultaneously — breadth over depth, with prioritization to tell Max which experiments need attention first

---

### Anomaly Detection → Isla Routing

All 3 of Noah's workflows can detect anomalous behavior — production patterns that the original experiment didn't predict or account for. When this happens, the Vortex Compass suggests routing to Isla for discovery research:

- **Signal Interpretation:** If the signal reveals behavior not covered by the original hypothesis → Compass suggests Isla 🔍 `user-discovery`
- **Behavior Analysis:** If the behavior is classified as "novel behavior" → Compass suggests Isla 🔍 `user-discovery`
- **Production Monitoring:** If anomalies are flagged across one or more experiments → Compass suggests Isla 🔍 `user-discovery`

**Why route to Isla?** Noah observes and reports what production data shows. When that data reveals unexpected user intent — behavior the experiment didn't anticipate — that's a discovery opportunity. Isla investigates the "why" behind the anomaly through qualitative research. Noah detects; Isla discovers.

**What it looks like in the Compass:**

```
| If you learned... | Consider next... | Agent | Why |
|---|---|---|---|
| ⚡ Anomalous behavior detected | user-discovery | Isla 🔍 | Unexpected behavior warrants discovery research (HC10) |
```

---

## Noah's Philosophy: Signal + Context + Trend

### The Sensitize Stream (Vortex Pattern)

Noah guides teams through the "Sensitize" stream (Stream 6):
- **Signal + context + trend** — raw metrics mean nothing without interpretation frames
- **Behavioral patterns reveal intent that surveys miss** — observe what users do, not what they say
- **Production data is the most honest user feedback** — it can't lie
- **Anomaly detection surfaces what dashboards hide** — look for what doesn't fit
- **Observe and report, don't prescribe** — strategic decisions belong downstream

---

## Chatting with Noah (CH)

Select **[CH] Chat** to discuss:
- Production signal interpretation and experiment lineage
- Behavioral pattern classification (expected variance / regression / novel)
- Portfolio-level monitoring and the P1/P2/P3 prioritization framework
- Anomaly detection and when to route to Isla
- HC5 signal report structure and content
- When to use which Noah workflow

**Example questions:**
- "What does this production signal mean in context of my experiment?"
- "How do I classify this behavior — is it expected variance or regression?"
- "When should I use signal-interpretation vs. behavior-analysis vs. production-monitoring?"
- "I'm seeing unexpected user behavior in production. Is this an anomaly worth investigating?"
- "How do I set up baselines for portfolio monitoring?"
- "What's the difference between a metric deviation and a trend shift?"
- "How do I know when a signal is strong enough for Max to act on?"
- "My production signals are contradicting my experiment predictions. What should I look for?"

---

## Troubleshooting

### Error: "Configuration Error: Cannot load config file"

**How to fix:**
1. Check if `_bmad/bme/_vortex/config.yaml` exists
2. If missing: `npx convoke-install-vortex`

### Error: "Workflow Error: Cannot load signal interpretation workflow"

**How to fix:**
1. Check workflow files exist in `_bmad/bme/_vortex/workflows/`
2. Run `npx convoke-doctor` to diagnose
3. If missing: `npx convoke-install-vortex`

---

## Tips from Noah

### "The signal indicates something — the question is what"
A production metric moving 15% isn't inherently good or bad. It depends entirely on what the experiment predicted. If the experiment expected a 20% improvement and you're seeing 15%, that's underperformance — even though the metric went up. Context turns numbers into intelligence.

### "Anomalies are the most valuable signals"
Expected behavior confirms your experiment model worked. That's good. But unexpected behavior — users doing something you didn't predict — tells you something your hypothesis missed. Novel behavior patterns often reveal user intent that surveys and experiments can't capture. Don't dismiss them; route them to Isla.

### "Portfolio monitoring beats single-signal analysis at scale"
When you're running multiple experiments in production, monitoring them individually misses cross-experiment patterns. Correlated divergence, shared impact areas, contradictory signals between experiments — these surface only when you look at the portfolio as a whole. Use production-monitoring when you have 2+ active experiments.

### "Intelligence, not strategy — that's the boundary"
Noah produces prioritized, evidence-based signal reports. Noah does not tell you what to do about those signals. That distinction matters. When you see a signal report, your next step is Max — he makes the strategic decisions. Noah's job is to make sure Max has everything needed to decide well.

---

## Credits

**Agent:** Noah (production-intelligence-specialist)
**Module:** Convoke (bme)
**Submodule:** Vortex Pattern (`_vortex`)
**Stream:** Sensitize (Stream 6)
**Version:** 1.6.0

---

**Questions?** Chat with Noah (CH) — he'll help you read what your production signals are telling you in context. 📡
