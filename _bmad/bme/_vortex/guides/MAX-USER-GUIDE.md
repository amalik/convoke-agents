# Max User Guide - Learning & Decision Expert 🧭

**Agent:** Max (learning-decision-expert)
**Version:** 1.5.0
**Module:** BMAD Enhanced (bme) - Vortex Pattern
**Last Updated:** 2026-02-20

---

## Quick Start

**Who is Max?**
Max is a validated learning synthesizer and strategic decision expert. He helps teams turn experiment results into clear decisions using structured frameworks. He guides you through the "Systematize" stream of the Vortex pattern — capturing learnings, making pivot/patch/persevere decisions, and navigating between Vortex streams.

**When to use Max:**
- After running experiments (with Wade) — capture what you learned
- When you need to decide: pivot, patch, or persevere
- When you're unsure which Vortex stream to focus on next
- When experiment data needs structured analysis
- When the team needs to align on a strategic decision

**What you'll get:**
Learning cards, pivot/patch/persevere assessments, Vortex navigation recommendations — all evidence-based and decision-focused.

---

## How to Invoke Max

### Method 1: Direct Agent File Reading (Recommended)

Read Max's agent file to activate him. This works in any environment:

**Claude Code:**
```
Read the file at _bmad/bme/_vortex/agents/learning-decision-expert.md
```

**Terminal:**
```bash
cat _bmad/bme/_vortex/agents/learning-decision-expert.md
```

**Claude.ai:** Copy the contents of `_bmad/bme/_vortex/agents/learning-decision-expert.md` and paste into the chat.

---

### Method 2: Slash Command (BMAD Environments Only)

If your environment supports BMAD slash commands:

```
/bmad-agent-bme-learning-decision-expert
```

---

## Max's Menu Options

Once Max activates, you'll see menu options for his available workflows:

```
1. [MH] Redisplay Menu Help
2. [CH] Chat with Max about validated learning, decisions, and strategy
3. [LC] Learning Card: Capture what was tested, learned, and decided
4. [PP] Pivot/Patch/Persevere: Decision framework after experiments
5. [VN] Vortex Navigation: Decide which stream to focus on next
6. [VE] Validate: Review learning cards and decision artifacts
7. [PM] Start Party Mode
8. [DA] Dismiss Agent
```

### How to Select an Option

1. **Number:** Type `3` to select option 3
2. **Command Code:** Type `LC` to create a learning card
3. **Fuzzy Match:** Type `learning` or `pivot` - Max will match the command

---

## Workflows

### [LC] Learning Card (6 steps)

Capture validated learnings from experiments as structured learning cards.

**Steps:**
1. Experiment Context
2. Raw Results
3. Analysis
4. Validated Learning
5. Implications
6. Synthesize

**Output:** `{output_folder}/learning-card-{experiment-name}-{date}.md`
**Time:** 30-45 minutes

---

### [PP] Pivot/Patch/Persevere (6 steps)

Structured decision framework for deciding direction after experiments.

**Steps:**
1. Evidence Review
2. Hypothesis Assessment
3. Option Analysis (Pivot/Patch/Persevere)
4. Stakeholder Input
5. Decision
6. Action Plan

**Output:** `{output_folder}/pivot-patch-persevere-{topic}-{date}.md`
**Time:** 45-90 minutes

**The Three Options:**
- **Pivot** - Change direction fundamentally (new hypothesis, new segment, new approach)
- **Patch** - Adjust the current approach (tweak, iterate, refine)
- **Persevere** - Stay the course (evidence supports the current direction)

---

### [VN] Vortex Navigation (6 steps)

Decide which Vortex stream to focus on next based on current evidence and gaps.

**Steps:**
1. Current State Assessment
2. Evidence Inventory
3. Gap Analysis
4. Stream Evaluation
5. Recommendation
6. Navigation Plan

**Output:** `{output_folder}/vortex-navigation-{date}.md`
**Time:** 30-60 minutes

---

## Max's Philosophy: Data Tells a Story

### The Systematize Stream (Vortex Pattern)

Max guides teams through the "Systematize" stream:
- **Data tells a story — learn to read it** - Raw data is noise until you extract the signal
- **Every experiment has a lesson, even failed ones** - Negative results are still validated learning
- **Decide and move — analysis paralysis kills innovation** - Make the best decision with available evidence, then act
- **Pivot is not failure, it's intelligence** - Changing direction based on evidence is a sign of strength
- **Systematize what you learn** - Captured learning compounds; uncaptured learning evaporates

---

## Chatting with Max (CH)

Select **[CH] Chat** to discuss:
- Validated learning methodology
- Experiment result interpretation
- Strategic decision-making frameworks
- Pivot vs. persevere decisions
- Evidence-based product strategy
- Vortex stream navigation

**Example questions:**
- "I ran several experiments and need to decide what to do next"
- "How do I know if my experiment results are significant?"
- "When should I pivot vs. persevere?"
- "Which Vortex stream should I focus on?"
- "How do I capture learnings so my team doesn't repeat mistakes?"

---

## Troubleshooting

### Error: "Configuration Error: Cannot load config file"

**How to fix:**
1. Check if `_bmad/bme/_vortex/config.yaml` exists
2. If missing: `npx bmad-install-vortex-agents`

### Error: "Cannot load learning workflow"

**How to fix:**
1. Check workflow files exist in `_bmad/bme/_vortex/workflows/`
2. Run `npx bmad-doctor` to diagnose
3. If missing: `npx bmad-install-vortex-agents`

---

## Tips from Max

### "Separate observation from interpretation"
When capturing experiment results, first record what happened (raw data). Then, separately, analyze what it means. Mixing the two leads to confirmation bias.

### "The evidence suggests..."
Start every decision discussion with evidence, not opinion. If you can't point to data, you're guessing — and that's okay, as long as you know you're guessing.

### "Three options, always"
When facing a decision, always generate at least three options. The first two feel obvious. The third often reveals the real insight.

### "Failed experiments are the most valuable"
A "failed" experiment that clearly invalidates an assumption saves months of building the wrong thing. Celebrate the learning, not just the success.

---

## Credits

**Agent:** Max (learning-decision-expert)
**Module:** BMAD Enhanced (bme)
**Submodule:** Vortex Pattern (`_vortex`)
**Stream:** Systematize (Stream 7)
**Version:** 1.5.0

---

**Questions?** Chat with Max (CH) - he's here to help you turn data into decisions! 🧭
