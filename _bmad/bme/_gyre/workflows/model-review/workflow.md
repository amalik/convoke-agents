---
name: model-review
agent: review-coach
title: Model Review & Amendment
description: Walk through capabilities manifest and findings, capture amendments and feedback
steps: 5
implements: Epic 4 (Stories 4.2, 4.4, 4.5)
---

# Model Review & Amendment Workflow

Coach guides the user through their capabilities manifest and findings report. The user can keep, remove, edit, or add capabilities conversationally. Feedback on missed gaps is captured and persisted.

## Prerequisites

- GC2 (Capabilities Manifest) at `.gyre/capabilities.yaml` — required for model review
- GC3 (Findings Report) at `.gyre/findings.yaml` — required for findings review (optional if only reviewing model)

## Pipeline

| Step | File | Action |
|------|------|--------|
| 1 | step-01-load-context.md | Load artifacts, display existing feedback, detect deferred review |
| 2 | step-02-walkthrough.md | Walk through capabilities one by one — keep/remove/edit/add |
| 3 | step-03-apply-amendments.md | Write amendments to capabilities.yaml with flags |
| 4 | step-04-capture-feedback.md | Prompt for missed gaps, persist to feedback.yaml |
| 5 | step-05-summary.md | Present review summary and compass routing |

## Mode Selection

When activated, Coach asks which review the user wants:

1. **Review Model** — walk through capabilities manifest (steps 1-5)
2. **Review Findings** — present findings severity-first, then capture feedback (steps 1, 4, 5 with findings presentation)
3. **Both** — full review: findings first, then model walkthrough, then feedback

## Error Recovery

- If GC2 missing: inform user to run model-generation first, offer to launch Atlas
- If GC3 missing and user wants findings review: inform user to run gap-analysis first, offer to launch Lens
- If amendment write fails: present what was captured so far, offer to retry
