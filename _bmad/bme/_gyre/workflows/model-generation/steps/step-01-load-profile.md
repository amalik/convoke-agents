---
step: 1
workflow: model-generation
title: Load Stack Profile
---

# Step 1: Load Stack Profile

Load the GC1 Stack Profile and check for existing amendments from previous reviews.

## MANDATORY EXECUTION RULES

- Use Claude Code Read tool to load `.gyre/stack-profile.yaml`
- If file doesn't exist, do NOT proceed — inform user to run stack-detection first
- Check for existing GC4 amendments to respect on regeneration

## EXECUTION SEQUENCE

### 1. Load GC1 (Stack Profile)

**Read** `.gyre/stack-profile.yaml`:

- Parse the YAML content
- Extract: primary_language, primary_framework, container_orchestration, ci_cd_platform, observability_tooling, cloud_provider, communication_protocol
- Extract guard_answers if present
- Note detection_confidence level

**If file not found:**
```
I need a Stack Profile (GC1) before I can generate a capabilities model.

Please run Scout's stack detection first:
- Activate Scout: /bmad-agent-bme-stack-detective
- Select [DS] Detect Stack

Or run the full analysis pipeline which includes detection:
- Select [FA] Full Analysis
```
Then STOP — do not proceed.

### 2. Check for Existing Amendments (GC4)

**Read** `.gyre/capabilities.yaml` (if it exists):

- If the file exists, this is a **regeneration** — previous model exists
- Look for capabilities with `amended: true` — these are user-modified
- Look for capabilities with `removed: true` — these were explicitly removed
- Store amendments list for step 2 (generate will respect them)

**If capabilities.yaml doesn't exist:** This is a first-time generation — no amendments to respect.

### 3. Present Profile Summary

```
## Stack Profile Loaded

**Stack:** [primary_language] / [primary_framework]
**Deployment:** [container_orchestration] on [cloud_provider]
**CI/CD:** [ci_cd_platform]
**Observability:** [observability_tooling list]
**Communication:** [communication_protocol]
**Confidence:** [detection_confidence]

[If regeneration]: **Previous model found** — [N] capabilities, [M] amendments will be preserved.
[If first-time]: **First generation** — no previous model.

Generating capabilities for your stack...
```

---

## NEXT STEP

Load step: {project-root}/_bmad/bme/_gyre/workflows/model-generation/steps/step-02-generate-capabilities.md
