# Emma User Guide - Contextualization Expert 🎯

**Agent:** Emma (contextualization-expert)
**Version:** 1.6.4
**Module:** Convoke (bme) - Vortex Pattern
**Last Updated:** 2026-03-02

---

## Quick Start

**Who is Emma?**
Emma is a Contextualization Expert who helps teams establish strategic context before diving into solutions. She guides you through the "Contextualize" stream of the Vortex pattern — creating lean personas focused on jobs-to-be-done, defining product vision with strategic clarity, and deciding which problem space to investigate.

**When to use Emma:**
- Creating lean user personas focused on jobs-to-be-done (not demographics)
- Defining product vision and strategic scope
- Deciding which problem space to investigate and setting boundaries
- Challenging assumptions before building
- Aligning teams around the "why" before the "what"
- Validating existing personas and vision documents for completeness

**Emma vs. Isla — which agent do I need?**

| | Emma 🎯 (Contextualize) | Isla 🔍 (Empathize) |
|---|---|---|
| **When** | Before research — you need strategic context | During research — you need to understand users deeply |
| **Input** | Business context, market landscape, strategic goals | Real users, interview data, observations |
| **Output** | Lean personas, product vision, problem scope | Empathy maps, interview findings, discovery research |
| **Focus** | What is the landscape? (strategy-based) | Who are the users? (evidence-based) |

**Decision aid:** If you need to define the strategic context, create lean personas, or set product vision before research begins → **Emma**. If you have access to real users and need to understand them deeply → **Isla**.

**What you'll get:**
Lean personas focused on jobs-to-be-done and problem contexts, product vision documents with strategic clarity, and problem scope definitions with clear boundaries and assumption identification.

---

## How to Invoke Emma

### Method 1: Direct Agent File Reading (Recommended)

Read Emma's agent file to activate her. This works in any environment:

**Claude Code:**
```
Read the file at _bmad/bme/_vortex/agents/contextualization-expert.md
```

**Terminal:**
```bash
cat _bmad/bme/_vortex/agents/contextualization-expert.md
```

**Claude.ai:** Copy the contents of `_bmad/bme/_vortex/agents/contextualization-expert.md` and paste into the chat.

---

### Method 2: Skill Activation (BMAD Environments Only)

If your environment supports BMAD skills:

```
/bmad-agent-bme-contextualization-expert
```

---

## Emma's Menu Options

Once Emma activates, you'll see menu options for her available workflows:

```
1. [MH] Redisplay Menu Help
2. [CH] Chat with Emma about contextualization, lean personas, or product vision
3. [LP] Create Lean Persona: Rapid user persona in 6 steps
4. [PV] Define Product Vision: Strategic vision and scope in 6 steps
5. [CS] Contextualize Scope: Decide which problem space to investigate
6. [VL] Validate Context: Review existing personas/vision for completeness
7. [PM] Start Party Mode
8. [DA] Dismiss Agent
```

### How to Select an Option

1. **Number:** Type `3` to select option 3
2. **Command Code:** Type `LP` to create a lean persona
3. **Fuzzy Match:** Type `persona` or `vision` or `scope` - Emma will match the command

---

## Workflows

### [LP] Create Lean Persona

Create lean user personas focused on jobs-to-be-done and problem contexts — not demographics. Lean personas are lightweight, actionable, and designed to guide decisions rather than collect fictional details.

**Output:** `{output_folder}/vortex-artifacts/lean-persona-{name}-{date}.md`
**Time:** 30-60 minutes

**When to use Lean Persona:**
You're starting a new product initiative and need to define who you're building for. You want to focus on what job the user is hiring your product to do, not their age, gender, or fictional backstory.

---

### [PV] Define Product Vision

Define product vision and scope with strategic clarity. A product vision anchors all downstream work — from research to experimentation to production. Without it, teams build features instead of solving problems.

**Output:** `{output_folder}/vortex-artifacts/product-vision-{date}.md`
**Time:** 45-90 minutes

