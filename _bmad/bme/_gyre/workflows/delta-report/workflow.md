---
name: delta-report
agent: readiness-analyst
title: Delta Report
description: Compare current findings against previous run — track progress over time
steps: 3
implements: Epic 4 (Story 4.6)
---

# Delta Report Workflow

Compares current `.gyre/findings.yaml` against `.gyre/history.yaml` to show what changed: new findings, carried-forward findings, and resolved gaps.

## Prerequisites

- GC3 (Findings Report) at `.gyre/findings.yaml` — current analysis results
- `.gyre/history.yaml` — previous findings (saved automatically after each delta report)

## Pipeline

| Step | File | Action |
|------|------|--------|
| 1 | step-01-load-history.md | Load current and previous findings |
| 2 | step-02-compute-delta.md | Compute: new findings, carried-forward, resolved |
| 3 | step-03-present-delta.md | Present delta with [NEW], [CARRIED], resolved list |

## First Run Behavior

If no `.gyre/history.yaml` exists, this is the first delta-capable run. All current findings are tagged [NEW], and the current findings are saved as history for future comparison.

## Error Recovery

- If `.gyre/findings.yaml` missing: inform user to run gap-analysis first
- If `.gyre/history.yaml` missing: treat as first run — all findings are [NEW]
