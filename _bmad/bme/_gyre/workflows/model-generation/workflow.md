---
name: model-generation
agent: model-curator
title: Capabilities Model Generation
description: Generate a contextual capabilities manifest from the Stack Profile using industry standards and web search
steps: 4
---

# Model Generation Workflow

Atlas generates a capabilities manifest unique to the detected stack. Each capability includes why it matters for THIS specific stack, not generic descriptions.

## Prerequisites

- GC1 (Stack Profile) must exist at `.gyre/stack-profile.yaml`
- If GC1 doesn't exist, direct the user to run `stack-detection` with Scout first

## Pipeline

| Step | File | Action |
|------|------|--------|
| 1 | step-01-load-profile.md | Load GC1, check for existing amendments (GC4) |
| 2 | step-02-generate-capabilities.md | Generate capabilities using standards + stack context |
| 3 | step-03-web-enrichment.md | Enrich with web search for current best practices |
| 4 | step-04-write-manifest.md | Write capabilities.yaml (GC2), surface limited-coverage warning if <20 |

## Model Ownership

The generated manifest is team-owned. On regeneration:
- Amendments from Coach (GC4) are respected — removed capabilities stay removed
- User-edited capabilities persist with `amended: true`
- New capabilities are added alongside existing amendments

## Instructions

Load the first step to begin:

```
Load step: {project-root}/_bmad/bme/_gyre/workflows/model-generation/steps/step-01-load-profile.md
```
