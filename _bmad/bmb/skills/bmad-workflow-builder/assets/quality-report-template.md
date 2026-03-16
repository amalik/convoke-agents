# Quality Report: {skill-name}

**Scanned:** {timestamp}
**Skill Path:** {skill-path}
**Report:** {report-file-path}
**Performed By** QualityReportBot-9001 and {user_name}

## Executive Summary

- **Total Issues:** {total-issues}
- **Critical:** {critical} | **High:** {high} | **Medium:** {medium} | **Low:** {low}
- **Overall Quality:** {Excellent|Good|Fair|Poor}
- **Overall Cohesion:** {cohesion-score}
- **Craft Assessment:** {craft-assessment}

<!-- Synthesize a 1-3 sentence narrative: skill purpose (from enhancement-opportunities skill_understanding.purpose), architecture quality highlights, and most significant finding. -->
{executive-narrative}

### Issues by Category

| Category | Critical | High | Medium | Low |
|----------|----------|------|--------|-----|
| Structural | {n} | {n} | {n} | {n} |
| Prompt Craft | {n} | {n} | {n} | {n} |
| Cohesion | {n} | {n} | {n} | {n} |
| Efficiency | {n} | {n} | {n} | {n} |
| Quality | {n} | {n} | {n} | {n} |
| Scripts | {n} | {n} | {n} | {n} |
| Creative | — | — | {n} | {n} |

---

## Strengths

*What this skill does well — preserve these during optimization:*

<!-- Collect from ALL of these sources:
  - All scanners: findings[] with severity="strength" or category="strength"
  - prompt-craft: findings where severity="note" and observation is positive
  - prompt-craft: positive aspects from assessments.skillmd_assessment.notes
  - enhancement-opportunities: bright_spots from each assessments.user_journeys[] entry
  Group by theme. Each strength should explain WHY it matters. -->

{strengths-list}

---

{if-truly-broken}
## Truly Broken or Missing

*Issues that prevent the workflow/skill from working correctly:*

<!-- Every CRITICAL and HIGH severity issue from ALL scanners. Maximum detail: description, affected files/lines, fix instructions. These are the most actionable part of the report. -->

{truly-broken-findings}

---
{/if-truly-broken}

## Detailed Findings by Category

### 1. Structural

<!-- Source: workflow-integrity-temp.json -->

{if-stage-summary}
**Stage Summary:** {total-stages} stages | Missing: {missing-stages} | Orphaned: {orphaned-stages}
{/if-stage-summary}

<!-- List findings by severity: Critical > High > Medium > Low. Omit empty severity levels. -->

{structural-findings}

### 2. Prompt Craft

<!-- Source: prompt-craft-temp.json -->

**Skill Assessment:**
- Overview quality: {overview-quality}
- Progressive disclosure: {progressive-disclosure}
- {skillmd-assessment-notes}

{if-prompt-health}
**Prompt Health:** {prompts-with-config-header}/{total-prompts} with config header | {prompts-with-progression}/{total-prompts} with progression conditions | {prompts-self-contained}/{total-prompts} self-contained
{/if-prompt-health}

{prompt-craft-findings}

### 3. Cohesion

<!-- Source: skill-cohesion-temp.json -->

{if-cohesion-analysis}
**Cohesion Analysis:**

<!-- Include only dimensions present in scanner output. -->

| Dimension | Score | Notes |
|-----------|-------|-------|
| Stage Flow Coherence | {score} | {notes} |
| Purpose Alignment | {score} | {notes} |
| Complexity Appropriateness | {score} | {notes} |
| Stage Completeness | {score} | {notes} |
| Redundancy Level | {score} | {notes} |
| Dependency Graph | {score} | {notes} |
| Output Location Alignment | {score} | {notes} |
| User Journey | {score} | {notes} |
{/if-cohesion-analysis}

{cohesion-findings}

{if-creative-suggestions}
**Creative Suggestions:**

