---
step: 3
workflow: model-generation
title: Web Enrichment
---

# Step 3: Web Enrichment

Use web search to enrich capabilities with current best practices and validate relevance.

## MANDATORY EXECUTION RULES

- Web search is OPTIONAL — if WebSearch tool is unavailable, skip this step gracefully
- Search for current-year best practices for the detected stack (FR11, NFR21)
- When conflicting advice is found, select the most authoritative source and note the conflict
- Mark web-enriched capabilities with source indication
- Do NOT replace user-amended capabilities with web search results

## WEB SEARCH STRATEGY

### Search Queries

Construct targeted queries based on the Stack Profile:

1. **Stack-specific production readiness:**
   `"[framework] production readiness checklist [current year]"`

2. **Observability best practices:**
   `"[framework] [observability tool] best practices [current year]"`

3. **Deployment patterns:**
   `"[container orchestration] deployment best practices [cloud provider]"`

4. **Reliability patterns:**
   `"[framework] reliability patterns production"`

### Search Execution

For each query:
1. Execute WebSearch
2. Scan results for capabilities not already in the generated list
3. For existing capabilities, check if web results suggest better descriptions or updated practices
4. For new capabilities found, add them with `source: "practice"` and note web origin

### Conflict Resolution

When web sources disagree:
- Prefer official documentation (e.g., Kubernetes docs, cloud provider docs) over blog posts
- Prefer recent sources (current year) over older ones
- When genuinely split, note both perspectives in the capability description
- Never silently pick one side — transparency builds trust

## IF WEB SEARCH UNAVAILABLE

```
Web search is not available in this session. Proceeding with capabilities
generated from industry standards and stack analysis.

Note: You can re-run model generation later with web search enabled for
enriched results. The model is valid without web enrichment.
```

Set `web_search_performed: false` in provenance metadata and continue to step 4.

## OUTPUT

Update the capabilities list with web enrichment results.

Present a brief summary:

```
[If web search performed]:
Web enrichment complete:
- Searched [N] queries for current [year] practices
- Updated [M] capability descriptions with current guidance
- Added [K] new capabilities from web research
- Sources: [list key sources referenced]

[If no web search]:
Skipped web enrichment — capabilities based on standards and stack analysis.

Writing capabilities manifest...
```

---

## NEXT STEP

Load step: {project-root}/_bmad/bme/_gyre/workflows/model-generation/steps/step-04-write-manifest.md
