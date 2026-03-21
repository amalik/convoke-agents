---
step: 5
workflow: full-analysis
title: Review Findings
implements: Epic 4 (Stories 4.5, 4.7)
---

# Step 5: Review Findings

Coach presents findings and offers review options. This is the final step of the full-analysis pipeline.

## MANDATORY EXECUTION RULES

- GC3 (Findings Report) must have been written in step 4 — if missing, STOP
- Present a brief findings summary (severity counts from GC3)
- Prompt user to review capabilities manifest (FR43)
- Offer: "Walk through now" / "Later" (deferred flag) / "Skip" (FR55)
- If user chooses review: execute the model-review workflow inline
- End with full Gyre compass routing table (NFR18 — all 7 workflows independently runnable)

## EXECUTION

### 1. Verify GC3 Exists

Check that `.gyre/findings.yaml` was written by step 4. If missing:

```
❌ Findings report not found at .gyre/findings.yaml

Step 4 (gap analysis) may not have completed. Options:
a) Re-run gap analysis
b) Exit full-analysis and investigate
```

### 2. Display Findings Summary

Load GC3 and present a brief summary (not the full presentation — that was done in step 4):

```
## Analysis Complete

Your findings report has been written to `.gyre/findings.yaml`:

| Severity | Count |
|----------|:-----:|
| 🔴 Blockers | [N] |
| 🟡 Recommended | [N] |
| 🟢 Nice-to-have | [N] |
| **Total** | **[N]** |
```

### 3. Check for Existing Feedback (FR53)

If `.gyre/feedback.yaml` exists with entries:

```
💡 Your team has [N] previous feedback entries that can inform your review.
```

### 4. Review Prompt (FR43, FR55)

```
### Would you like to review your capabilities model?

Coach can walk you through your capabilities one by one — keep, remove, edit, or add.
This helps customize the model to your specific stack.

1. **Walk through now** — Review capabilities interactively
2. **Later** — Save a reminder for next run
3. **Skip** — Go straight to feedback and finish

What would you prefer?
```

### 5. Handle Response

**Walk through now:**
Execute the model-review workflow steps inline:
1. Load step: `{project-root}/_bmad/bme/_gyre/workflows/model-review/steps/step-02-walkthrough.md`
2. Load step: `{project-root}/_bmad/bme/_gyre/workflows/model-review/steps/step-03-apply-amendments.md`
3. Load step: `{project-root}/_bmad/bme/_gyre/workflows/model-review/steps/step-04-capture-feedback.md`

**Later:**
Set `review_deferred: true` in `.gyre/capabilities.yaml` frontmatter.
```
✓ Review deferred. Coach will remind you next time you run an analysis.
```
Then proceed to feedback capture:
Load step: `{project-root}/_bmad/bme/_gyre/workflows/model-review/steps/step-04-capture-feedback.md`

**Skip:**
Proceed directly to feedback capture:
Load step: `{project-root}/_bmad/bme/_gyre/workflows/model-review/steps/step-04-capture-feedback.md`

### 6. Full-Analysis Complete — Gyre Compass

After review/feedback is done, present the final compass:

```
---

## Full Analysis Complete 🎯

All 5 steps finished. Your Gyre artifacts:
- `.gyre/stack-profile.yaml` — Stack Profile (GC1)
- `.gyre/capabilities.yaml` — Capabilities Manifest (GC2)
- `.gyre/findings.yaml` — Findings Report (GC3)
- `.gyre/feedback.yaml` — Feedback Loop (GC4) [if feedback was captured]

💡 **Tip:** Commit the `.gyre/` directory to share these artifacts with your team.

---

## What's Next?

| If you want to... | Consider next... | Agent | Why |
|---|---|---|---|
| Detect or re-detect your stack | stack-detection | Scout 🔎 | New project or stack has changed |
| Generate or regenerate the model | model-generation | Atlas 📐 | First run or want fresh model |
| Review your capabilities manifest | model-review | Coach 🏋️ | Customize the model to your stack |
| Run gap analysis | gap-analysis | Lens 🔬 | Find what's missing |
| See what changed since last run | delta-report | Lens 🔬 | Track progress over time |
| Run the full pipeline again | full-analysis | Scout 🔎 | Complete end-to-end analysis |
| Validate model accuracy | accuracy-validation | Atlas 📐 | Pre-pilot quality gate |
| **Findings impact product discovery** | **Vortex agents** | **Emma 🎯 / Isla 🔍** | Production readiness gaps may inform discovery |

> **Note:** These are recommendations. You can run any Gyre workflow at any time.
```
