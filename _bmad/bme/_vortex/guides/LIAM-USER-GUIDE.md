# Liam User Guide - Hypothesis Engineer 💡

**Agent:** Liam (hypothesis-engineer)
**Version:** 1.6.0
**Module:** Convoke (bme) - Vortex Pattern
**Last Updated:** 2026-02-25

---

## Quick Start

**Who is Liam?**
Liam is a Hypothesis Engineer — a creative peer who ideates alongside you, not from a distance. He guides you through the "Hypothesize" stream of the Vortex pattern, turning validated problem definitions into testable solution hypotheses with structured brainwriting, 4-field hypothesis contracts, assumption risk mapping, and experiment design. Every hypothesis Liam produces has an explicit riskiest assumption identified upfront — because if you can't prove it wrong, it's not a hypothesis.

**When to use Liam:**
- Engineering testable hypotheses from a validated problem definition (HC2)
- Running structured brainwriting to generate ideas that go beyond the obvious
- Producing 1-3 hypothesis contracts in the 4-field format (Expected Outcome, Target Behavior Change, Rationale, Riskiest Assumption)
- Mapping and classifying assumptions by lethality × uncertainty
- Designing experiments that target the riskiest assumption first
- Producing experiment briefs with pre-defined success criteria for Wade to execute

**Liam vs. General Brainstorming — which do I need?**

| | Liam 💡 (Structured Brainwriting) | General Brainstorming |
|---|---|---|
| **Process** | 3-round structured brainwriting (obvious → bold → synthesis) | Freeform idea generation |
| **Output** | 1-3 hypothesis contracts in 4-field format | List of ideas |
| **Rigor** | Every hypothesis must be falsifiable | No falsifiability check |
| **Assumptions** | Explicitly mapped by lethality × uncertainty | Implicit, unexamined |
| **Next step** | Test the riskiest assumption first | "Pick the best idea" |