**When to use Product Vision:**
You need to align the team around the "why" before debating the "what." A clear product vision prevents feature bloat, scope creep, and misaligned execution.

---

### [CS] Contextualize Scope

Decide which problem space to investigate and define boundaries. Scope contextualization prevents teams from boiling the ocean — it forces a deliberate choice about which problem deserves focus.

**Output:** `{output_folder}/vortex-artifacts/problem-scope-{date}.md`
**Time:** 30-60 minutes

**When to use Contextualize Scope:**
You have multiple possible problem areas and need to decide which one to investigate first. Or you have a broad problem and need to draw boundaries around a manageable scope.

---

### [VL] Validate Context

Review existing personas, vision documents, and scope definitions for completeness and strategic coherence.

**When to use Validate Context:**
- You created a persona or vision document and want expert review
- You inherited artifacts from another team
- Your understanding has changed and you need to update
- You're preparing to hand off to Isla for user research

**What Emma checks:**
- Are personas focused on jobs-to-be-done (not demographics)?
- Is the product vision specific enough to guide decisions?
- Are scope boundaries clear and assumptions identified?
- Are insights backed by strategic rationale?

---

## Emma's Philosophy: Context Before Solutions

### The Contextualize Stream (Vortex Pattern)

Emma guides teams through the "Contextualize" stream (Stream 1):
- **Context before solutions** — know WHO and WHY before building WHAT
- **Lean personas over heavy empathy maps** — just enough detail to guide decisions
- **Product vision anchors all downstream work** — clarity drives alignment
- **The right problem is more valuable than the perfect solution**
- **Scope boundaries are as important as scope definitions**

---

## Chatting with Emma (CH)

Select **[CH] Chat** to discuss:
- Lean Startup methodologies and strategic framing
- Jobs-to-be-Done framework and lean personas
- Product vision and strategic alignment
- Problem-product space navigation
- Assumption identification and validation
- Contextualization strategies

**Example questions:**
- "How do I validate assumptions before building?"
- "What's the difference between problem-solution fit and product-market fit?"
- "How do I define a problem space?"
- "What makes a good lean persona vs. a traditional persona?"
- "How do I write a product vision that actually guides decisions?"
- "When should I hand off to Isla for user research?"

---

## Troubleshooting

### Error: "Configuration Error: Cannot load config file"

**How to fix:**
1. Check if `_bmad/bme/_vortex/config.yaml` exists
2. If missing: `npx convoke-install-vortex`

### Error: "Unknown skill: bmad-agent-bme-contextualization-expert"

**What it means:**
Slash commands aren't available in your environment.

**How to fix:**
Use Method 2 (Direct Agent File Reading) instead:

1. Read the file: `_bmad/bme/_vortex/agents/contextualization-expert.md`
2. Emma will activate normally
3. This method works in all environments

---

## Tips from Emma

### "Context before solutions"
Before you debate features, align on who you're building for and why it matters. A clear strategic context prevents wasted execution effort and keeps teams focused on the right problems.

### "Personas over demographics"
Age, gender, and income don't drive behavior — jobs-to-be-done and context do. Instead of "millennials," ask "what job are they hiring your product to do?"

### "Vision before features"
Align your team around the "why" before you debate the "what." A clear product vision prevents feature bloat and scope creep.

### "Problem-solution fit comes first"
Before you find product-market fit, validate problem-solution fit. Are you solving a real problem? For the right people? In the right context?

### "Clarity is kindness"
Unclear product strategy wastes everyone's time. Be specific about problem spaces, target users, and success criteria. Clarity accelerates execution.

---

## Credits

**Agent:** Emma (contextualization-expert)
**Module:** Convoke (bme)
**Submodule:** Vortex Pattern (`_vortex`)
**Stream:** Contextualize (Stream 1)
**Version:** 1.6.4

---

**Questions?** Chat with Emma (CH) - she's here to help you contextualize your product strategy! 🎯
