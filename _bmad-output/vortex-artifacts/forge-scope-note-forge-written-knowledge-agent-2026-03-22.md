---
title: "Scope Exploration Note: Written Knowledge Analysis Agent (Forge)"
date: 2026-03-22
created-by: Amalik with Emma (contextualization-expert)
type: scope-exploration-note
status: EXPLORATION
parent: decision-scope-forge-2026-03-21.md
version: 1.0
---

# Scope Exploration Note: Written Knowledge Analysis Agent (Forge)

## Concept Summary

A potential third agent for Forge Phase A that **ingests, structures, and cross-references existing code and documentation** in brownfield environments — producing a knowledge gap map that guides Rune's tribal knowledge extraction.

**Working name:** TBD (candidate names: Scribe, Codex, Atlas)
**Role:** Written Knowledge Analyst
**Relationship:** Sits between Silo (surveys landscape) and Rune (extracts tribal knowledge)

---

## Origin

Observed during analysis of [bmad-federated-knowledge](https://github.com/vishalmysore/bmad-federated-knowledge) — a multi-source knowledge aggregation tool from Vishal Mysore's BMAD-METHOD ecosystem. While that tool solves a different problem (AI coding context), it raised the question: **who in Forge deeply analyzes what's already written down?**

Silo surveys documentation sources and assesses staleness. Rune extracts what's in people's heads. But neither agent systematically reads, structures, and cross-references existing artifacts to identify where documented knowledge is contradictory, incomplete, or absent.

---

## Problem Hypothesis

**In brownfield engagements, consultants spend significant time in Week 1 manually reading and cross-referencing existing code and documentation. This work is distinct from landscape surveying (Silo) and tribal knowledge extraction (Rune), and would benefit from structured agent support.**

### What This Agent Would Do

| Activity | Output |
|----------|--------|
| Deep code analysis — architecture patterns, dependency graphs, implicit decisions, dead code signals | Codebase Knowledge Map |
| Documentation ingestion — wikis, ADRs, READMEs, API specs, runbooks, onboarding guides | Documentation Index with staleness/coverage ratings |
| Cross-referencing — where docs contradict code, where code is undocumented, where docs describe things that no longer exist | **Knowledge Gap Map** |
| Source federation — pull from heterogeneous doc sources (Confluence, SharePoint, repo docs, wikis) | Unified knowledge inventory |

### Key Output: Knowledge Gap Map

The primary artifact — a structured map showing:
- **Documented & current** — knowledge exists and matches reality (low priority for Rune)
- **Documented & stale** — knowledge exists but contradicts code or is outdated (medium priority — Rune confirms what's changed)
- **Undocumented** — code areas with no documentation, implicit decisions, tribal-only knowledge (high priority — Rune's primary targets)
- **Contradictory** — multiple sources disagree (high priority — Rune resolves with knowledge holders)

This directly feeds Rune's excavation queue, making Week 2-4 extraction dramatically more targeted.

---

## Open Questions

### 1. Separate Agent or Silo Expansion?

**For separate agent:**
- Deep code/doc analysis is a fundamentally different cognitive mode than landscape surveying
- Different skill profile: Silo needs stakeholder mapping skills, this agent needs technical analysis skills
- Keeps Silo lean and fast (Week 1 day 1-2) while this agent can run longer (Week 1 day 2-5)

**For Silo expansion:**
- Simpler architecture (2 agents, not 3)
- Avoids another handoff contract
- Documentation Audit workflow already exists in Silo — could be deepened

**Decision:** Defer to shadow engagement observation.

### 2. Scope of Code Analysis

How deep should code analysis go? Options:
- **Light:** File/folder structure, dependency graph, README scanning
- **Medium:** + Architecture pattern detection, dead code signals, naming convention extraction
- **Deep:** + Business logic inference, implicit decision archaeology, cross-service dependency mapping

**Decision:** Defer — observe what consultants actually need vs. what's gold-plating.

### 3. Impact on Phase A Scope

Adding a third agent to Phase A (currently Silo + Rune, 5 epics, ~5 sprints) would:
- Add ~1-2 sprints for agent + workflows
- Add 1 handoff contract (Silo → New Agent → Rune pipeline)
- But potentially compress Rune's work by giving it better targeting

**Decision:** Do not expand Phase A scope yet. Validate need first.

---

## Shadow Engagement Validation

### Hypothesis to Test

> "Consultants performing brownfield knowledge extraction naturally separate three distinct activities: (1) surveying what knowledge sources exist, (2) deeply analyzing existing code and documentation, and (3) extracting unwritten tribal knowledge from people. Activity (2) is currently unstructured and would benefit from dedicated agent support."

### Observation Prompts for Shadow Engagement

During the 6-week shadow engagement (HC4 experiment), observe:

1. **Time tracking:** How many hours does the consultant spend reading/analyzing existing code and docs vs. surveying vs. interviewing?
2. **Sequencing:** Does the consultant naturally do code/doc analysis as a distinct phase, or interleave it with surveying and interviews?
3. **Artifacts:** Does the consultant produce anything resembling a "knowledge gap map" organically? In what form?
4. **Pain signal:** Does the consultant express frustration about the volume or quality of existing documentation? At what point in the engagement?
5. **Cross-referencing:** Does the consultant actively compare what docs say vs. what code does? How much time does this take?

### Success Criteria

Consider a dedicated agent validated if:
- Consultant spends >15% of Week 1 time on deep doc/code analysis (distinct from surveying)
- Consultant organically produces or wishes for a gap map artifact
- Consultant reports that untargeted Rune interviews wasted time that better doc analysis would have saved

---

## Relationship to bmad-federated-knowledge

The external repo that sparked this exploration solves **source aggregation** (pulling docs from multiple systems into local cache). This is a potential implementation pattern for the "source federation" capability listed above, but:

- It's part of a different ecosystem (Vishal Mysore's BMAD-METHOD)
- Its output (`context.md`) serves AI coding assistants, not human consultants
- The real value of this Forge agent is in **cross-referencing and gap analysis**, not aggregation

**Recommendation:** Study the multi-source sync pattern if building federation capabilities. Do not adopt as a dependency.

---

## Next Steps

| # | Action | When | Who |
|---|--------|------|-----|
| 1 | Add observation prompts to shadow engagement protocol | Before shadow engagement begins | Amalik |
| 2 | Track time-split data during shadow engagement | During 6-week experiment | Shadow consultant |
| 3 | Review findings and decide: separate agent, Silo expansion, or drop | After shadow engagement | Amalik with Emma |

**This note does not change Forge Phase A scope.** It captures an exploration to be validated through observation, not assumption.

---

**Created with:** Convoke v2.3.1 - Vortex Pattern (Contextualize Stream)
**Agent:** Emma (Contextualization Expert)
**Type:** Scope Exploration Note (pre-validation)
