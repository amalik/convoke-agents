# Isla User Guide - Discovery & Empathy Expert 🔍

**Agent:** Isla (discovery-empathy-expert)
**Version:** 1.5.0
**Module:** Convoke (bme) - Vortex Pattern
**Last Updated:** 2026-02-20

---

## Quick Start

**Who is Isla?**
Isla is a qualitative research expert who helps teams deeply understand their users through structured discovery and empathy work. She guides you through the "Empathize" stream of the Vortex pattern — user interviews, empathy mapping, and discovery research.

**When to use Isla:**
- Understanding users before defining problems
- Designing and conducting user interviews
- Creating evidence-based empathy maps
- Planning discovery research activities
- Synthesizing qualitative research findings
- Validating assumptions about user needs and behaviors

**What you'll get:**
Empathy maps grounded in research, interview guides and findings, discovery research plans and synthesis documents.

---

## How to Invoke Isla

### Method 1: Direct Agent File Reading (Recommended)

Read Isla's agent file to activate her. This works in any environment:

**Claude Code:**
```
Read the file at _bmad/bme/_vortex/agents/discovery-empathy-expert.md
```

**Terminal:**
```bash
cat _bmad/bme/_vortex/agents/discovery-empathy-expert.md
```

**Claude.ai:** Copy the contents of `_bmad/bme/_vortex/agents/discovery-empathy-expert.md` and paste into the chat.

---

### Method 2: Skill Activation (BMAD Environments Only)

If your environment supports BMAD skills:

```
/bmad-agent-bme-discovery-empathy-expert
```

---

## Isla's Menu Options

Once Isla activates, you'll see menu options for her available workflows:

```
1. [MH] Redisplay Menu Help
2. [CH] Chat with Isla about user research, empathy, and discovery
3. [EM] Empathy Map: Create structured empathy maps (Says/Thinks/Does/Feels)
4. [UI] User Interview: Design interview scripts and capture findings
5. [UD] User Discovery: Plan and execute broader discovery research
6. [VE] Validate: Review empathy maps and research artifacts
7. [PM] Start Party Mode
8. [DA] Dismiss Agent
```

### How to Select an Option

1. **Number:** Type `3` to select option 3
2. **Command Code:** Type `EM` to create an empathy map
3. **Fuzzy Match:** Type `empathy` or `interview` - Isla will match the command

---

## Workflows

### [EM] Empathy Map (6 steps)

Create comprehensive empathy maps for target users through structured exploration.

**Steps:**
1. Define Target User
2. Says & Thinks
3. Does & Feels
4. Pain Points
5. Gains
6. Synthesize

**Output:** `{output_folder}/empathy-map-{user-name}-{date}.md`
**Time:** 30-60 minutes

---

### [UI] User Interview (6 steps)

Design interview scripts, plan participant recruitment, and capture findings.

**Steps:**
1. Define Research Goals
2. Design Interview Script
3. Plan Participant Recruitment
4. Conduct Interviews (guidance)
5. Capture Findings
6. Synthesize Insights

**Output:** `{output_folder}/user-interview-{topic}-{date}.md`
**Time:** 45-90 minutes (planning), plus interview time

---

### [UD] User Discovery (6 steps)

Plan and execute broader discovery research beyond interviews.

**Steps:**
1. Define Discovery Scope
2. Choose Research Methods
3. Plan Research Activities
4. Execute Research (guidance)
5. Organize Raw Data
6. Synthesize Discovery Findings

**Output:** `{output_folder}/user-discovery-{topic}-{date}.md`
**Time:** 60-120 minutes (planning), plus research time

---

## Isla's Philosophy: Listen Before You Define

### The Empathize Stream (Vortex Pattern)

Isla guides teams through the "Empathize" stream:
- **Listen before you define** - Understand the problem from the user's perspective first
- **Observe before you assume** - Watch what people do, not just what they say
- **Feelings are data** - Emotional responses reveal unmet needs
- **Talk to real people, not personas** - Personas come after research, not before
- **The messier the research, the richer the insights** - Embrace ambiguity

---

## Chatting with Isla (CH)

Select **[CH] Chat** to discuss:
- Qualitative research methods
- Interview technique and question design
- Empathy mapping best practices
- User observation and ethnographic methods
- Research synthesis and pattern recognition
- When to use which research method

**Example questions:**
- "How do I avoid leading questions in interviews?"
- "When should I use empathy mapping vs. user interviews?"
- "How many users do I need to talk to?"
- "How do I synthesize findings from multiple interviews?"

---

## Troubleshooting

### Error: "Configuration Error: Cannot load config file"

**How to fix:**
1. Check if `_bmad/bme/_vortex/config.yaml` exists
2. If missing: `npx convoke-install-vortex`

### Error: "Cannot load discovery workflow"

**How to fix:**
1. Check workflow files exist in `_bmad/bme/_vortex/workflows/`
2. Run `npx convoke-doctor` to diagnose
3. If missing: `npx convoke-install-vortex`

---

## Tips from Isla

### "The best interviews feel like conversations"
Your script is a guide, not a rigid questionnaire. Follow the participant's energy and probe where they show emotion or hesitation.

### "Ask about the past, not the future"
"Tell me about the last time you..." produces better insights than "Would you ever...?" People are terrible at predicting their own behavior.

### "Silence is your most powerful tool"
When you stop talking, people fill the silence with their real thoughts. Resist the urge to fill every pause.

### "Feelings are data"
When a participant's voice changes, they lean forward, or they hesitate — that's where the real insight lives. Note the emotion, not just the words.

---

## Credits

**Agent:** Isla (discovery-empathy-expert)
**Module:** Convoke (bme)
**Submodule:** Vortex Pattern (`_vortex`)
**Stream:** Empathize (Stream 2)
**Version:** 1.5.0

---

**Questions?** Chat with Isla (CH) - she's here to help you understand your users! 🔍
