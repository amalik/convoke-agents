# Story 4.3: Journey Quality Verification & Editorial Review

Status: done

## Story

As a maintainer,
I want to verify journey example quality through an editorial checklist and `/bmad-editorial-review-prose` validation,
So that the journey reads as a coherent narrative with professional prose quality and all editorial standards are met before publication.

## Acceptance Criteria

1. Given the annotated journey example from Stories 4.1 and 4.2 is complete, when the maintainer runs the editorial review process, then an editorial checklist is applied covering: narrative flow across all 7 sections, self-contained section validation, handoff annotation completeness, terminology consistency, and prose quality (FR19)
2. `/bmad-editorial-review-prose` is executed on the journey content to validate communication quality
3. The journey reads as a coherent narrative, not a collection of artifacts (NFR9)
4. Any editorial issues identified are resolved before the journey is considered complete
5. The final journey example is ready for linking from the README (supporting Epic 5 FR29)

## Tasks / Subtasks

- [x] Task 1: Run editorial-review-structure on the journey document (AC: #1, #3)
  - [x] 1.1 Read the full journey document (`_bmad-output/journey-examples/busy-parents-7-agent-journey.md`)
  - [x] 1.2 Execute `/bmad-editorial-review-structure` with content=journey document, purpose="7-agent product discovery journey example demonstrating BMAD's Vortex pattern", target_audience="new BMAD users and evaluators", reader_type="humans"
  - [x] 1.3 Review structural recommendations — apply CUT/MERGE/MOVE/CONDENSE changes that improve narrative flow without removing artifact content, annotations, or context declarations
  - [x] 1.4 Document which structural recommendations were accepted/rejected and why

- [x] Task 2: Run editorial-review-prose on the journey document (AC: #2)
  - [x] 2.1 Execute `/bmad-editorial-review-prose` with content=journey document, reader_type="humans"
  - [x] 2.2 Review the 3-column findings table (Original Text | Revised Text | Changes)
  - [x] 2.3 Apply all prose fixes that improve clarity without altering artifact data, percentages, evidence counts, or YAML frontmatter

- [x] Task 3: Apply editorial checklist — 5 dimensions (AC: #1)
  - [x] 3.1 **Narrative flow**: Read sequentially from Introduction through all 7 agent sections — verify each section's "What Happens Next" creates a natural bridge to the next agent; verify the Introduction sets up the full journey; verify the Conclusion reflects back on the complete chain
  - [x] 3.2 **Self-contained sections**: For each of the 6 context declarations (Isla through Max), verify: (a) the previous agent is identified by name, icon, and role; (b) the input artifact type is explained; (c) key terms are defined; (d) a reader entering here encounters no undefined terms
  - [x] 3.3 **Handoff annotation completeness**: For each of the 6 handoff annotations, verify: (a) the contract name is correct (contextual input for Emma→Isla, HC1-HC5 for the rest); (b) consumed fields match the actual artifact content in `_bmad-output/vortex-artifacts/`; (c) schema reference path is correct; (d) the annotation adds value without disrupting narrative flow
  - [x] 3.4 **Terminology consistency**: Grep the journey for all agent names, workflow names, and contract references — verify zero synonyms, abbreviations, or informal variants; all must match registry exactly (Emma 🎯, Isla 🔍, Mila 🔬, Liam 💡, Wade 🧪, Noah 📡, Max 🧭; HC1-HC5; lean-persona, user-discovery, research-convergence, hypothesis-engineering, mvp, signal-interpretation, learning-card)
  - [x] 3.5 **Prose quality**: Verify no grammatical errors, no awkward transitions, no passive voice overuse, no jargon without definition, no sentences over 40 words that could be split

- [x] Task 4: Fix all identified editorial issues (AC: #4)
  - [x] 4.1 Apply fixes from Task 1 structural review (if any accepted)
  - [x] 4.2 Apply fixes from Task 2 prose review
  - [x] 4.3 Apply fixes from Task 3 editorial checklist
  - [x] 4.4 Re-read the full document after all fixes to verify coherence was maintained

- [x] Task 5: Verify README-readiness (AC: #5)
  - [x] 5.1 Verify the journey document has a clear title, introduction, and conclusion that work standalone when linked from a README
  - [x] 5.2 Verify the document path (`_bmad-output/journey-examples/busy-parents-7-agent-journey.md`) is stable and suitable for external linking
  - [x] 5.3 Verify the document opens with enough context that a reader arriving from a README link can understand what they're reading without prior BMAD knowledge

## Dev Notes

### This is a CONTENT EDITING + REVIEW story, not a code story

This story runs two BMAD editorial review tasks on the journey document created in Stories 4.1-4.2, then applies an editorial checklist, fixes issues, and verifies README-readiness.

**No automated tests are expected.** Validation is editorial — the output is a polished journey document ready for publication.

### How to invoke the editorial review tasks

The editorial reviews are standalone BMAD tasks (not workflows). Invoke them as skills:

1. **Structure review**: `/bmad-editorial-review-structure` — outputs CUT/MERGE/MOVE/CONDENSE/QUESTION/PRESERVE recommendations
2. **Prose review**: `/bmad-editorial-review-prose` — outputs a 3-column table (Original Text | Revised Text | Changes)

Both tasks are defined at:
- `_bmad/core/tasks/editorial-review-prose.xml`
- `_bmad/core/tasks/editorial-review-structure.xml`

### Editorial review parameters

For the structure review:
- `content`: the full journey document
- `purpose`: "7-agent product discovery journey example"
- `target_audience`: "new BMAD users and evaluators"
- `reader_type`: "humans"

For the prose review:
- `content`: the full journey document
- `reader_type`: "humans"

### What NOT to change

These constraints carry forward from Stories 4.1 and 4.2:
- Do NOT modify the captured artifacts' YAML frontmatter or data values (percentages, evidence counts, participant numbers)
- Do NOT restructure the heading hierarchy (Introduction → 7 numbered agent sections → Conclusion)
- Do NOT remove handoff annotations or context declarations added in Story 4.2
- Do NOT alter agent names, icons, workflow names, or contract references — these are registry-verified
- Do NOT remove the Empathy Map, Recommendations, or other artifact sections

### What CAN be changed

- Prose in narrative paragraphs (Introduction, "What Happens Next" bridges, Conclusion)
- Wording in context declarations (italic paragraphs) — for clarity only, not content
- Wording in handoff annotations (blockquote callouts) — for clarity only, not field names
- Transition sentences between sections
- Sentence structure, grammar, punctuation in prose sections
- Minor restructuring if editorial-review-structure recommends it (with justification)

### Previous Story Intelligence (4.2)

Key learnings from Story 4.2:
- **Journey document is ~960 lines** after annotations and context declarations were added
- **Code review found and fixed 5 issues**: incorrect theme name ("default meal trap" → "Tool Abandonment Pattern"), forward-referenced evidence count ("52 evidence points" → "research findings"), undefined "Vortex" in context declarations (added parenthetical), missing Empathy Map in HC1 fields, undefined "concierge test" (added definition)
- **HC1 consumed field fix**: "Evidence Summary" was replaced with "Recommendations" (Evidence Summary exists in HC2, not HC1)
- **NFR10 fully verified**: All agent names with icons, contract references (HC1-HC5), and workflow names match registry exactly
- **False positive documented**: HC6/HC7/HC8 in Max's routing table are legitimate routing contracts defined in compass-routing-reference.md, not undefined terms

### Previous Story Intelligence (4.1)

Key learnings from Story 4.1:
- **Content creation follows editorial rules, not code rules** — no lint/test, editorial review validates
- **Code review found 5 issues** that were fixed: A3 assumption mislabeling, A4 validation overclaim, 14→10 weekday arithmetic, 4.1→4.2 baseline drift, weekend scope expansion
- **All fixes are already applied** — do NOT revert them

### Risk Profile

**Risk:** LOW — Editorial review and prose fixes on existing document.
- No code to break, no regressions possible
- Prose fixes are localized (sentence-level changes)
- Structural changes are recommendations only — dev agent chooses which to accept
- Primary risk: over-editing that disrupts the narrative voice established in 4.1

### Foundation for Epic 5

Story 4.3 completes Epic 4. The polished journey document becomes linkable content for:
- Epic 5, Story 5.3: README landing page value proposition visual overview
- Epic 5, Story 5.4: README landing page output previews & journey link (FR29)

### Project Structure Notes

- Journey document: `_bmad-output/journey-examples/busy-parents-7-agent-journey.md`
- Individual artifacts: `_bmad-output/vortex-artifacts/` (7 files — reference only, do not modify)
- Editorial review tasks: `_bmad/core/tasks/editorial-review-prose.xml`, `_bmad/core/tasks/editorial-review-structure.xml`
- Agent registry: `scripts/update/lib/agent-registry.js`

### References

- [Source: _bmad-output/planning-artifacts/epics-phase2.md#Epic 4, Story 4.3]
- [Source: _bmad-output/planning-artifacts/prd-phase2.md#FR19, NFR9, NFR10]
- [Source: _bmad/core/tasks/editorial-review-prose.xml]
- [Source: _bmad/core/tasks/editorial-review-structure.xml]
- [Source: _bmad-output/implementation-artifacts/p2-4-2-add-handoff-annotations-self-contained-sections.md]
- [Source: _bmad-output/implementation-artifacts/p2-4-1-create-7-agent-journey-example-with-real-artifacts.md]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Structural review produced 13 recommendations (5 CONDENSE, 3 PRESERVE, 2 QUESTION, 1 MOVE). Accepted: CONDENSE on Emma's second paragraph (#2), "What Happens Next" transitions (#3), agent intro narratives (#1), "Vortex Continues" (#9), intro closing (#8). Preserved: all artifacts, annotations, context declarations per constraints. Deferred: footer move (#11) and Emma validation plan note (#12) as low priority.
- Prose review produced 11 actionable findings — all applied. Fixes: colon→em dash, passive voice ("gets distilled"→"is distilled"), parallel infinitive ("not build"→"not to build"), preposition ("at adaptive timing"→"with adaptive timing"), number spelling ("7"→"seven"), active voice in footer, article/pronoun refinements.
- Editorial checklist: 4/5 dimensions PASS on first check. Terminology consistency failed on one violation: agent icons missing from "How This Journey Works" numbered list (lines 13-19). Fixed by adding icons to all 7 entries.

### Completion Notes List

- Structural review: reduced ~950-1,100 words of redundant prose while preserving all artifacts, annotations, and context declarations
- Prose review: applied 11 minor fixes (grammar, voice, prepositions, parallel construction, number convention)
- Editorial checklist 5 dimensions: narrative flow PASS, self-contained sections PASS, handoff annotation completeness PASS (all 6 annotations verified against vortex-artifacts), terminology consistency PASS (after icon fix), prose quality PASS
- Fixed terminology violation: added agent icons to introductory numbered list for NFR10 compliance
- Updated footer from "see Story 4.3" forward reference to "Editorial quality verified through structural review, prose review, and 5-dimension editorial checklist (Story 4.3)"
- README-readiness verified: title, intro blockquote, and "How This Journey Works" provide sufficient context for a reader arriving via README link

### Change Log

- 2026-03-01: Structural condensation — removed redundant Emma paragraph, condensed 7 "What Happens Next" transitions, condensed 6 agent intro narratives, condensed "Vortex Continues" section
- 2026-03-01: Prose fixes — 11 corrections (grammar, voice, prepositions, parallel construction, number convention, active voice)
- 2026-03-01: Terminology fix — added agent icons to introductory numbered list (NFR10)
- 2026-03-01: Updated footer to reflect completed editorial verification
- 2026-03-01: Code review fixes — 5 issues (split 45-word conclusion sentence, renamed "The Vortex Continues" → "What Happens Next" for parallel structure, replaced unverifiable "52 evidence points" with descriptive language, wrapped Emma's YAML in code fence, simplified footer internal paths)

### File List

- `_bmad-output/journey-examples/busy-parents-7-agent-journey.md` (modified — structural condensation, prose fixes, terminology fix, footer update, code review fixes)
