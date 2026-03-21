---
step: 5
workflow: model-review
title: Review Summary & Compass
implements: Story 4.7
---

# Step 5: Review Summary & Compass

Present a summary of the review session and route the user to their next action.

## EXECUTION

### 1. Session Summary

```
## Review Complete

| Action | Count |
|--------|:-----:|
| Capabilities kept | [N] |
| Capabilities removed | [N] |
| Capabilities edited | [N] |
| Capabilities added | [N] |
| Feedback entries | [N] |

Artifacts updated:
- `.gyre/capabilities.yaml` — [updated if amendments / unchanged if no amendments]
- `.gyre/feedback.yaml` — [updated if feedback / unchanged if no feedback]
```

### 2. Re-Analysis Recommendation

If capabilities were removed or added:
```
💡 Since you changed your capabilities model, consider re-running gap analysis to get updated findings based on your customized model.
```

### 3. Gyre Compass

```
---

## What's Next?

| If you want to... | Consider next... | Agent | Why |
|---|---|---|---|
| Re-run analysis with your customized model | gap-analysis | Lens 🔬 | Updated findings based on your amendments |
| Detect or re-detect your stack | stack-detection | Scout 🔎 | New project or stack has changed |
| Generate a fresh model from scratch | model-generation | Atlas 📐 | Discard amendments and start over |
| See what changed since last run | delta-report | Lens 🔬 | Track progress over time |
| Run the full pipeline | full-analysis | Scout 🔎 | Complete end-to-end analysis |
| Share findings with your team | — | — | Commit .gyre/ directory to your repository |

> **Note:** These are recommendations. You can run any Gyre workflow at any time.
```

---

Written to `.gyre/capabilities.yaml` and `.gyre/feedback.yaml`
