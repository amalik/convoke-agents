# Story 6.2: Execute Docs Fix Pass 2 & Post-Release Review Template

Status: done

## Story

As a maintainer,
I want to re-run the docs audit after all Phase 2 content changes and have a structured post-release review template,
so that documentation regressions introduced by Epics 1-5 are caught before release and I have a repeatable process for evaluating release quality.

## Acceptance Criteria

1. Given all content changes from Epics 1-5 are complete, when the maintainer executes Docs Fix Pass 2, then the docs audit tool (Story 1.1) is re-run against the full documentation set and the Pass 2 report is compared against the Pass 1 checkpoint baseline (Story 1.4) to identify new regressions (FR33)
2. All new findings are resolved — zero stale references, zero broken links, zero missing content
3. Terminology consistency is verified across all docs including new content from Epics 2-5 (NFR10)
4. All internal links validate successfully (NFR18)
5. Pass 2 includes a journey example freshness check — verifying that all agent outputs referenced in the journey still match current agent behavior and that transition notes reference the finalized (not draft) contract schemas
6. Given a Phase 2 release has been published, when the maintainer conducts a post-release review, then a structured checklist template exists for comparing reported issues against existing test coverage to identify validation gaps (FR33)
7. The review template produces actionable items for strengthening test coverage in future phases

## Tasks / Subtasks

