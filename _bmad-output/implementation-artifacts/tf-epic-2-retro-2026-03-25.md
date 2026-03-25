# tf-epic-2 Retrospective — Guided Workflow: Factory Discovery & Generation

**Date:** 2026-03-25
**Epic:** tf-epic-2
**Stories Completed:** 9/9
**Overall Result:** All stories completed with zero errors, zero blockers

## Epic Summary

tf-epic-2 delivered the complete Guided Workflow for BMAD team creation — a 6-step pipeline (Route → Scope → Connect → Review → Generate → Validate) enabling framework contributors to create fully-wired, BMAD-compliant teams through a conversational factory. The epic covered FR8–FR24 (17 functional requirements) and NFR1–NFR18 (18 non-functional requirements), producing 6 step files and 7 JS modules with 80 automated tests.

### Stories Delivered

| Story | Title | Key Deliverable |
|-------|-------|-----------------|
| 2.1 | Factory Discoverability & Entry Points | SKILL.md, step-00-route.md, menu/CSV integration |
| 2.2 | Composition Pattern Selection & Decision Cascade | step-01-scope.md (Part 1: pattern + cascade) |
| 2.3 | Agent Scope Definition & Overlap Detection | step-01-scope.md (Parts 3-4: scope + overlap) |
| 2.4 | Contract Design Step & Validation | step-02-connect.md |
| 2.5 | Decision Summary & Spec File Persistence | step-03-review.md |
| 2.6 | BMB Delegation & Artifact Generation | step-04-generate.md |
| 2.7 | Integration Wiring — Config, CSV & Activation | config-creator.js, csv-creator.js, activation-validator.js (33 tests) |
| 2.8 | Registry Wiring & Write Safety | registry-writer.js with Full Write Safety Protocol (25 tests) |
| 2.9 | End-to-End Validation & Error Recovery | end-to-end-validator.js, manifest-tracker.js (19 tests + 3 golden files) |

### Key Metrics

- Step files: 6 (steps 0-5), all following consistent structure (PURPOSE, RULES, PARTs, STEP VALIDATION, Visibility Checklist, CHECKPOINT, NEXT)
- JS modules: 7 (factory-types.js + 6 functional modules)
- Automated tests: 80 across 4 test suites, all passing
- Golden files: 4 reference snapshots (config, CSV, registry block, manifest)
- Code review hit rate: ~75% (consistent with Epic 1)
- Blockers: 0
- Production incidents: 0

## What Went Well

1. **Complete 6-step pipeline with structural consistency** — Every step file follows the same pattern (PURPOSE → RULES → PARTs → STEP VALIDATION → Visibility Checklist → CHECKPOINT → NEXT). This consistency makes the factory predictable and maintainable.

2. **100% retro commitment follow-through from tf-epic-1** — All 3 action items (layered story design, code review for all stories, Previous Story Intelligence sections) were maintained across all 9 stories. Previous Story Intelligence eliminated context loss in sequential execution.

3. **Write Safety Protocol landed clean** — Story 2.8's Full Write Safety Protocol (stage → validate → check → apply → verify → rollback) was the most complex implementation and worked first try with 25 tests. The Simple vs Full distinction provides a reusable pattern.

4. **Test infrastructure excellence** — 80 tests with golden file comparisons, proper temp directory isolation, fixture-based testing. Every JS module shipped with thorough coverage.

5. **Zero duplication in regression checks** — Story 2.9 reused `verifyRequire` from registry-writer.js and `validateInstallation()` from validator.js rather than reimplementing validation logic.

## What Could Be Improved

1. **Markdown-to-JS complexity cliff** — Stories 2.1–2.6 were pure markdown (LLM-driven design), then Stories 2.7–2.9 pivoted to JS modules with file I/O and test suites. The velocity and discipline requirements are very different between these two phases.

2. **Shared step file coordination is fragile** — Stories 2.2/2.3 both write to step-01-scope.md (Part 1 vs Parts 3-4). This worked due to Previous Story Intelligence but could break with parallel execution.

3. **Code review consistently catches real issues** — The 75% hit rate is encouraging for process validation, but indicates that spec surface area is large enough that dev-in-context reliably misses things only fresh-context adversarial review catches. Examples: test isolation (2.7), uncaught throws (2.8), magic numbers and path quoting (2.9).

4. **Deferred items accumulating** — Express Mode, D-Q6 (Registry Fragment Architecture), shared template externalization, validator.js Vortex hardcoding. None blocked Epic 2, but they represent growing debt.

## Key Insights

- The layered story design pattern (scaffold → populate → validate) scales to 9 stories without degradation when combined with Previous Story Intelligence
- Write Safety Protocol (Simple vs Full) is a reusable architectural pattern for any shared-file modification — not just registry
- Golden file testing provides confidence without brittle assertions — ideal for deterministic file generation
- Pre-existing infrastructure gaps surface naturally through end-to-end validation (VORTEX-REGRESSION correctly found Enhance module issue)
- Code review's value is in catching spec-reality misalignments, not formatting — justifies the investment for every story

## Previous Retro Follow-Through

Previous retrospective: tf-epic-1-retro-2026-03-24.md

| # | tf-epic-1 Action Item | Status | Evidence |
|---|----------------------|--------|----------|
| 1 | Maintain layered story design pattern | ✅ Completed | All 9 stories followed scaffold → populate → validate |
| 2 | Keep code review for all Epic 2 stories | ✅ Completed | Every story went through adversarial code review |
| 3 | Continue Previous Story Intelligence sections | ✅ Completed | All story files include context from prior story |

**Assessment:** Perfect follow-through. All 3 commitments maintained and their value confirmed across 9 stories.

## Action Items

| # | Action Item | Owner | Apply When |
|---|------------|-------|------------|
| 1 | Continue adversarial code review for all stories | SM/Dev | Every story completion |
| 2 | Maintain Previous Story Intelligence sections | SM | Story creation |
| 3 | Keep golden file testing pattern for new JS modules | Dev | Any new JS module |

## Technical Debt Tracked

| # | Debt Item | Priority | Notes |
|---|----------|----------|-------|
| 1 | D-Q6 (Registry Fragment Architecture) | Low | Still OPEN from Epic 1; no impact on Epic 3 |
| 2 | Express Mode (deferred from Story 2.5) | Low | Guided mode sufficient for current usage |
| 3 | validator.js hardcoded to Vortex paths | Medium | End-to-end validator works around it; long-term should be module-agnostic |
| 4 | Shared template externalization (P1/P6) | Low | BMB delegation covers the gap |

## Team Agreements

- Stories that modify existing files (read-modify-write) get Full Write Safety Protocol treatment
- Extension stories reuse existing step files where possible rather than creating new ones
- Test suites extend existing fixtures rather than duplicating

## Next Epic Readiness

- **tf-epic-3:** Extensions — Add Agent & Add Skill (2 stories)
- **Key dependency:** All Epic 2 JS modules and step files available for reuse
- **Core challenge:** Adapting write-only modules to read-modify-write (config, CSV, registry, spec file) — this falls within Epic 3 story scope, not a prerequisite
- **Preparation sprint needed:** No
- **Blockers:** None
- **Significant discoveries requiring epic updates:** None — tf-epic-3 plan is sound as-is
- **Concerns:** None — team is confident
