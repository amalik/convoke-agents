---
step: 6
workflow: lean-persona
title: Synthesize
---

# Step 6: Synthesize

Now let's bring it all together into a lean persona artifact with a clear validation plan.

## Why This Matters

The lean persona document serves as:
- A shared understanding of who we're building for
- A hypothesis to validate (not a truth to assume)
- A decision-making tool (does this feature help THIS user do THIS job?)
- A validation roadmap (what do we test first?)

## Your Task

I'll create the final lean persona artifact using all the insights you've provided. But first, I need a few final pieces:

### 1. Identify your 3 riskiest assumptions

Look back at everything you've shared. What are the 3 things you THINK are true but haven't validated?

Examples:
- ASSUMPTION: "Users spend 5+ hours/week on status tracking"
- ASSUMPTION: "Team members would consistently update status if it took <5 min/day"
- ASSUMPTION: "Managers value confidence over detailed reporting"

### 2. Design 3 validation experiments

For each risky assumption, how will you test it?

**Format for each:**
- **Hypothesis:** If [assumption], then [observable behavior]
- **Method:** How will you test it? (Interview? Survey? Prototype? Landing page?)
- **Success criteria:** What would prove/disprove the hypothesis?
- **Timeline:** When will you run this test?

### 3. Decide: What will you do with the results?

- If hypothesis is VALIDATED → What's next?
- If hypothesis is INVALIDATED → Pivot or persevere?

## Example

**Riskiest Assumptions:**

1. **ASSUMPTION:** Remote managers spend 5+ hours/week just tracking team status
   - **Why risky:** If it's only 1-2 hours, solving this isn't high priority

2. **ASSUMPTION:** Managers would pay $20/person/month to save 3+ hours/week
   - **Why risky:** If they won't pay, we don't have a business model

3. **ASSUMPTION:** Team members would update status if it's async and takes <5 min/day
   - **Why risky:** If team won't engage, tool is useless

**Validation Experiments:**

**Experiment 1: Time Spent on Status**
- **Hypothesis:** If remote managers truly spend 5+ hours/week on status, then when asked to track their time for one week, at least 70% will record 5+ hours
- **Method:** Recruit 20 remote managers, ask them to log time spent on "status checking/reporting" for one week
- **Success Criteria:** 14+ out of 20 (70%) log 5+ hours
- **Timeline:** Week 1-2
- **Decision:** If validated → proceed to experiment 2. If invalidated → re-examine problem priority

**Experiment 2: Willingness to Pay**
- **Hypothesis:** If managers value time savings, then at least 30% who see a "Save 3 hours/week for $20/person/month" landing page will give us their email
- **Method:** Create landing page, run $500 Google Ads campaign targeting "remote team management"
- **Success Criteria:** 30%+ conversion rate (email signup)
- **Timeline:** Week 3-4
- **Decision:** If validated → build prototype. If invalidated → re-examine pricing or value prop

**Experiment 3: Team Engagement**
- **Hypothesis:** If status updates take <5 minutes and are async, then at least 80% of team members will update weekly
- **Method:** Create Google Form "status template," ask 3 pilot teams to use for 4 weeks
- **Success Criteria:** 80%+ weekly participation rate
- **Timeline:** Week 5-8
- **Decision:** If validated → begin MVP development. If invalidated → explore automated status (no manual input required)

---

## Your Turn

Please provide:
1. Your 3 riskiest assumptions
2. Your 3 validation experiments (using format above)
3. Your decision criteria for each outcome

## Final Step

When you've provided this information, I'll:
1. Generate your complete lean persona artifact
2. Save it to `{output_folder}/lean-persona-{persona-name}-{date}.md`
3. Create a validation tracking checklist
4. Suggest next steps with Wade (lean-experiment workflow) to run your experiments

**Remember:** This lean persona is a HYPOTHESIS until validated. Treat it as a bet, not a truth. Your job now is to test that bet as quickly and cheaply as possible.

---

## Workflow Complete

After synthesis, your lean persona artifact will include:
- Complete job-to-be-done analysis
- Current solution pain points
- Problem contexts and triggers
- Forces and anxieties
- Success criteria and metrics
- Riskiest assumptions highlighted
- Validation experiments ready to run
- Revision history to track what you learn

## Vortex Compass

Based on what you just completed, here are your evidence-driven options:

| If you learned... | Consider next... | Agent | Why |
|---|---|---|---|
| Riskiest assumptions identified | lean-experiment | Wade 🧪 | Test your riskiest assumption with real users |
| User needs unclear | user-interview | Isla 🔍 | Validate persona assumptions with actual users |
| Multiple user segments | empathy-map | Isla 🔍 | Build deeper understanding of each segment |

> **Note:** These are evidence-based recommendations. You can navigate to any Vortex agent
> at any time based on your judgment.

**Or run Max's [VN] Vortex Navigation** for a full gap analysis across all streams.
