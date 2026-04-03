# tf-epic-2 Supplementary Retrospective — April 2nd Increment

**Date:** 2026-04-03
**Epic:** tf-epic-2 (supplement to retro from 2026-03-25)
**Scope:** Conversational workflow layer added 2026-04-02
**Increment:** 28 new files, 31 commits, 11 code review fixes

## Increment Summary

On 2026-04-02, the Team Factory's conversational workflow layer was implemented: Forge Master agent definition, 6 workflow steps, 6 JS modules (cascade-logic, collision-detector, spec-parser/writer/differ), 2 JSON schemas, spec template, module config, help CSV, and skill entry point. Code review (Blind Hunter + Edge Case Hunter) caught 11 issues, all fixed.

This work was done **without stories, without SM involvement, and without sprint tracking** — it transitioned directly from a party mode planning discussion into implementation.

## What Went Well

1. **Code quality held up under adversarial review** — 78% of ACs fully met despite no ACs driving development. 0 ACs completely unmet.
2. **Code review caught real issues** — 2 critical (CSV header, schema persona), 3 high (parser validation, error swallowing, missing module). All fixed same session.
3. **M2 validation passed** — Gyre spec round-trips through the full pipeline (write → parse → resume → collision detection).
4. **Previous retro commitments partially honored** — adversarial code review and golden file testing maintained from March 25 retro.

## What Went Wrong

1. **Party mode became a stealth dev session** — Discussion about "how ready are we?" transitioned to "let's build it" without exiting party mode or creating stories. The user didn't notice the transition.
2. **No stories created** — Zero story files, zero ACs, zero sprint tracking for 28 files of work. The sprint-status.yaml already showed tf-epic-2 as "done" from March 25 — this work was invisible.
3. **Code review ran without Acceptance Auditor** — The `no-spec` mode meant the most valuable review layer (spec-reality misalignment detection) was skipped entirely. Ironic given the March 25 retro specifically called out this layer's value.
4. **Deferral decisions emerged from code review, not planning** — B-lite semantic validation, BMB templates, and Express Mode were deferred ad-hoc during review instead of being planned deferrals with backlog entries.
5. **No SM checkpoint** — Bob was never involved. In normal process, Bob creates stories, sets ACs, and manages sprint tracking.

## Root Cause

**Party mode has no gate between recommending work and executing work.** When John (PM) said "Shall we start executing?" and the user said "ok," code writing began immediately. The transition from planning to implementation was invisible — no exit from party mode, no story creation, no SM involvement.

## AC Confrontation

A retroactive story was created to confront all 23 ACs from Epic 2 Stories 2.1-2.9 against shipped code.

**Results:** 18 met (78%), 5 partially met (22%), 0 not met (0%)

Partial gaps:
- BMad Master wiring not verified (not in delivery manifest)
- B-lite semantic validation deferred (I13)
- Shared BMB templates deferred (P12)
- LLM generation idempotency is architectural constraint
- No end-to-end pilot run documentation

Retroactive story: `tf-2-workflow-layer-increment-2026-04-02.md`

## Action Items

| # | Action Item | Owner | Status |
|---|------------|-------|--------|
| 1 | **Add implementation boundary to party mode workflow** — Party mode is discussion/planning only. If code is recommended, facilitator must stop and direct to exit + story creation | Bob (SM) | ✅ Done — added to `step-02-discussion-orchestration.md` |
| 2 | **Save feedback memory** — Claude remembers to never write implementation code during party mode | System | ✅ Done — `feedback_no_code_in_party_mode.md` |
| 3 | **Create retroactive increment record** — Document what was built, confront ACs, surface gaps | Bob (SM) | ✅ Done — `tf-2-workflow-layer-increment-2026-04-02.md` |

## Previous Retro (March 25) Follow-Through

| # | March 25 Action Item | Status | Evidence |
|---|---------------------|--------|----------|
| 1 | Continue adversarial code review for all stories | ✅ Met | Blind Hunter + Edge Case Hunter ran |
| 2 | Maintain Previous Story Intelligence sections | ❌ Not applicable | No stories existed to carry intelligence |
| 3 | Keep golden file testing pattern for new JS modules | ✅ Met | Existing golden files anchored test suite |

## Technical Debt

| # | Item | Priority | Notes |
|---|------|----------|-------|
| 1 | 5 partially-met ACs | Medium | Documented in retroactive story. 3 are planned deferrals (I13, P12), 2 are architectural |
| 2 | No end-to-end pilot run | Medium | Factory has never been tested by actually creating a team |

## Key Insight

**Process guardrails exist for a reason.** The code quality was acceptable (78% AC met, 0 not met), but the *process* failed. Stories aren't just paperwork — they're the mechanism that enables Acceptance Auditor review, sprint tracking, and planned deferrals. Without them, the review is weaker, gaps are harder to trace, and the historical record is incomplete.

The guardrail is now in place: party mode will block implementation and redirect to story creation.

## Team Agreements

- Party mode = planning only. Implementation requires exit + stories.
- If process is skipped, acknowledge it explicitly — don't pretend it didn't happen.
- Retroactive stories are acceptable as honest audit tools, not as process substitutes.