- [x] Task 1: Execute automated docs audit — Pass 2 (AC: #1, #2)
  - [x] 1.1 Run `node scripts/docs-audit.js --json` and save output to compare against Pass 1 baseline (Pass 1 baseline: zero findings — see inter-pass checkpoint)
  - [x] 1.2 Run `node scripts/docs-audit.js` (human-readable) and review all findings by category: stale-reference, broken-link, broken-path, missing-coverage
  - [x] 1.3 Compare Pass 2 results against Pass 1 baseline — any new finding is a regression introduced by Epics 2-5 content changes
  - [x] 1.4 Document Pass 2 results: total findings, breakdown by category, which files affected, which epics introduced regressions

- [x] Task 2: Execute manual review checks beyond tool coverage (AC: #2, #3, #5)
  - [x] 2.1 Search all 9 user-facing docs for "four" or "4" referencing agents (should be 7) — the tool catches digit patterns but may miss contextual references like "all four together"
  - [x] 2.2 Search for "thirteen" or "13" referencing workflows (should be 22) — same contextual gap
  - [x] 2.3 Verify all agent enumeration lists and tables are complete (should list all 7 agents) — tool checks for mention presence but not list completeness
  - [x] 2.4 Verify Wave 3 agent references use present/past tense, not future tense (Mila, Liam, Noah are complete, not planned)
  - [x] 2.5 **Journey example freshness check (AC#5):** Verify `_bmad-output/journey-examples/` content matches current agent behavior — agent outputs referenced in the journey should reflect finalized personas and workflows, not draft versions; transition notes should reference finalized (not draft) contract schemas in `_bmad/bme/_vortex/contracts/`
  - [x] 2.6 **Terminology consistency (AC#3, NFR10):** Verify agent names, workflow names, and stream names across all docs match the registry exactly — cross-check against `agent-registry.js` (7 agents, 22 workflows)

- [x] Task 3: Fix all findings from Tasks 1-2 (AC: #2, #3, #4)
  - [x] 3.1 Fix all automated audit findings (stale references, broken links, broken paths, missing coverage) — goal: zero findings on re-run
  - [x] 3.2 Fix all manual review findings (contextual stale references, incomplete lists, tense issues)
  - [x] 3.3 Fix any journey example freshness issues discovered in Task 2.5
  - [x] 3.4 Re-run `node scripts/docs-audit.js` after fixes — must produce zero findings
  - [x] 3.5 Re-run manual review checklist after fixes — must produce zero findings

- [x] Task 4: Create post-release review template (AC: #6, #7, FR33)
  - [x] 4.1 Create `_bmad-output/post-release-review-template.md` — a structured checklist template for conducting post-release reviews
  - [x] 4.2 Template must include a section for comparing reported issues against existing test coverage — for each issue, document: the issue, which test(s) should have caught it, why the gap exists, and what test to add
  - [x] 4.3 Template must include a section for identifying validation gaps — issues that tests should have caught but didn't, categorized by test type (unit, integration, content, CI)
  - [x] 4.4 Template must produce actionable items for strengthening test coverage in future phases — each gap should map to a concrete test improvement
  - [x] 4.5 Keep the template lightweight and PM-accessible (NFR11) — follow the `feedback-template.md` and `scope-adjacent-backlog.md` patterns from Stories 5.5 and 6.1
  - [x] 4.6 Add a concrete example entry demonstrating how to use the template — use a realistic scenario from Phase 2 (not a placeholder)

- [x] Task 5: Validate NFR compliance and final review (AC: #1-#7)
  - [x] 5.1 **NFR7** — Verify no new entries in package.json dependencies or devDependencies. This story creates only markdown files and fixes existing markdown
  - [x] 5.2 **NFR10** — Verify all agent/workflow names in fixed docs and new template match the registry exactly
  - [x] 5.3 **NFR11** — Read the post-release review template as a non-technical PM: Is the checklist clear? Can someone conduct a review without developer knowledge?
  - [x] 5.4 **NFR18** — Verify all internal links validate successfully after fixes
  - [x] 5.5 **FR33** — Verify: (a) post-release review template exists, (b) template compares issues against test coverage, (c) template identifies validation gaps, (d) template produces actionable items
  - [x] 5.6 Run the full test suite — `npm test`. This story modifies no JavaScript, so expect 0 regressions (293 pass, 0 fail, 2 todo baseline)
  - [x] 5.7 **NFR6** — Verify `node scripts/docs-audit.js` requires zero manual configuration — a single command with no arguments produces the full report
  - [x] 5.8 Final `node scripts/docs-audit.js` — must produce zero findings (clean audit)

## Dev Notes

### Implementation Approach

This story has two distinct deliverables:
1. **Pass 2 docs audit** — re-run the audit tool and manual checks after all Phase 2 content changes, fix any regressions, achieve zero findings
2. **Post-release review template** — create a lightweight markdown checklist for FR33

**Pass 2 context:** The docs audit tool was built in Story 1.1 and the Pass 1 baseline was established in Story 1.4. Pass 1 fixed 18 findings across 4 categories (12 stale-reference, 4 broken-link, 2 broken-path, 0 missing-coverage). The Pass 1 baseline is zero findings. Since then, Epics 2-5 added significant content (tests, README rewrite, journey example, feedback template). Pass 2 catches any regressions introduced by that content.

**Smoke test result (from Story 6.1):** `node scripts/docs-audit.js` ran successfully with zero findings during Story 6.1. This means the automated tool currently sees no regressions. However, manual checks (semantic patterns, tense drift, list completeness) have not been run since Pass 1.

### Docs Audit Tool Reference

**Location:** `scripts/docs-audit.js`
**4 check categories:** stale-reference, broken-link, broken-path, missing-coverage
**9 user-facing docs scanned:** `docs/agents.md`, `docs/development.md`, `docs/testing.md`, `docs/faq.md`, `README.md`, `UPDATE-GUIDE.md`, `INSTALLATION.md`, `CHANGELOG.md` (stale-refs excluded), `BMAD-METHOD-COMPATIBILITY.md`
**Registry state:** 7 agents, 22 workflows (from `agent-registry.js`)
**CLI:** `node scripts/docs-audit.js` (human-readable) or `--json` (machine-parseable)
**Exit codes:** 0 = zero findings, 1 = findings exist

### Tool Limitations — Manual Checks Required

The audit tool catches numeric patterns and structural issues but misses 4 semantic patterns that require manual review:
1. **Contextual stale references:** "all four together" — no digit or word-number trigger
2. **Internal stream names in parentheses:** "(Synthesize)", "(Hypothesize)" — not in contradictory terminology patterns
3. **Incomplete agent enumeration:** Tables/lists with fewer than 7 agents — tool checks presence, not completeness
4. **Tense drift:** Features described as planned/future when now complete (Wave 3 agents)

These are documented in the inter-pass checkpoint and must be checked manually in Pass 2.

### Pass 1 Checkpoint Reference

**File:** `_bmad-output/implementation-artifacts/p2-epic-1-inter-pass-checkpoint.md`
**Pass 1 baseline:** Zero findings (18 fixed: 12 stale-reference, 4 broken-link, 2 broken-path)
**Pass 1 test baseline:** 248 tests (now 293 after Epics 2-5)
**Pass 2 execution guide:** 5-step procedure with exact commands, JSON comparison script, 7-item manual review checklist — all documented in the checkpoint file
**Deferred regression surface areas:** docs/testing.md (Epic 2-3 test content), docs/development.md (Epic 3 content), docs/faq.md (Epic 4 journey), docs/agents.md (Epic 4 annotations), README.md (Epic 5 rewrite)

### Post-Release Review Template Design (FR33)

FR33 requires: "Maintainer can conduct a structured post-release review using a checklist template that compares reported issues against existing test coverage to identify validation gaps."

The template should follow the lightweight convention pattern established by:
- `_bmad-output/feedback-template.md` (Story 5.5) — 20 lines, clear fields, usage instructions
- `_bmad-output/scope-adjacent-backlog.md` (Story 6.1) — purpose statement, convention section, example entry

**Key template sections (per FR33):**
1. Release information (version, date, review date)
2. Reported issues checklist — for each issue: description, severity, test coverage status (covered/gap)
3. Validation gap analysis — issues that tests should have caught, categorized by test type
4. Actionable improvements — concrete test additions for future phases
5. Review outcome — overall quality assessment

**Release quality gate context (from PRD):** "Zero bugs the test suite should have caught — post-release review at 7 days."

### What NOT To Do

- Do NOT modify `scripts/docs-audit.js` or any JavaScript — this story fixes documentation, not the tool
- Do NOT add new npm dependencies (NFR7)
- Do NOT modify test files or CI configuration
- Do NOT create complex tracking systems — both the post-release review template and docs fixes are markdown only
- Do NOT forget to include sprint-status.yaml in File List if modified
- Do NOT use hidden content (HTML comments, `<details>` tags) — everything must be visible when rendered

### Previous Story Learnings (from Story 6.1 and Epic 5 Retrospective)

**Content creation patterns:**
- Verify all numeric claims against actual files (Story 5.3 lesson)
- Use exact terminology from source requirements — don't paraphrase FR33's words
- Include sprint-status.yaml in File List if modified (recurring blind spot)
- No hidden content — everything visible when rendered (Story 5.5 M1 fix)
- PM-friendly language (NFR11) — sustained effort to eliminate jargon
- Add "Phase 2" prefix when referencing epics to disambiguate from Phase 1

**Code review preparedness:**
- Content stories produce ~5 findings per story (consistent across Epic 5)
- Likely findings: factual accuracy, specificity loss, NFR11 jargon, forward references
- Adversarial code review mandatory before marking done

**Story 6.1 specific learnings:**
- docs-audit.js is at `scripts/docs-audit.js` (NOT `scripts/audit/docs-audit.js`)
- Lightweight template pattern: brief instructions at top, clear fields, examples, scannable format
- Convention section under 20 lines for lightweight files
- Use "transition notes" instead of "handoff annotations" (NFR11 fix from 6.1 code review)
- Use "settings update process" instead of "configuration merge" (NFR11 fix from 6.1 code review)

### Cross-Story Context

**Within Epic 6:**
- Story 6.1 (Backlog Convention) is done — scope-adjacent improvements discovered during Pass 2 should be added to `_bmad-output/scope-adjacent-backlog.md`
- Story 6.3 (Raya's Journey Acceptance Test) depends on docs being clean — Pass 2 must complete first
- Story 6.3 is the Phase 2 release gate

**Cross-Epic:**
- Pass 1 was Epic 1 (Stories 1.1-1.4)
- Pass 2 surface area covers all content from Epics 2-5
- README rewrite (Stories 5.3-5.4) is the biggest single content change since Pass 1

### Project Structure Notes

- Post-release review template location: `_bmad-output/post-release-review-template.md` (NEW) — consistent with `feedback-template.md` and `scope-adjacent-backlog.md` placement
- Story file location: `_bmad-output/implementation-artifacts/p2-6-2-execute-docs-fix-pass-2-post-release-review-template.md` (NEW)
- Sprint status: `_bmad-output/implementation-artifacts/sprint-status.yaml` (MODIFIED — status transition)
- Inter-pass checkpoint: `_bmad-output/implementation-artifacts/p2-epic-1-inter-pass-checkpoint.md` (reference only, not modified)
- Documentation files potentially modified: `docs/agents.md`, `docs/development.md`, `docs/testing.md`, `docs/faq.md`, `README.md`, `UPDATE-GUIDE.md`, `INSTALLATION.md`, `BMAD-METHOD-COMPATIBILITY.md`
- No JavaScript changes expected
- Test baseline: 293 pass, 0 fail, 2 todo

### References

- [Source: _bmad-output/planning-artifacts/epics-phase2.md#Epic 6, Story 6.2] — ACs, dependencies, FR33
- [Source: _bmad-output/planning-artifacts/prd-phase2.md#FR33] — Post-release review template, validation gap identification
- [Source: _bmad-output/planning-artifacts/prd-phase2.md#Release Quality Gate] — Zero bugs the test suite should have caught
- [Source: _bmad-output/planning-artifacts/prd-phase2.md#NFR7] — No new external dependencies
- [Source: _bmad-output/planning-artifacts/prd-phase2.md#NFR10] — Consistent terminology
- [Source: _bmad-output/planning-artifacts/prd-phase2.md#NFR11] — Non-technical PM audience
- [Source: _bmad-output/planning-artifacts/prd-phase2.md#NFR18] — Internal link validation
- [Source: _bmad-output/implementation-artifacts/p2-epic-1-inter-pass-checkpoint.md] — Pass 1 baseline, Pass 2 execution guide, manual review checklist
- [Source: _bmad-output/implementation-artifacts/p2-1-4-validate-pass-1-completeness-document-inter-pass-checkpoint.md] — Pass 1 completion details
- [Source: _bmad-output/implementation-artifacts/p2-6-1-scope-adjacent-improvements-backlog-convention.md] — Previous story: lightweight convention pattern, docs-audit.js path correction
- [Source: _bmad-output/implementation-artifacts/p2-epic-5-retro-2026-03-02.md] — Epic 5 retrospective: process commitments, preparation tasks

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

### Completion Notes List

- Task 1 complete: Pass 2 automated audit — JSON output `[]`, human-readable "zero findings". Pass 1 baseline was zero; Pass 2 is zero. No regressions from Epics 2-5 content changes detected by automated tooling.
- Task 2 complete: Manual review found 27 findings across 5 files. Check 2.1: 0 actionable (historical CHANGELOG). Check 2.2: 0 actionable (historical CHANGELOG). Check 2.3: 7 incomplete agent lists (INSTALLATION.md x3, BMAD-METHOD-COMPATIBILITY.md x3, testing.md x1). Check 2.4: 3 tense drift (development.md x2, BMAD-METHOD-COMPATIBILITY.md x1). Check 2.5: 3 HC contract mismatches in journey routing table. Check 2.6: 14 terminology mismatches (BMAD-METHOD-COMPATIBILITY.md x9, INSTALLATION.md x3, development.md x1, CHANGELOG.md x1). Most affected file: BMAD-METHOD-COMPATIBILITY.md (frozen at v1.0.4-alpha era).
- Task 3 complete: All findings fixed. BMAD-METHOD-COMPATIBILITY.md updated from v1.0.4-alpha to v1.6.4 (architecture diagram, directory tree, testing instructions, compatibility matrix, version references — all 9 terminology issues + 3 incomplete lists + 1 tense drift). INSTALLATION.md directory trees expanded to show all 7 agents, 22 workflows, 7 user guides. docs/development.md contribution guidance updated (removed stale stream references, added all 5 missing agents to test contribution list). docs/testing.md added Mila/Liam/Noah sections, removed "planned" language. CHANGELOG.md footer path corrected. Journey example HC6/HC7/HC8 routing contracts fixed to match canonical definitions in compass-routing-reference.md. Post-fix audit: zero findings.
- Task 4 complete: Created `_bmad-output/post-release-review-template.md`. Template has 6 sections: Release Information, Reported Issues (table with severity + coverage status + gap analysis per issue), Validation Gap Analysis (categorized by test type: unit, integration, content, CI), Actionable Improvements (concrete test-to-add per gap), Review Outcome, and a Phase 2 example entry using the real BMAD-METHOD-COMPATIBILITY.md staleness finding. Follows lightweight pattern from feedback-template.md and scope-adjacent-backlog.md. PM-accessible language throughout.
- Task 5 complete: All NFR validations passed. NFR7: no package.json changes. NFR10: all terminology matches registry. NFR11: template is PM-accessible. NFR18: zero broken links (audit JSON `[]`). FR33: template exists with all 4 required components. NFR6: zero-config audit confirmed. Test suite: 293 pass, 0 fail, 2 todo (baseline match). Final audit: zero findings.

### Change Log

- Pass 2 docs audit executed: 0 automated findings, 27 manual findings across 5 files, all fixed
- BMAD-METHOD-COMPATIBILITY.md updated from v1.0.4-alpha era to v1.6.4 (comprehensive rewrite of stale content)
- INSTALLATION.md directory trees expanded for all 7 agents, 22 workflows, 7 user guides
- docs/development.md contribution guidance corrected (stale stream references, incomplete test list)
- docs/testing.md added Mila/Liam/Noah sections, removed "planned" language for Isla/Max
- CHANGELOG.md footer path corrected (design-artifacts -> _vortex/guides)
- Journey example HC routing contracts corrected (HC7 for Isla evidence gap, HC8 for Emma recontextualization, organic routing for Wade)
- Created post-release review template (_bmad-output/post-release-review-template.md) per FR33
- [Code Review Fix M1] Removed confusing "Wade - P0 Suite above" duplicate stub from docs/testing.md
- [Code Review Fix M2] Added P0 content-only test mention to Max section in docs/testing.md for consistency with Mila/Liam/Noah
- [Code Review Fix M3] Removed "via Liam" from journey routing table — Wade receives organic routing directly, not through Liam
- [Code Review Fix L1] Expanded "CI pipeline gaps" to "CI pipeline (automated checks) gaps" in post-release review template for NFR11 clarity

### File List

- _bmad-output/post-release-review-template.md (NEW)
- _bmad-output/implementation-artifacts/p2-6-2-execute-docs-fix-pass-2-post-release-review-template.md (MODIFIED)
- _bmad-output/implementation-artifacts/sprint-status.yaml (MODIFIED)
- _bmad-output/journey-examples/busy-parents-7-agent-journey.md (MODIFIED)
- BMAD-METHOD-COMPATIBILITY.md (MODIFIED)
- INSTALLATION.md (MODIFIED)
- CHANGELOG.md (MODIFIED)
- docs/development.md (MODIFIED)
- docs/testing.md (MODIFIED)
