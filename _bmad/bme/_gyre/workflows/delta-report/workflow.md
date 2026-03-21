---
name: delta-report
agent: readiness-analyst
title: Delta Report
description: Compare current findings against previous run — track progress over time
steps: 3
status: stub
implements: Epic 4 (Story 4.6)
---

# Delta Report Workflow (Stub)

> **This workflow will be implemented in Epic 4 — Review, Feedback & Delta.**
>
> Compares current `.gyre/findings.yaml` against `.gyre/findings.previous.yaml` to show what changed: new findings, carried-forward findings, and resolved gaps.

## Pipeline (when implemented)

| Step | File | Action |
|------|------|--------|
| 1 | step-01-load-history.md | Load current and previous findings |
| 2 | step-02-compute-delta.md | Compute: new findings, carried-forward, resolved |
| 3 | step-03-present-delta.md | Present delta with [NEW], [CARRIED], resolved list |

## Stub Behavior

```
Delta Report is not yet implemented (Epic 4, Story 4.6).

To use delta reporting, you need:
1. A previous findings report (.gyre/findings.previous.yaml)
2. A current findings report (.gyre/findings.yaml)

Run gap-analysis first to generate your current findings,
then this workflow will compare future runs against it.
```
