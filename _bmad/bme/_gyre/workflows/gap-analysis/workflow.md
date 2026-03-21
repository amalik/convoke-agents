---
name: gap-analysis
agent: readiness-analyst
title: Gap Analysis
description: Run absence detection across observability and deployment domains with cross-domain correlation
steps: 5
---

# Gap Analysis Workflow

Lens compares each capability in the manifest against actual filesystem evidence. Identifies what's missing — not just what's misconfigured.

## Prerequisites

- GC2 (Capabilities Manifest) must exist at `.gyre/capabilities.yaml`
- If GC2 doesn't exist, direct the user to run `model-generation` with Atlas first

## Pipeline

| Step | File | Action |
|------|------|--------|
| 1 | step-01-load-manifest.md | Load GC2 (capabilities.yaml) |
| 2 | step-02-observability-analysis.md | For each observability capability: search filesystem for evidence |
| 3 | step-03-deployment-analysis.md | For each deployment capability: search filesystem for evidence |
| 4 | step-04-cross-domain-correlation.md | Identify compound patterns across domains |
| 5 | step-05-present-findings.md | Present severity-first summary, write GC3 |

## Privacy Boundary

Findings reference capability IDs and evidence summaries — NOT file contents or secrets. Evidence is described categorically: "health check endpoint found" not the endpoint source code.

## Instructions

Load the first step to begin:

```
Load step: {project-root}/_bmad/bme/_gyre/workflows/gap-analysis/steps/step-01-load-manifest.md
```
