---
initiative: convoke
artifact_type: validation-evidence
story: v63-4-1-create-pf1-judge-prompt-and-calibration-test
calibration_passed: true
identical_median: 5
different_median: 2
judge_model: claude-sonnet-4-6
created: 2026-04-26
api_retries_observed: 0
---

# PF1 Judge Calibration Evidence — Story 4.1

**Calibration:** PASS

**Judge model:** `claude-sonnet-4-6`
**Runs per pair:** 3 (median)
**Threshold contract:** identical-pair median ≥ 4 AND different-pair median ≤ 2
**API retries observed (SDK-reported):** 0

## identical-pair results

| Run | Score |
|-----|-------|
| 1 | 5 |
| 2 | 5 |
| 3 | 5 |
| **Median** | **5** |

**Score scale gloss:** 5=identical · 4=equivalent w/ minor phrasing · 3=mostly equivalent · 2=noticeably different · 1=fundamentally different

### identical-pair run 1 — verbatim judge response

> SCORE: 5
> STRUCTURAL_MATCH: YES
> PERSONA_CONSISTENT: YES
> CAPABILITIES_COMPLETE: YES
> REASONING: Both outputs are character-for-character identical. They share the same HTML comment header, the same greeting, the same philosophical framing, the same table structure with identical entries, and the same closing prompt. There are no differences whatsoever between the two outputs.

### identical-pair run 2 — verbatim judge response

> SCORE: 5
> STRUCTURAL_MATCH: YES
> PERSONA_CONSISTENT: YES
> CAPABILITIES_COMPLETE: YES
> REASONING: Both outputs are character-for-character identical. The same greeting, persona (Carson the brainstorming facilitator), philosophical framing, skill reminder, capability table, and closing question appear in exactly the same order and wording in both outputs. There are no differences whatsoever.

### identical-pair run 3 — verbatim judge response

> SCORE: 5
> STRUCTURAL_MATCH: YES
> PERSONA_CONSISTENT: YES
> CAPABILITIES_COMPLETE: YES
> REASONING: Both outputs are character-for-character identical. They share the same HTML comment header, the same greeting, the same philosophical framing, the same YES-AND invitation, the same bmad-help reminder, the same capability table with identical Code/Description/Skill entries, and the same closing prompt. There are no differences whatsoever between the two outputs.

## different-pair results

| Run | Score |
|-----|-------|
| 1 | 2 |
| 2 | 2 |
| 3 | 2 |
| **Median** | **2** |

**Score scale gloss:** 5=identical · 4=equivalent w/ minor phrasing · 3=mostly equivalent · 2=noticeably different · 1=fundamentally different

### different-pair run 1 — verbatim judge response

> SCORE: 2
> STRUCTURAL_MATCH: YES
> PERSONA_CONSISTENT: NO
> CAPABILITIES_COMPLETE: NO
> REASONING: Both outputs share the same broad structure — an HTML comment header, a greeting with agent name, a brief philosophical/professional preamble, a bmad-help reminder, a capability table, and a closing prompt. However, the two outputs represent entirely different agents with different personas, names, and roles. Output A is "Carson," an energetic brainstorming facilitator with an improvisational, playful voic
> 
> …[truncated to first 500 chars; full response logged to stderr]

### different-pair run 2 — verbatim judge response

> SCORE: 2
> STRUCTURAL_MATCH: YES
> PERSONA_CONSISTENT: NO
> CAPABILITIES_COMPLETE: NO
> REASONING: Both outputs share the same broad structural template: a named greeting, a brief personal philosophy/framing paragraph, a `bmad-help` reminder, a capability table with Code/Description/Skill columns, and a closing prompt inviting the user to engage. The HTML comment headers even follow the same format. However, the two outputs represent entirely different agents with incompatible personas: Output A is "Car
> 
> …[truncated to first 500 chars; full response logged to stderr]

### different-pair run 3 — verbatim judge response

> SCORE: 2
> STRUCTURAL_MATCH: YES
> PERSONA_CONSISTENT: NO
> CAPABILITIES_COMPLETE: NO
> REASONING: Both outputs share the same broad structure — an HTML comment source tag, a greeting with name and self-identification, a brief personal philosophy/framing paragraph, a note about `bmad-help`, a capability table with Code/Description/Skill columns, and a closing prompt. The structural skeleton is clearly the same template. However, the personas are fundamentally different agents: Output A is "Carson," an e
> 
> …[truncated to first 500 chars; full response logged to stderr]