<!-- From findings[] with severity="suggestion". Each: title, detail, action. -->

{creative-suggestions}
{/if-creative-suggestions}

### 4. Efficiency

<!-- Source: execution-efficiency-temp.json -->

{efficiency-issue-findings}

{if-efficiency-opportunities}
**Optimization Opportunities:**

<!-- From findings[] with severity ending in -opportunity. Each: title, detail (includes type/savings narrative), action. -->

{efficiency-opportunities}
{/if-efficiency-opportunities}

### 5. Quality

<!-- Source: path-standards-temp.json, scripts-temp.json -->

{quality-findings}

### 6. Scripts

<!-- Source: scripts-temp.json AND script-opportunities-temp.json. Merge and deduplicate across both. -->

{if-script-inventory}
**Script Inventory:** {total-scripts} scripts ({by-type-breakdown}) | Missing tests: {missing-tests-list}
{/if-script-inventory}

{script-issue-findings}

{if-script-opportunities}
**Script Opportunity Findings:**

<!-- From script-opportunities-temp.json findings[]. These identify LLM work that should be scripts.
     Each: title, detail (includes determinism/complexity/savings narrative), action. -->

{script-opportunities}

**Token Savings:** {total-estimated-token-savings} | Highest value: {highest-value-opportunity} | Prepass opportunities: {prepass-count}
{/if-script-opportunities}

### 7. Creative (Edge-Case & Experience Innovation)

<!-- Source: enhancement-opportunities-temp.json. These are advisory suggestions, not errors. -->

**Skill Understanding:**
- **Purpose:** {skill-purpose}
- **Primary User:** {primary-user}
- **Key Assumptions:**
{key-assumptions-list}

**Enhancement Findings:**

<!-- Organize by: high-opportunity > medium-opportunity > low-opportunity.
     Each: title, detail, action. -->

{enhancement-findings}

{if-top-insights}
**Top Insights:**

<!-- From enhancement-opportunities assessments.top_insights[]. These are the synthesized highest-value observations.
     Each: title, detail, action. -->

{top-insights}
{/if-top-insights}

---

{if-user-journeys}
## User Journeys

*How different user archetypes experience this skill:*

<!-- From enhancement-opportunities user_journeys[]. Reproduce EVERY archetype fully. -->

### {archetype-name}

{journey-summary}

**Friction Points:**
{friction-points-list}

**Bright Spots:**
{bright-spots-list}

<!-- Repeat for ALL archetypes. Do not skip any. -->

---
{/if-user-journeys}

{if-autonomous-assessment}
## Autonomous Readiness

<!-- From enhancement-opportunities autonomous_assessment. Include ALL fields. -->

- **Overall Potential:** {overall-potential}
- **HITL Interaction Points:** {hitl-count}
- **Auto-Resolvable:** {auto-resolvable-count}
- **Needs Input:** {needs-input-count}
- **Suggested Output Contract:** {output-contract}
- **Required Inputs:** {required-inputs-list}
- **Notes:** {assessment-notes}

---
{/if-autonomous-assessment}

## Quick Wins (High Impact, Low Effort)

<!-- Pull from ALL scanners: findings where fix effort is trivial/low but impact is meaningful. -->

| Issue | File | Effort | Impact |
|-------|------|--------|--------|
{quick-wins-rows}

---

## Optimization Opportunities

<!-- Synthesize across scanners — not a copy of findings but a narrative of improvement themes. -->

**Prompt Craft:**
{prompt-optimization-narrative}

**Performance:**
{performance-optimization-narrative}

**Maintainability:**
{maintainability-optimization-narrative}

---

## Recommendations

<!-- Rank by: severity first, then breadth of impact, then effort (prefer low-effort). Up to 5. -->

1. {recommendation-1}
2. {recommendation-2}
3. {recommendation-3}
4. {recommendation-4}
5. {recommendation-5}
