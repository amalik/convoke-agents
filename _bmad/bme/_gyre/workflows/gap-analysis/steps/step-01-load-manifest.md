---
step: 1
workflow: gap-analysis
title: Load Capabilities Manifest
---

# Step 1: Load Capabilities Manifest

Load the GC2 Capabilities Manifest and prepare for domain analysis.

## MANDATORY EXECUTION RULES

- Use Claude Code Read tool to load `.gyre/capabilities.yaml`
- If file doesn't exist, do NOT proceed — inform user to run model-generation first
- Filter out removed capabilities (removed: true) — they are excluded from analysis
- Group remaining capabilities by category for domain-specific analysis

## EXECUTION SEQUENCE

### 1. Load GC2 (Capabilities Manifest)

**Read** `.gyre/capabilities.yaml`:

- Parse the YAML content
- Verify it has GC2 contract frontmatter
- Extract: version, stack_summary, capability_count, limited_coverage, capabilities array

**If file not found:**
```
I need a Capabilities Manifest (GC2) before I can analyze gaps.

Please run Atlas's model generation first:
- Activate Atlas: /bmad-agent-bme-model-curator
- Select [GM] Generate Model

Or run the full analysis pipeline:
- Select [FA] Full Analysis
```
Then STOP — do not proceed.

### 2. Filter and Group Capabilities

- Remove capabilities with `removed: true` from the analysis set
- Group by category:
  - **Observability:** capabilities with category "observability"
  - **Deployment:** capabilities with category "deployment"
  - **Reliability:** capabilities with category "reliability" (analyzed with deployment domain)
  - **Security:** capabilities with category "security" (analyzed with deployment domain)

### 3. Present Analysis Plan

```
## Capabilities Manifest Loaded

**Stack:** [stack_summary]
**Total capabilities:** [capability_count] ([N] active, [M] removed by user)
**Limited coverage:** [yes/no]

**Analysis plan:**
- Observability domain: [N] capabilities to check
- Deployment domain: [N] capabilities to check (includes reliability + security)

Starting observability analysis...
```

---

## NEXT STEP

Load step: {project-root}/_bmad/bme/_gyre/workflows/gap-analysis/steps/step-02-observability-analysis.md
