---
workflow: stack-detection
type: step-file
description: Detect and classify project technology stack through filesystem analysis
author: Scout (stack-detective)
version: 1.0.0
---

# Stack Detection Workflow

This workflow guides Scout through scanning a project's filesystem to detect and classify its technology stack. The output is a Stack Profile that downstream agents use for contextual model generation.

## What is Stack Detection?

Stack detection identifies the technologies, frameworks, infrastructure, and tooling used in a project by examining its filesystem artifacts — package manifests, config files, IaC templates, CI pipelines, and dependency declarations. No code is executed; all detection is static.

## Workflow Structure

**Step-file architecture:**
- Just-in-time loading (each step loads only when needed)
- Sequential enforcement (must complete step N before step N+1)
- State tracking in frontmatter (progress preserved)

## Steps Overview

1. **Scan Filesystem** — Use Glob, Grep, and Read to discover technology indicators
2. **Classify Stack** — Organize findings into a structured classification with confidence levels
3. **Guard Questions** — Ask ≤3 targeted questions to resolve ambiguities (skip if unambiguous)

## Output

**Artifact:** Stack Profile at `.gyre/stack-profile.yaml` (GC1 contract)

**Privacy boundary:** Stack Profile contains technology categories only — NOT file contents, file paths, version numbers, dependency counts, dependency names, or secrets.

---

## INITIALIZATION

Load config from {project-root}/_bmad/bme/_gyre/config.yaml

Load step: {project-root}/_bmad/bme/_gyre/workflows/stack-detection/steps/step-01-scan-filesystem.md
