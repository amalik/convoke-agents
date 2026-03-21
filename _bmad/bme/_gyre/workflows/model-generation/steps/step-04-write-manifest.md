---
step: 4
workflow: model-generation
title: Write Manifest
---

# Step 4: Write Capabilities Manifest

Write the complete capabilities manifest to `.gyre/capabilities.yaml` (GC2 contract).

## MANDATORY EXECUTION RULES

- Write to `.gyre/capabilities.yaml` using the GC2 schema
- Include GC2 contract frontmatter
- If <20 capabilities, set limited_coverage=true and warn the user (FR15)
- If limited_coverage, offer: continue (with emphasis on review-and-amend) or abort (FR52)
- Present model summary after writing (FR31)
- The manifest IS the cache — subsequent runs load it, no regeneration unless explicit (NFR10)

## GC2 ARTIFACT STRUCTURE

Write the following YAML to `.gyre/capabilities.yaml`:

```yaml
---
contract: GC2
type: artifact
source_agent: atlas
source_workflow: model-generation
target_agents: [lens, coach]
input_artifacts: [GC1]
created: [today's date]
---

gyre_manifest:
  version: "1.0"
  generated_at: "[ISO-8601 timestamp]"
  stack_summary: "[one-line stack description from GC1]"
  capability_count: [N]
  limited_coverage: [true/false]
  capabilities:
    - id: "[capability-id]"
      category: "[domain]"
      name: "[human-readable name]"
      description: "[1-3 sentences]"
      source: "[standard|practice|reasoning]"
      relevance: "[why it matters for THIS stack]"
      amended: false
      removed: false
    # ... all capabilities
  provenance:
    standards_referenced: ["DORA", "OpenTelemetry", "Google PRR"]
    web_search_performed: [true/false]
    web_search_date: "[ISO-8601 or null]"
```

## WRITING PROCESS

1. Construct the complete YAML document
2. Write to `.gyre/capabilities.yaml` (overwrite if regenerating)
3. Verify the file was written successfully by reading it back

## LIMITED COVERAGE HANDLING (FR15, FR52)

If capability_count < 20:

```
⚠️ **Limited Coverage Warning**

Atlas generated [N] capabilities for your stack (threshold: 20).

This may happen when:
- The stack archetype is unusual or emerging
- Key detection signals were missing
- The combination of technologies has limited standard guidance

**Options:**
a) **Continue** — proceed to gap analysis with the current model. You can add
   capabilities during Coach's review step.
b) **Abort** — stop here and investigate. Consider:
   - Re-running stack detection with more context
   - Providing guard question answers that clarify the architecture

Which would you like to do?
```

## MODEL SUMMARY (FR31)

After successful write, present:

```
## Model Generated ✓

**Generated [N] capabilities for your [language]/[framework] stack**

| Domain | Count | Key Capabilities |
|--------|:-----:|-----------------|
| Observability | [n] | [top 2-3 by name] |
| Deployment | [n] | [top 2-3 by name] |
| Reliability | [n] | [top 2-3 by name] |
| Security | [n] | [top 2-3 by name] |

**Sources:** [standards referenced]
**Web enriched:** [yes/no]
[If regeneration]: **Amendments preserved:** [M] from previous review

Written to `.gyre/capabilities.yaml`
```

---

## Gyre Compass

Based on what you just completed, here are your options:

| If you want to... | Consider next... | Agent | Why |
|---|---|---|---|
| Analyze your stack for gaps | gap-analysis | Lens 🔬 | Capabilities Manifest (GC2) is ready for analysis |
| Review and customize the model | model-review | Coach 🏋️ | Customize before analysis |
| Validate model accuracy | accuracy-validation | Atlas 📐 | Pre-pilot quality gate |

> **Note:** These are recommendations. You can run any Gyre workflow at any time.
