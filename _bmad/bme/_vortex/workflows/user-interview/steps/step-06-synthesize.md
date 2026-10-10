---
step: 6
workflow: user-interview
title: Synthesize Insights
---

# Step 6: Synthesize Insights

Now that you have structured findings from multiple interviews, it's time to look across participants and extract patterns, themes, and actionable insights.

## Why This Matters

Individual interviews tell stories. Synthesis tells you what those stories mean together. Without synthesis, you have a collection of anecdotes. With synthesis, you have evidence-backed insights that can drive product decisions.

## The Synthesis Process

### Phase 1: Theme Identification

Look across all your interview findings and identify recurring themes. A theme is a pattern that appears in 3 or more interviews (or 40%+ of your participants, whichever is higher).

**How to identify themes:**

1. **Lay out all findings visually.** If using physical notes, use sticky notes on a wall. If digital, use a spreadsheet or affinity mapping tool.

2. **Group related findings.** Don't force categories -- let them emerge from the data. Ask: "Which findings are about the same underlying thing?"

3. **Name each group.** A good theme name captures the essence in a phrase:
   - Weak: "Tools" -- too vague
   - Strong: "Shadow systems maintained alongside official tools" -- specific and descriptive

4. **Count the evidence.** For each theme, note how many participants contributed to it and what their specific evidence was.

### Phase 2: Insight Formulation

Transform themes into insights. An insight is a non-obvious truth that has implications for what you should build or how you should position it.

**The Insight Formula:**

> **[User segment] [behavior/belief] because [underlying motivation], which means [implication for our product].**

**Examples:**

> Small business owners maintain shadow spreadsheets alongside their PM tools because PM tools don't support custom client reporting, which means a PM tool with built-in customizable reports could eliminate the dual-system workflow.

> Team members resist tool changes not because they dislike new tools but because they've invested effort in learning the current one, which means our onboarding needs to show immediate value within the first session to overcome switching inertia.

**Insight Quality Test:** If your insight would be equally true for any product in any market, it's too generic. Good insights are specific to your users and your context.

### Phase 3: Evidence Mapping

For each insight, build an evidence trail:

```
### Insight: {insight statement}

**Strength:** Strong / Moderate / Emerging
**Based on:** {N} of {total} participants

**Evidence:**
- P1: {specific finding or quote}
- P3: {specific finding or quote}
- P5: {specific finding or quote}
- P7: {specific finding or quote}

**Counter-evidence:**
- P2: {contradicting finding, if any}

**Confidence level:** High / Medium / Low
**Why this confidence level:** {explanation}
```

**Strength ratings:**
- **Strong:** Appeared in 60%+ of interviews with consistent behavioral evidence
- **Moderate:** Appeared in 40-60% of interviews or with mixed behavioral evidence
- **Emerging:** Appeared in 2-3 interviews; interesting but needs more validation

### Phase 4: Implications and Recommendations

For each strong or moderate insight, define what it means for your product:

1. **What should you build, change, or stop doing?**
   - Be specific. Not "improve onboarding" but "show value within the first 3 minutes by auto-importing existing data"

2. **What assumption was validated or invalidated?**
   - Reference back to your original research goals from Step 1

3. **What new questions emerged?**
   - Research always generates more questions. Capture them for the next round.

4. **What is the recommended next action?**
   - Build a prototype? Run a survey to quantify? Do more interviews with a specific segment? Pivot your approach?

### Phase 5: Research Quality Assessment

Honestly evaluate the quality of your research:

**Sample quality:**
- Did you talk to the right people? Were any participants clearly outside your target?
- Was there enough diversity? Or did everyone have the same perspective?

**Question quality:**
- Did any questions consistently produce shallow answers? (Note for future scripts)
- Did you discover that a key question was missing?

**Confidence assessment:**
- Which insights do you feel confident acting on?
- Which need more evidence before you commit resources?
- What would you do differently in the next round of interviews?

## Your Task

Complete the synthesis using the structure above:

1. Identify 3-5 themes from your findings
2. Formulate an insight for each theme (using the insight formula)
3. Map evidence for each insight
4. Define implications and next actions
5. Assess research quality honestly

## Example

**Theme 1: Shadow Systems**
- 5 of 8 participants maintain a parallel tracking system (spreadsheet, personal notes, or second tool) alongside their "official" PM tool
- The shadow system always contains information the official tool doesn't support: custom deadlines, client-specific views, personal priority rankings

**Insight:** Small business owners maintain shadow systems alongside PM tools because no single tool supports both team coordination AND client reporting in the format they need, which means a tool that eliminates the need for shadow systems would save 3-5 hours per week of duplicate work.

**Evidence:** P1 (spreadsheet), P3 (spreadsheet), P4 (Notion alongside Trello), P6 (personal task list), P8 (spreadsheet + calendar)
**Counter-evidence:** P2 uses only Asana but acknowledges "it doesn't do everything I need" and compensates with Slack reminders
**Confidence:** High -- consistent behavioral evidence across 5 of 8 participants
**Implication:** Build a prototype with customizable views that serve both team-facing and client-facing needs. Test whether eliminating the shadow system is a compelling enough value proposition.

---

## Your Turn

Please synthesize your findings using the phases above. Take your time -- this is where raw data becomes actionable intelligence.

**Tip:** The best insights often come from contradictions and surprises, not from confirmations. Pay special attention to findings that challenged your assumptions.

## Workflow Complete

After synthesis, I'll generate your complete user interview artifact using the template:

{project-root}/_bmad/bme/_vortex/workflows/user-interview/user-interview.template.md

Your artifact will include:
- Research goals and context
- Final interview script (as refined through the process)
- Participant summary, with the participant-data handling decisions from Step 3
- Raw findings per interview
- Synthesized themes and insights with evidence trails
- Recommendations and next actions
- Research quality assessment

Delete recordings, raw notes, screening answers, contact details, and the ID-to-person list when every condition you set in Step 3 is met -- by default that is after the withdrawal cut-off and after incentives are paid, so usually not yet -- then note the date in the report's Participant Data Handling table.

---

## Vortex Compass

Based on what you just completed, here are your evidence-driven options:

| If you learned... | Consider next... | Agent | Why |
|---|---|---|---|
| Interview insights ready for synthesis | research-convergence | Mila 🔬 | Converge interview findings into problem definition (HC1) |
| Riskiest insights identified | lean-experiment | Wade 🧪 | Test your riskiest insight with an experiment |
| Want to synthesize across users | empathy-map | Isla 🔍 | Map patterns across all interview subjects |

> **Note:** These are evidence-based recommendations. You can navigate to any Vortex agent
> at any time based on your judgment.

**Or run Max's [VN] Vortex Navigation** for a full gap analysis across all streams.
