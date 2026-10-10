---
workflow: user-interview
type: step-file
description: Design interview scripts, conduct user interviews, and synthesize findings into actionable insights
author: Isla (discovery-empathy-expert)
version: 1.5.0
---

# User Interview Workflow

This workflow guides you through the full lifecycle of user interviews, from defining research goals to synthesizing insights that drive product decisions.

## What is a User Interview?

A user interview is a qualitative research method where you have a structured conversation with a real or potential user to understand their experiences, needs, and behaviors. Unlike surveys, interviews let you go deep:

- **Uncover the "why"** - Understand motivations and reasoning behind behaviors
- **Discover unknowns** - Surface problems and needs you didn't know existed
- **Build empathy** - Develop genuine understanding of your users' world
- **Generate hypotheses** - Create testable assumptions grounded in real stories
- **Validate or invalidate** - Test existing assumptions against lived experience

## Workflow Structure

**Step-file architecture:**
- Just-in-time loading (each step loads only when needed)
- Sequential enforcement (must complete step N before step N+1)
- State tracking in frontmatter (progress preserved)

## Steps Overview

1. **Define Research Goals** - What do you need to learn and why?
2. **Design Interview Script** - Craft open-ended questions that avoid bias
3. **Plan Participant Recruitment** - Identify and recruit the right participants
4. **Conduct Interviews** - Guidance for active listening, probing, and note-taking
5. **Capture Findings** - Document raw findings from each interview session
6. **Synthesize Insights** - Identify patterns, themes, and actionable insights

## Participant Data

Interviewing people means holding personal data: contact details, screening answers, recordings, and quotes. Step 3 asks you to decide how you will handle it: what you collect and who sees it, on what basis, how long you keep it, and how someone withdraws. Step 2 puts those decisions into what you tell participants before they consent, and Steps 4 and 5 apply them during the interviews and in the findings.

This is research practice, not legal advice. The decisions are yours and your organization's; the report records what you decided.

## Output

**Artifact:** User interview report in `{output_folder}/user-interview-{topic}-{date}.md`

**Template:** Uses [user-interview.template.md](user-interview.template.md)

---

## INITIALIZATION

Load config from {project-root}/_bmad/bme/_vortex/config.yaml

Load step: {project-root}/_bmad/bme/_vortex/workflows/user-interview/steps/step-01-research-goals.md
