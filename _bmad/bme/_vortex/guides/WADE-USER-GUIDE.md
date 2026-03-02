# Wade User Guide - Lean Experiments Specialist 🧪

**Agent:** Wade (lean-experiments-specialist)
**Version:** 1.6.4
**Module:** BMAD Enhanced (bme) - Vortex Pattern
**Last Updated:** 2026-03-02

---

## Quick Start

**Who is Wade?**
Wade is a Validated Learning Expert and First Externalization Designer who helps teams create minimal, fast, inexpensive experiments to validate product direction. He guides you through the "Externalize" stream of the Vortex pattern — designing MVPs, running Build-Measure-Learn experiments, validating technical feasibility (proof-of-concept), and validating business value (proof-of-value). Every build Wade produces is an experiment for validated learning, not a feature to ship.

**When to use Wade:**
- Designing Minimum Viable Products that test the riskiest assumption
- Running Build-Measure-Learn experiment cycles
- Validating technical feasibility before investing in business case (proof-of-concept)
- Validating business value and market demand (proof-of-value)
- Reviewing experiment designs for rigor before execution
- Producing experiment artifacts (HC4) that connect back to Liam's hypotheses (HC3)

**Wade vs. Just Building — which do I need?**

| | Wade 🧪 (Structured Experiments) | Just Building |
|---|---|---|
| **Process** | Hypothesis → MVP → Measure → Learn → Decide | Spec → Build → Ship → Hope |
| **Output** | HC4 experiment context with validated learning | A product feature |
| **Rigor** | Pre-defined success criteria, falsifiable hypothesis | "We'll know it when we see it" |
| **Failure mode** | Fast learning from small bets | Expensive learning from big bets |
| **Next step** | Noah interprets production signals, Max decides | Ship more features |

**Decision aid:** If you need to validate assumptions before committing resources → **Wade**. If you already know what to build and just need to build it → BMAD Core development agents.

**What you'll get:**
MVP specifications, lean experiment designs with Build-Measure-Learn structure, proof-of-concept results for technical feasibility, proof-of-value validations for business case, and validated learning documentation — all as HC4 experiment context artifacts that feed into Noah's signal interpretation.

---

## How to Invoke Wade

### Method 1: Direct Agent File Reading (Recommended)

Read Wade's agent file to activate him. This works in any environment:

**Claude Code:**
```
Read the file at _bmad/bme/_vortex/agents/lean-experiments-specialist.md
```

**Terminal:**
```bash
cat _bmad/bme/_vortex/agents/lean-experiments-specialist.md
```

**Claude.ai:** Copy the contents of `_bmad/bme/_vortex/agents/lean-experiments-specialist.md` and paste into the chat.

---

### Method 2: Slash Command (BMAD Environments Only)

If your environment supports BMAD slash commands:

```
/bmad-agent-bme-lean-experiments-specialist
```

---

## Wade's Menu Options

Once Wade activates, you'll see menu options for his available workflows:

```
1. [MH] Redisplay Menu Help
2. [CH] Chat with Wade about lean experiments, MVPs, validated learning, or Lean Startup
3. [ME] Design MVP: Create Minimum Viable Product specification in 6 steps
4. [LE] Run Lean Experiment: Execute Build-Measure-Learn cycle in 6 steps
5. [PC] Create Proof of Concept: Validate technical feasibility in 6 steps
6. [PV] Create Proof of Value: Validate business value in 6 steps
7. [VE] Validate Experiment: Review experiment design for rigor
8. [PM] Start Party Mode
9. [DA] Dismiss Agent
```

### How to Select an Option

1. **Number:** Type `3` to select option 3
2. **Command Code:** Type `ME` to design an MVP
3. **Fuzzy Match:** Type `mvp` or `experiment` or `proof` - Wade will match the command

---

## Workflows

### [ME] Design MVP (6 steps)

Design a Minimum Viable Product specification using Build-Measure-Learn methodology. An MVP is not a feature-light product — it's the smallest experiment that tests the riskiest assumption from Liam's hypothesis contracts (HC3).

**Output:** `{output_folder}/vortex-artifacts/hc4-mvp-spec-{date}.md`
**Time:** 60-120 minutes

**When to use Design MVP:**
You have validated hypotheses from Liam and need to design the smallest thing that tests the riskiest assumption. You want to move from "we think" to "we know" with minimal investment.

---

### [LE] Run Lean Experiment (6 steps)

Execute a full Build-Measure-Learn cycle with structured hypothesis testing. Takes an HC3 hypothesis contract (from Liam) and walks through building the experiment, measuring results, and capturing validated learning.

**Output:** `{output_folder}/vortex-artifacts/hc4-experiment-results-{date}.md`
**Time:** 90-180 minutes (design + execution guidance)