**Decision aid:** If you need to turn a problem definition into testable, investment-grade hypotheses with explicit assumptions and experiment-ready structure → **Liam**. If you just want to generate a list of ideas without rigor → general brainstorming (but you'll end up back here eventually).

**What you'll get:**
Hypothesis contracts (HC3 artifacts) containing 1-3 testable hypotheses in 4-field format, an assumption risk map prioritized by lethality × uncertainty, recommended testing order, and optionally an enriched HC3 with experiment parameters ready for Wade to execute.

---

## How to Invoke Liam

### Method 1: Direct Agent File Reading (Recommended)

Read Liam's agent file to activate him. This works in any environment:

**Claude Code:**
```
Read the file at _bmad/bme/_vortex/agents/hypothesis-engineer.md
```

**Terminal:**
```bash
cat _bmad/bme/_vortex/agents/hypothesis-engineer.md
```

**Claude.ai:** Copy the contents of `_bmad/bme/_vortex/agents/hypothesis-engineer.md` and paste into the chat.

---

### Method 2: Skill Activation (BMAD Environments Only)

If your environment supports BMAD skills:

```
/bmad-agent-bme-hypothesis-engineer
```

---

## Liam's Menu Options

Once Liam activates, you'll see menu options for his available workflows:

```
1. [MH] Redisplay Menu Help
2. [CH] Chat with Liam about hypothesis engineering, assumption mapping, or experiment design
3. [HE] Hypothesis Engineering: Engineer testable hypotheses from validated problem definitions
4. [AM] Assumption Mapping: Surface and classify hidden assumptions by risk
5. [ED] Experiment Design: Design experiments targeting riskiest assumptions first
6. [PM] Start Party Mode
7. [DA] Dismiss Agent
```

### How to Select an Option

1. **Number:** Type `3` to select option 3
2. **Command Code:** Type `HE` to start hypothesis engineering
3. **Fuzzy Match:** Type `hypothesis` or `assumption` - Liam will match the command

---

## Workflows

### [HE] Hypothesis Engineering (5 steps)

Engineer testable hypotheses from validated problem definitions using structured 3-round brainwriting. Takes an HC2 problem definition (from Mila) and produces 1-3 hypothesis contracts in the 4-field format with an assumption risk map and recommended testing order.

**Steps:**
1. Setup & Input Validation
2. Problem Context & Opportunity Mapping
3. Structured Brainwriting & Hypothesis Drafting
4. Assumption Extraction & Risk Mapping
5. Synthesize & Route

**Output:** `{output_folder}/vortex-artifacts/hc3-hypothesis-contract-{date}.md`
**Time:** 90-120 minutes

**The 3-Round Brainwriting Process:**
- **Round 1 (Obvious):** Generate the safe, expected hypotheses — get them out of your system
- **Round 2 (Bold):** Push past the obvious — what's the version that scares you a little?
- **Round 3 (Synthesis):** Combine, refine, and sharpen into 1-3 investment-grade hypothesis contracts

---

### [AM] Assumption Mapping (4 steps)

Deep-dive assumption analysis across your hypothesis contracts. Surfaces unstated assumptions, classifies them by lethality × uncertainty, and produces a prioritized testing order. This is a standalone workflow for when stakes are high or when you need to re-map assumptions after new evidence.

**Steps:**
1. Setup & Input Validation
2. Assumption Inventory & Extraction
3. Classification & Risk Mapping
4. Synthesize & Route

**Output:** Working document (enriches existing risk map — no separate artifact file)
**Time:** 45-90 minutes

**When to use Assumption Mapping vs. Hypothesis Engineering:**
- **Hypothesis Engineering** includes assumption mapping as step 4 — sufficient for most cases
- **Assumption Mapping** is a standalone deep-dive for when you need to re-examine assumptions with fresh evidence, analyze across multiple hypotheses, or when stakes are high enough to warrant a dedicated pass

---

### [ED] Experiment Design (4 steps)

Design experiments targeting the riskiest assumptions first — methodology, success criteria, metrics, and duration. Takes a validated HC3 (with assumption risk map) and produces an enriched HC3 with experiment parameters that Wade can execute.

**Steps:**
1. Setup & Input Validation
2. Hypothesis Context & Experiment Targets
3. Experiment Methodology & Success Criteria
4. Synthesize & Route

**Output:** `{output_folder}/vortex-artifacts/hc3-experiment-design-{date}.md`
**Time:** 60-120 minutes

**The key rule:** Define success before you see results. Pre-defined success criteria prevent teams from moving the goalposts after data comes in. You commit to what success looks like before the experiment runs — and you hold yourself to it.

**Methodology options:** User Interview, Concierge Test, Landing Page / Smoke Test, Prototype Test, A/B Test, Wizard of Oz

---

### Assumption Flagging → Isla Backflow (HC9)

Sometimes during hypothesis engineering, Liam identifies an assumption that is too risky to test without prior validation from real users. When this happens:

1. Liam surfaces an assumption with **HIGH lethality** and **HIGH uncertainty** — if it's wrong, the hypothesis collapses, and there's no evidence either way
2. This assumption is flagged in the HC3's **Flagged Concerns** section (optional Section 5)
3. The Compass routing suggests: → Isla 🔍 `user-interview` — ⚡ Unvalidated assumption flagged (HC9)
4. Isla conducts targeted user research to validate or invalidate the specific assumption
5. You return to Liam with validated evidence and continue hypothesis engineering with stronger foundations

**When this happens:** When Liam's workflow identifies assumptions that are foundational to the hypothesis but have zero supporting evidence. Testing the hypothesis without validating these assumptions first would be building on sand.

**What it looks like in the HC3:**

```markdown
### 5. Flagged Concerns

| Concern | Impact | Recommended Action |
|---------|--------|-------------------|
| "Users actually want X" is unvalidated | If wrong, invalidates H1 and H2 entirely | Route to Isla for targeted user interviews |
```

---

## Liam's Philosophy: Hypotheses as Craft

### The Hypothesize Stream (Vortex Pattern)

Liam guides teams through the "Hypothesize" stream (Stream 4):
- **Structured brainwriting produces better ideas than unstructured brainstorming** — constraints breed creativity
- **4-field hypothesis contracts force clarity** — every hypothesis has an expected outcome, target behavior change, rationale, and riskiest assumption
- **Assumption mapping separates what we know from what we think we know** — surface the hidden bets
- **The riskiest assumption gets tested first, not the easiest one** — prioritize by lethality × uncertainty
- **Good hypotheses are falsifiable** — if you can't prove it wrong, it's not a hypothesis

---

## Chatting with Liam (CH)

Select **[CH] Chat** to discuss:
- Hypothesis engineering and the 4-field contract format
- Structured brainwriting techniques and ideation methods
- Assumption mapping and risk classification
- Experiment design and methodology selection
- When to use which Liam workflow
- How to strengthen weak hypotheses

**Example questions:**
- "How do I write a strong riskiest assumption?"
- "What's the difference between hypothesis engineering and assumption mapping?"
- "When should I run experiment design vs. handing off to Wade directly?"
- "How do I know if my hypothesis is falsifiable?"
- "What makes a good 4-field hypothesis contract?"
- "When should I flag an assumption for Isla instead of testing it?"
- "How do I pick between a concierge test and a prototype test?"
- "What if my brainwriting only produces obvious ideas?"

---

## Troubleshooting

### Error: "Configuration Error: Cannot load config file"

**How to fix:**
1. Check if `_bmad/bme/_vortex/config.yaml` exists
2. If missing: `npx convoke-install-vortex`

### Error: "Workflow Error: Cannot load hypothesis engineering workflow"

**How to fix:**
1. Check workflow files exist in `_bmad/bme/_vortex/workflows/`
2. Run `npx convoke-doctor` to diagnose
3. If missing: `npx convoke-install-vortex`

---

## Tips from Liam

### "The 4-field contract is your clarity checkpoint"
If you can't fill in all four fields — Expected Outcome, Target Behavior Change, Rationale, Riskiest Assumption — you don't have a hypothesis yet. You have a hunch. That's fine as a starting point, but don't ship hunches to Wade. Sharpen until every field is specific and falsifiable.

### "Your riskiest assumption is the one that kills everything"
Not the assumption that's easiest to test. Not the one you're most curious about. The one that, if wrong, makes the entire hypothesis collapse. Find that one. Test it first. Everything else can wait.

### "Structured brainwriting beats brainstorming because constraints breed creativity"
Round 1 gets the obvious ideas out. Round 2 pushes you past comfortable. Round 3 synthesizes the best of both into something you couldn't have reached by freeform brainstorming alone. Trust the structure — it works because it forces you to go further than you would on your own.

### "If you can't prove it wrong, it's not a hypothesis"
This is the fundamental test. If there's no result that would make you say "we were wrong," you're not testing anything — you're confirming what you already believe. That's not hypothesis engineering. That's validation theater.

---

## Credits

**Agent:** Liam (hypothesis-engineer)
**Module:** Convoke (bme)
**Submodule:** Vortex Pattern (`_vortex`)
**Stream:** Hypothesize (Stream 4)
**Version:** 1.6.0

---

**Questions?** Chat with Liam (CH) — he'll challenge your assumptions and help you build hypotheses worth testing! 💡
