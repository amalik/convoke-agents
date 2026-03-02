---
step: 6
workflow: proof-of-value
title: Document Findings & Route
---

# Step 6: Document Findings & Route

Time to package everything into a durable artifact. The experiment is done, the analysis is complete, and the market has spoken. Now we produce the HC4 Experiment Context artifact so the evidence travels forward — and route to the next step in the Vortex.

## Why This Matters

Evidence that lives in your head or a chat thread is evidence that gets lost. The HC4 artifact captures what you tested, what you learned, and what the market told you in a format that any downstream agent or stakeholder can consume. Without this artifact, the next team member or Vortex agent starts from zero. With it, they start from validated evidence. Packaging the proof-of-value results as an HC4 also forces a final discipline check: can you document the findings without distorting them?

## Your Task

### 1. Review Your Findings

Before packaging, do a final integrity check:

| Check | Status |
|-------|--------|
| Raw results match the execution log from Step 4 | [ ] Verified |
| Verdicts match pre-committed thresholds from Steps 2 and 3 — not post-hoc adjusted thresholds | [ ] Verified |
| Willingness-to-pay analysis is based on behavioral signals, not stated preferences | [ ] Verified |
| Qualitative evidence includes both confirming AND disconfirming signals | [ ] Verified |
| Business case assessment is grounded in data, not optimism | [ ] Verified |

### 2. Generate the HC4 Artifact

I will produce the HC4 Experiment Context artifact with this structure:

```yaml
---
contract: HC4
type: artifact
source_agent: wade
source_workflow: proof-of-value
target_agents: [noah]
input_artifacts:
  - path: "_bmad-output/vortex-artifacts/{your-upstream-artifact}"
    contract: HC3
created: YYYY-MM-DD
---
```

**HC4 Required Body Sections:**

1. **Experiment Summary** — Name, description, type (`Proof of Value`), duration, graduation status
2. **Hypothesis Tested** — Value hypothesis statement, riskiest assumption, expected outcome, expected behavior change
3. **Experiment Method** — Validation method used, sample size, duration, recruitment, controls
4. **Pre-Defined Success Criteria** — Metric, target threshold, actual result, met/not met (from Steps 2-3)
5. **Additional Results** — Supplementary quantitative metrics, qualitative findings, unexpected discoveries
6. **Confirmed/Rejected Hypotheses** — Hypothesis status, assumption status, core learning sentence, conditions
7. **Strategic Context** — Vortex stream, assumption tested, decision it informs, implications
8. **Production Readiness** *(if graduating)* — Metrics to monitor, expected behavior, signal thresholds

**Save to:** `{output_folder}/vortex-artifacts/hc4-experiment-context-{date}.md`

I will create this file with all sections populated from your work in Steps 1-5 once you confirm the content is ready.

### 3. Determine the Graduation Status

Based on your analysis, select the appropriate status:

| Status | Criteria | Meaning |
|--------|----------|---------|
| **Graduated** | Value hypothesis confirmed, WTP validated, unit economics work | This value proposition is ready for production investment (MVP or scaling) |
| **Completed** | Experiment ran fully, results captured, but not graduating | Valuable learning captured; value proposition needs refinement, pivot, or further testing |
| **Terminated** | Experiment stopped early due to abort criteria | The market signal was clear enough to stop — typically a strong rejection |

### 4. Write the Core Learning Statement

Summarize the entire proof-of-value in one sentence:

> "We [validated / invalidated / partially validated] that [target segment] will [pay $X / change behavior Y] for [value proposition], discovering that [key insight about market demand, pricing, or competitive position]."

This sentence is the most important output of the entire workflow. It should be precise enough that someone who reads only this sentence understands the market verdict.

### 5. Final Validation Questions

Before we finalize the HC4 artifact:

**Evidence Integrity:**
- [ ] Would you be comfortable presenting these findings to a skeptical investor?
- [ ] If someone re-ran this exact experiment, would they likely reach the same conclusion?
- [ ] Have you documented disconfirming evidence as prominently as confirming evidence?

**Completeness:**
- [ ] Are all pre-defined success criteria evaluated with actual results?
- [ ] Is the willingness-to-pay analysis specific enough to inform pricing decisions?
- [ ] Are qualitative findings included with verbatim quotes where available?

**Routing Readiness:**
- [ ] Is the graduation status justified by the data, not by organizational pressure?
- [ ] Is the core learning statement honest and falsifiable?
- [ ] Does the strategic context section make clear what decision this evidence enables?

---

## Your Turn

Review your findings, confirm readiness for the HC4 artifact, determine graduation status, and write the core learning statement. When you are ready, I will generate the final HC4 artifact.

---

## Vortex Compass

Based on what you just completed, here are your evidence-driven options:

| If you learned... | Consider next... | Agent | Why |
|---|---|---|---|
| Value hypothesis confirmed, WTP validated, business case is strong | mvp | Wade | Business value is proven — design and build the minimum viable product (HC4 feeds MVP workflow) |
| Value confirmed but need production signal monitoring set up | production-monitoring | Noah | Set up monitoring for production metrics identified in HC4 Section 8 |
| Value confirmed — capture the learning for stakeholder communication | learning-card | Max | Package the proof-of-value evidence as a learning card for decision-makers |
| Value partially confirmed — pricing needs refinement | proof-of-value | Wade | Re-run Steps 3-5 with adjusted pricing hypothesis |
| Value unclear — need deeper understanding of customer segment | user-interview | Isla | Uncover why willingness-to-pay was weaker than expected (HC9 routing) |
| Value rejected — need to understand whether to pivot, patch, or kill | pivot-patch-persevere | Max | Make a structured decision about the value proposition's future |
| Value rejected — problem definition may be wrong | research-convergence | Mila | Re-examine the underlying problem; the pain may not be what you thought |
| Technical assumptions changed during value testing | proof-of-concept | Wade | New technical risks surfaced that need feasibility validation |

> **Note:** These are evidence-based recommendations. You can navigate to any Vortex agent
> at any time based on your judgment.

**Or run Max's [VN] Vortex Navigation** for a full gap analysis across all streams.

### Insufficient Evidence for Routing

If the evidence gathered so far does not clearly point to a single next step:

| To route to... | You need... |
|----------------|-------------|
| Wade (MVP) | Confirmed value hypothesis, validated WTP, positive unit economics signal |
| Wade (re-run PoV) | Partially confirmed value with specific pricing or segment hypothesis to retest |
| Noah | Graduated experiment with production readiness section completed in HC4 |
| Isla | Specific question about customer behavior or segment that quantitative data could not answer |
| Max (learning-card) | Completed HC4 artifact with clear core learning statement |
| Max (pivot-patch-persevere) | Rejected or partially confirmed hypothesis with enough evidence to inform the pivot decision |
| Mila | Evidence that the underlying problem definition is flawed, not just the value proposition |

**Workflow-specific signals:**
- WTP data is ambiguous across all price points tested → consider re-running **Step 3** with a different pricing model or method
- Conversion varied dramatically across segments → consider routing to **Isla** for deeper segment research before committing to a segment
- Qualitative objections point to a different value proposition entirely → consider routing back to **Step 1** to redefine the value hypothesis
- Results were inconclusive due to insufficient sample → consider re-running **Step 4** with stronger recruitment

**Recommended:** If the path forward is unclear, run **Max's [VN] Vortex Navigation** for a full gap analysis across all streams.
