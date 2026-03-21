---
name: full-analysis
agent: stack-detective
title: Full Gyre Analysis
description: Orchestrates the complete analysis pipeline — detect stack, generate model, analyze gaps, review findings
steps: 5
---

# Full Analysis Workflow

Runs the complete Gyre pipeline end-to-end: **Detect → Model → Analyze → Review**.

## Pipeline

| Step | File | Agent | Action |
|------|------|-------|--------|
| 1 | step-01-initialize.md | Scout 🔎 | Check for `.gyre/`, detect mode (crisis/anticipation/regeneration), create `.gyre/` if needed |
| 2 | step-02-detect-stack.md | Scout 🔎 | Run stack detection, ask guard questions, write GC1 |
| 3 | step-03-generate-model.md | Atlas 📐 | Load GC1, generate capabilities, write GC2 (skip if cached in anticipation mode) |
| 4 | step-04-analyze-gaps.md | Lens 🔬 | Load GC2, run absence detection + cross-domain correlation, write GC3 |
| 5 | step-05-review-findings.md | Coach 🏋️ | Load GC3, present findings, guide review, capture feedback, write GC4 |

## Mode Detection

- `.gyre/` does **not** exist → **crisis mode** (first run — full pipeline)
- `.gyre/capabilities.yaml` exists → **anticipation mode** (re-run — skip model generation, use cached)
- User says "regenerate" → **regeneration mode** (fresh model generation even with existing cache)

## Privacy Boundary

The GC1 contract enforces a privacy boundary: only technology categories flow between agents — never file contents, paths, version numbers, or secrets.

## Instructions

Load the first step to begin:

```
Load step: {project-root}/_bmad/bme/_gyre/workflows/full-analysis/steps/step-01-initialize.md
```
