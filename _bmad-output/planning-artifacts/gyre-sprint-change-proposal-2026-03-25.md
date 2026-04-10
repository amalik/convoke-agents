# Sprint Change Proposal — Party Mode Gyre Team Scoping

**Date:** 2026-03-25
**Author:** Amalik (facilitated by Winston)
**Status:** Approved
**Scope:** Minor

---

## Section 1: Issue Summary

When a user requests to talk to the Gyre team via Party Mode, the Vortex team agents are presented instead. The root cause is 7 duplicate Vortex agent entries (lines 2-8 of `agent-manifest.csv`) with empty `module` fields. These orphaned entries appear before the properly-attributed entries and cause Party Mode to latch onto Vortex agents regardless of the user's request.

**Discovery context:** Observed during Gyre development on the source repo. Party Mode works correctly on another install where the manifest is clean.

**Evidence:**
- User asked for "the Gyre team" → Party Mode displayed Emma, Isla, Mila, Liam, Wade, Noah, Max (all Vortex)
- Gyre agents (Scout, Atlas, Lens, Coach) present at lines 38-41 but not surfaced
- Lines 2-8: Vortex agents with empty `module` field (duplicates of lines 31-37)
- Lines 31-37: Same Vortex agents with correct `module="bme"` attribution

## Section 2: Impact Analysis

**Epic Impact:** None — Gyre epics 1-4 are unaffected. This is a manifest data issue, not a domain logic issue.

**Story Impact:** No current or future stories require changes.

**Artifact Conflicts:**
- `_bmad/_config/agent-manifest.csv` — contains 7 duplicate rows that need removal
- No PRD, architecture, or UX changes required

**Technical Impact:** None — single CSV file cleanup.

## Section 3: Recommended Approach

**Path:** Direct Adjustment — manifest cleanup only

**Rationale:**
- The LLM already handles team scoping correctly when manifest data is clean (proven on another install)
- No Party Mode workflow changes needed
- Removing duplicates is low effort, low risk — the canonical entries at lines 31-37 remain intact

**Alternatives considered:**
- Team-filtering logic in Party Mode — rejected as overkill; clean data is sufficient
- Manifest schema changes (adding `team` field) — rejected; path-based distinction (`_vortex` vs `_gyre`) already provides enough signal

## Section 4: Detailed Change Proposals

### Change 1: Remove duplicate Vortex entries from agent-manifest.csv

**Artifact:** `_bmad/_config/agent-manifest.csv`

**OLD:** Lines 2-8 — 7 Vortex agent rows with empty `module` field:
- Emma (contextualization-expert)
- Isla (discovery-empathy-expert)
- Mila (research-convergence-specialist)
- Liam (hypothesis-engineer)
- Wade (lean-experiments-specialist)
- Noah (production-intelligence-specialist)
- Max (learning-decision-expert)

**NEW:** Remove all 7 rows. Canonical entries at lines 31-37 (`module="bme"`, path `_bmad/bme/_vortex/agents/...`) are retained.

**Rationale:** Orphaned entries with empty module fields appear first in the manifest, causing Party Mode to present Vortex agents regardless of user's team request.

## Section 5: Implementation Handoff

**Scope classification:** Minor — direct implementation

**Action:** Remove lines 2-8 from `_bmad/_config/agent-manifest.csv`

**Success criteria:** When a user asks Party Mode to "talk to the Gyre team," only Scout, Atlas, Lens, and Coach are presented.

**Handoff:** Development team for direct implementation.
