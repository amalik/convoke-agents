# Story 6.1: Scope-Adjacent Improvements Backlog Convention

Status: done

## Story

As a maintainer,
I want a lightweight markdown-based convention for capturing scope-adjacent improvements discovered during Phase 2 work,
so that good ideas are preserved without interrupting current deliverable progress.

## Acceptance Criteria

1. Given the maintainer is working on any Phase 2 story and discovers a scope-adjacent improvement, when they need to capture the improvement for later consideration, then a markdown backlog file exists with a documented convention for adding entries (FR32)
2. Each entry captures: discovery context (which story/epic), description, estimated impact, and suggested priority
3. The convention is intentionally lightweight — a markdown file with a section format, not a tracking system (FR32)
4. The backlog file is created at the start of Phase 2 and accumulates entries across all epics

## Tasks / Subtasks

- [x] Task 1: Create backlog convention file (AC: #1, #2, #3)
  - [x] 1.1 Create `_bmad-output/scope-adjacent-backlog.md` with a clear title, purpose statement, and usage instructions explaining when and why to add entries — scope-adjacent means improvements discovered during Phase 2 that fall outside current story scope; the only exception is if the improvement is a prerequisite for completing a Phase 2 deliverable (pulled into current story instead)
  - [x] 1.2 Document the entry convention format with these 4 required fields per AC#2:
    - **Discovery context:** Which story/epic triggered the discovery (e.g., "Epic 3, Story 3.2 — hypothesis-engineering workflow")
    - **Description:** What the improvement is and why it matters
    - **Estimated impact:** How significant the improvement would be (High/Medium/Low with brief rationale)
    - **Suggested priority:** When it should be addressed (e.g., "Phase 2.5", "Phase 3", "Nice-to-have")
  - [x] 1.3 Add a concrete example entry demonstrating the convention format so maintainers can follow the pattern without ambiguity — use a realistic improvement discovered during Phase 2 work (not a placeholder)
  - [x] 1.4 Keep the convention section under 20 lines — this is intentionally lightweight (FR32), not a project management framework. A maintainer should understand the format in under 60 seconds
  - [x] 1.5 Add a brief "When NOT to use this backlog" section clarifying the exception: if the improvement is a prerequisite for completing a Phase 2 deliverable, it gets pulled into the current story/epic instead of deferred

- [x] Task 2: Seed backlog with improvements discovered during Phase 2 Epics 1-5 (AC: #4)
  - [x] 2.1 Review all Phase 2 retrospectives (`p2-epic-1-retro` through `p2-epic-5-retro`) for scope-adjacent improvements that were noted but deferred — look for "Technical Debt", "Known Issues", "Deferred Items", and "Lessons Learned" sections
  - [x] 2.2 Review code review findings from Phase 2 stories that suggested improvements beyond the story's scope — especially recurring patterns flagged across multiple stories
  - [x] 2.3 Review the PRD's risk mitigation section for examples of scope-adjacent improvements mentioned (e.g., "docs that need rewriting not just fixing, agent interfaces that should change for testability")
  - [x] 2.4 Add each discovered improvement as a properly formatted entry using the convention from Task 1 — minimum 3 entries to demonstrate the backlog is a living document, not an empty template. **NFR11 discipline:** Each newly written entry must use PM-friendly language with zero implementation jargon — same sustained effort that Stories 5.3-5.5 applied to all content
  - [x] 2.5 Verify each entry's discovery context references actual stories/epics (filesystem-verify against implementation-artifacts/)

- [x] Task 3: Validate NFR compliance and final review (AC: #1-#4)
  - [x] 3.1 **NFR7** — Verify no new entries in package.json dependencies or devDependencies. This story creates only markdown files
  - [x] 3.2 **NFR10** — Verify all agent/workflow names referenced in backlog entries match the registry exactly (agent-registry.js source of truth)
  - [x] 3.3 **NFR11** — Read the backlog file as a non-technical PM: Is the convention clear? Can someone add an entry without developer knowledge?
  - [x] 3.4 **FR32** — Verify: (a) markdown file exists with convention, (b) entries capture all 4 required fields, (c) lightweight format (not a tracking system), (d) file accumulates entries across epics
  - [x] 3.5 Run the full test suite — `npm test`. This story adds no JavaScript, so expect 0 regressions (293 pass, 0 fail, 2 todo baseline)
  - [x] 3.6 Verify backlog file is well-formed markdown (no syntax errors, proper heading hierarchy, consistent formatting)

## Dev Notes

### Implementation Approach

This story creates a **lightweight markdown-based backlog convention** for capturing scope-adjacent improvements discovered during Phase 2 work. The key design principle from FR32 is explicit: "intentionally lightweight — a markdown file with a convention, not a tracking system."

The backlog file lives in `_bmad-output/` alongside other project artifacts (consistent with `feedback-template.md` placement from Story 5.5). It uses a simple section format where each entry is a markdown section with 4 required fields.

**Timing note:** AC#4 states "the backlog file is created at the start of Phase 2 and accumulates entries across all epics." Since we are formalizing this convention at the end of Phase 2 (Epic 6), Task 2 retroactively seeds the backlog with improvements discovered during Epics 1-5 by reviewing retrospectives, code reviews, and story files.

### Scope-Adjacent Definition (from PRD Risk Mitigation)

The PRD defines scope-adjacent improvements as: "improvements discovered during Phase 2 (docs that need rewriting not just fixing, agent interfaces that should change for testability) go into a Phase 2.5 backlog. The only exception is if the improvement is a prerequisite for completing a Phase 2 deliverable."

**FR32 "tracked backlog" clarification:** FR32 uses the term "tracked backlog" — this means persistent and accumulating (entries are preserved across epics and queryable), NOT a real-time tracking system or issue tracker. The markdown file IS the tracking mechanism.

**Scope freeze rule:** Deliverable list is fixed at PRD approval. Any addition requires explicit scope change decision. Deferred items are commitments, not suggestions.

### Entry Format Design

Each entry must capture exactly 4 data points (AC#2):
1. **Discovery context** — Which story/epic triggered the discovery
2. **Description** — What the improvement is
3. **Estimated impact** — How significant (High/Medium/Low)
4. **Suggested priority** — When to address (Phase 2.5, Phase 3, Nice-to-have)

The format should be scannable — a maintainer should be able to read the full backlog in under 2 minutes and understand the landscape of deferred improvements.

### What NOT To Do

- Do NOT create a YAML schema, JSON format, or structured data file — this is markdown with a section convention (FR32)
- Do NOT introduce external tracking tools, issue labels, or project board columns — repo-only, single file
- Do NOT add new npm dependencies — this is markdown content only (NFR7)
- Do NOT modify any JavaScript, test files, or CI configuration
- Do NOT add the backlog to the installer — this is a repo-level project management file, not a user-installed file
- Do NOT create complex categorization taxonomies — keep it to the 4 required fields
- Do NOT forget to include sprint-status.yaml in File List if modified (Epic 5 retrospective lesson — recurring blind spot across 2+ epics)

### Previous Story Learnings (from Story 5.5 and Epic 5 Retrospective)

**Content creation patterns:**
- Verify all numeric claims (counts, dates, references) against actual files (Story 5-3 lesson)
- Use exact terminology from source requirements — don't paraphrase FR32's words
- Include sprint-status.yaml in File List if modified
- No hidden content (HTML comments, `<details>` tags) — everything user-facing must be visible when rendered (Story 5.5 M1 code review fix)
- PM-friendly language (NFR11) — avoid implementation jargon

**Code review preparedness:**
- Content stories produce ~5 findings per story (Epic 5 retrospective confirmed pattern)
- Likely findings: forward references, terminology consistency, example accuracy
- Adversarial code review mandatory on all stories, content or code

**Existing lightweight template pattern:**
- `_bmad-output/feedback-template.md` (Story 5.5) provides a reference for lightweight markdown convention files
- 20 lines, clear field labels, usage instructions at top
- Follow this pattern: brief instructions → fields → examples

### Cross-Story Context

**Within Epic 6:**
- Story 6.2 (Docs Fix Pass 2) may reference backlog entries for regressions discovered
- Story 6.3 (Raya's Journey Acceptance Test) may record friction points into the backlog
- Stories 6.2 and 6.3 should reference this convention when logging scope-adjacent discoveries

**Cross-Epic:**
- FR32 states backlog is "active throughout Phase 2" — Epics 1-5 may have contributed improvements
- Retrospectives from Epics 1-5 are the primary source for seeding initial entries

### Parallel Preparation (from Epic 5 Retrospective — MUST NOT BE OVERLOOKED)

- **ACTION REQUIRED during Story 6.1:** Smoke test `scripts/docs-audit.js` against the current documentation set. Run `node scripts/docs-audit.js` and verify it completes without errors. This tool hasn't been exercised since Story 1.4 (Pass 1 checkpoint) and the docs landscape has changed significantly across Epics 1-5. If the tool is broken, Story 6.2 cannot start. This is independent of Story 6.1 implementation but must happen in parallel — do not defer to Story 6.2.

### Project Structure Notes

- Backlog file location: `_bmad-output/scope-adjacent-backlog.md` (NEW) — consistent with `_bmad-output/feedback-template.md` placement
- Story file location: `_bmad-output/implementation-artifacts/p2-6-1-scope-adjacent-improvements-backlog-convention.md` (NEW)
- Sprint status: `_bmad-output/implementation-artifacts/sprint-status.yaml` (MODIFIED — status transition)
- No JavaScript changes expected — content-only story
- Test baseline: 293 pass, 0 fail, 2 todo

### Existing Artifact References

**Feedback template** (`_bmad-output/feedback-template.md`): 20-line local markdown template with Agent/Category/Description fields. Closest existing pattern to what the backlog convention file should look like — lightweight, clear fields, usage instructions at top.

**Retrospective files** (sources for Task 2 seeding):
- `_bmad-output/implementation-artifacts/p2-epic-1-retro-*.md`
- `_bmad-output/implementation-artifacts/p2-epic-2-retro-*.md`
- `_bmad-output/implementation-artifacts/p2-epic-3-retro-*.md`
- `_bmad-output/implementation-artifacts/p2-epic-4-retro-2026-03-01.md`
- `_bmad-output/implementation-artifacts/p2-epic-5-retro-2026-03-02.md`

### References

- [Source: _bmad-output/planning-artifacts/epics-phase2.md#Epic 6, Story 6.1] — ACs, dependencies, FR32
- [Source: _bmad-output/planning-artifacts/prd-phase2.md#FR32] — Scope-adjacent improvements backlog, lightweight markdown convention
- [Source: _bmad-output/planning-artifacts/prd-phase2.md#Risk Mitigation] — Phase 2.5 backlog rule, scope freeze, exception criteria
- [Source: _bmad-output/planning-artifacts/prd-phase2.md#NFR7] — No new external dependencies
- [Source: _bmad-output/planning-artifacts/prd-phase2.md#NFR10] — Consistent terminology
- [Source: _bmad-output/planning-artifacts/prd-phase2.md#NFR11] — Non-technical PM audience
- [Source: _bmad-output/implementation-artifacts/p2-5-5-structured-user-feedback-mechanism.md] — Previous story: lightweight markdown convention pattern
- [Source: _bmad-output/implementation-artifacts/p2-epic-5-retro-2026-03-02.md] — Epic 5 retrospective: process commitments, preparation tasks

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

### Completion Notes List

- Task 1: Created `_bmad-output/scope-adjacent-backlog.md` with title, purpose statement, usage instructions, "When NOT to use" section, and convention format (4 required fields). Convention section is 8 lines (well under 20-line limit). Follows feedback-template.md pattern: brief instructions at top, clear fields, scannable format.
- Task 2: Seeded 4 entries from Phase 2 Epics 1, 2, 4, and 5 by reviewing all 5 retrospective files and PRD risk mitigation section. Entries cover: audit tool semantic patterns (Epic 1), Wade stub workflow completion (Epic 2), journey example narrative overlap (Epic 4), user-agent preservation gap (Epic 5). All entries verified against registry (NFR10) and written in PM-friendly language (NFR11).
- Task 3: All NFR/FR validations passed. Test suite: 293 pass, 0 fail, 2 todo (zero regressions). No package.json changes (NFR7). Agent/workflow names match registry exactly (NFR10). PM-readable convention confirmed (NFR11). FR32 fully satisfied.
- Parallel preparation: Smoke tested `scripts/docs-audit.js` — runs successfully with zero findings. Note: story Dev Notes referenced path as `scripts/audit/docs-audit.js` but actual path is `scripts/docs-audit.js`. Tool is functional for Story 6.2.

### Change Log

- 2026-03-02: Created `_bmad-output/scope-adjacent-backlog.md` — lightweight markdown backlog convention with 4 seeded entries from Phase 2 Epics 1-5
- 2026-03-02: Updated sprint-status.yaml — p2-6-1 status transitions (ready-for-dev → in-progress → review)
- 2026-03-02: Code review fixes — M1: corrected docs-audit.js path in Dev Notes (`scripts/audit/docs-audit.js` → `scripts/docs-audit.js`); L1: replaced "handoff annotations" → "transition notes", "configuration merge" → "settings update process" (NFR11); L2: added "Phase 2" prefix to all 4 entry discovery contexts

### File List

- `_bmad-output/scope-adjacent-backlog.md` (NEW)
- `_bmad-output/implementation-artifacts/p2-6-1-scope-adjacent-improvements-backlog-convention.md` (MODIFIED)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (MODIFIED)