**When to use Lean Experiment:**
You're ready to run a complete experiment cycle — build, measure, learn, decide. This is the core Build-Measure-Learn workflow that produces the HC4 experiment context Noah will interpret.

---

### [PC] Create Proof of Concept (6 steps)

Validate technical feasibility before investing in the business case. Can you build this? A proof-of-concept answers "is this technically possible?" before asking "should we build this?"

**Output:** `{output_folder}/vortex-artifacts/hc4-poc-results-{date}.md`
**Time:** 60-120 minutes

**When to use Proof of Concept:**
The riskiest assumption is technical — "can we build this at all?" Run a PoC before investing in business validation. Technical feasibility must come before market feasibility.

---

### [PV] Create Proof of Value (6 steps)

Validate business value and market demand. Should you build this? A proof-of-value answers "do users want this enough to pay/change behavior?" after technical feasibility is established.

**Output:** `{output_folder}/vortex-artifacts/hc4-pov-results-{date}.md`
**Time:** 60-120 minutes

**When to use Proof of Value:**
Technical feasibility is confirmed (via PoC or prior knowledge) and now you need to validate that users actually want this. Technical capability doesn't guarantee business success.

---

### [VE] Validate Experiment

Review an experiment design for rigor before execution.

**When to use Validate Experiment:**
- You designed an experiment and want expert review before running it
- You inherited experiment artifacts from another team
- You want to check if success criteria are truly falsifiable
- You're preparing to hand off to Noah for production signal interpretation

**What Wade checks:**
- Is the hypothesis falsifiable and specific?
- Are success metrics actionable (not vanity metrics)?
- Is the MVP truly minimal (smallest testable version)?
- Are pre-defined success criteria in place before results come in?
- Can this guide a pivot/patch/persevere decision?

---

## Wade's Philosophy: Externalization Over Speculation

### The Externalize Stream (Vortex Pattern)

Wade guides teams through the "Externalize" stream (Stream 5):
- **Build the smallest thing that validates learning** — not the best thing
- **Expose to real users early** — internal feedback isn't validation
- **Treat everything as an experiment** — hypothesis → test → learn
- **Outcomes over outputs** — focus on what we learn, not what we build
- **Fast and cheap beats slow and perfect** — speed enables iteration
- **MVP does not equal Minimum Viable Quality** — it must be functional enough to test the hypothesis

---

## Chatting with Wade (CH)

Select **[CH] Chat** to discuss:
- Lean Startup methodologies and Build-Measure-Learn cycles
- MVP design and what "minimum" really means
- Hypothesis testing and experiment methodology
- Proof-of-concept vs. proof-of-value decisions
- Actionable metrics vs. vanity metrics
- When to pivot vs. persevere
- Rapid prototyping and validated learning

**Example questions:**
- "How do I design an MVP that tests my riskiest assumption?"
- "What's the difference between proof-of-concept and proof-of-value?"
- "How do I write a falsifiable hypothesis for an experiment?"
- "What metrics should I track in a lean experiment?"
- "When should I pivot vs. persevere?"
- "How do I know if my MVP is truly minimal?"
- "What experiment methodology should I use for my hypothesis?"

---

## Troubleshooting

### Error: "Configuration Error: Cannot load config file"

**How to fix:**
1. Check if `_bmad/bme/_vortex/config.yaml` exists
2. If missing: `npx bmad-install-vortex-agents`

### Error: "Workflow Error: Cannot load lean experiment workflow"

**How to fix:**
1. Check workflow files exist in `_bmad/bme/_vortex/workflows/`
2. Run `npx bmad-doctor` to diagnose
3. If missing: `npx bmad-install-vortex-agents`

---

## Tips from Wade

### "Build the smallest thing that tests the riskiest assumption"
Don't build a full product to test if users want it. Build the smallest experiment that answers your biggest question. Sometimes that's a landing page, not an app.

### "Measure what matters"
Vanity metrics look good but don't drive decisions. Actionable metrics tell you what to do next. Instead of "page views," track "% who signed up after viewing pricing."

### "Learn fast, pivot faster"
Every experiment teaches something, even failures. The goal isn't to validate your idea — it's to learn what's true. Be willing to pivot when evidence contradicts assumptions.

### "Proof-of-concept before proof-of-value"
Can you build it? Doesn't mean should you build it. Validate technical feasibility first, then validate business case. Don't waste money proving market demand for something you can't deliver.

### "Fail fast is good, learn fast is better"
Failure is only valuable if you learn from it. Document what you learned, why experiments failed, and what that means for your next move. Failure without learning is just waste.

---

## Credits

**Agent:** Wade (lean-experiments-specialist)
**Module:** BMAD Enhanced (bme)
**Submodule:** Vortex Pattern (`_vortex`)
**Stream:** Externalize (Stream 5)
**Version:** 1.6.4

---

**Questions?** Chat with Wade (CH) - he's here to help you run lean experiments and validate your assumptions! 🧪
