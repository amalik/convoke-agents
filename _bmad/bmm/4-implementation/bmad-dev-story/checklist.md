---
title: 'Enhanced Dev Story Definition of Done Checklist'
validation-target: 'Story markdown ({{story_path}})'
validation-criticality: 'HIGHEST'
required-inputs:
  - 'Story markdown file with enhanced Dev Notes containing comprehensive implementation context'
  - 'Completed Tasks/Subtasks section with all items marked [x]'
  - 'Updated File List section with all changed files'
  - 'Updated Dev Agent Record with implementation notes'
optional-inputs:
  - 'Test results output'
  - 'CI logs'
  - 'Linting reports'
validation-rules:
  - 'Only permitted story sections modified: Tasks/Subtasks checkboxes, Dev Agent Record, File List, Change Log, Status'
  - 'All implementation requirements from story Dev Notes must be satisfied'
  - 'Definition of Done checklist must pass completely'
  - 'Enhanced story context must contain sufficient technical guidance'
---

# 🎯 Enhanced Definition of Done Checklist

**Critical validation:** Story is truly ready for review only when ALL items below are satisfied

## 📋 Context & Requirements Validation

- [ ] **Story Context Completeness:** Dev Notes contains ALL necessary technical requirements, architecture patterns, and implementation guidance
- [ ] **Architecture Compliance:** Implementation follows all architectural requirements specified in Dev Notes
- [ ] **Technical Specifications:** All technical specifications (libraries, frameworks, versions) from Dev Notes are implemented correctly
- [ ] **Previous Story Learnings:** Previous story insights incorporated (if applicable) and build upon appropriately

## ✅ Implementation Completion

- [ ] **All Tasks Complete:** Every task and subtask marked complete with [x]
- [ ] **Acceptance Criteria Satisfaction:** Implementation satisfies EVERY Acceptance Criterion in the story
- [ ] **No Ambiguous Implementation:** Clear, unambiguous implementation that meets story requirements
- [ ] **Edge Cases Handled:** Error conditions and edge cases appropriately addressed
- [ ] **Dependencies Within Scope:** Only uses dependencies specified in story or project-context.md

## 🧪 Testing & Quality Assurance

- [ ] **Unit Tests:** Unit tests added/updated for ALL core functionality introduced/changed by this story
- [ ] **Integration Tests:** Integration tests added/updated for component interactions when story requirements demand them
- [ ] **End-to-End Tests:** End-to-end tests created for critical user flows when story requirements specify them
- [ ] **Test Coverage:** Tests cover acceptance criteria and edge cases from story Dev Notes
- [ ] **Phantom Test Guard:** If this story added new test files OR new test functions, the runtime test count reported by the project's test runner (e.g. `npm test`) increased by at least the number of test functions added. **Files existing on disk is NOT sufficient.** Verify by running the test command and reading the summary line (e.g. `ℹ tests N pass N fail 0`). See [phantom test risk](../../../_bmad-output/test-artifacts/2026-04-08-astonishment-report.md) — this guard exists because AI agents have produced test files that were structurally invisible to the runner (Jest API in a `node:test` project, missing imports, files not matched by any glob in `package.json`, etc.).
- [ ] **Test Wiring Verified:** Any new test file path is matched by at least one npm script glob in `package.json` (or equivalent project test config). A test that the project's test command does not invoke is a phantom test, regardless of how complete it looks.
- [ ] **Regression Prevention:** ALL existing tests pass (no regressions introduced)
- [ ] **Code Quality:** Linting and static checks pass when configured in project
- [ ] **Test Framework Compliance:** Tests use project's testing frameworks and patterns from Dev Notes

## 📝 Documentation & Tracking

- [ ] **File List Complete:** File List includes EVERY new, modified, or deleted file (paths relative to repo root)
- [ ] **Dev Agent Record Updated:** Contains relevant Implementation Notes and/or Debug Log for this work
- [ ] **Change Log Updated:** Change Log includes clear summary of what changed and why
- [ ] **Review Follow-ups:** All review follow-up tasks (marked [AI-Review]) completed and corresponding review items marked resolved (if applicable)
- [ ] **Story Structure Compliance:** Only permitted sections of story file were modified

## 🔚 Final Status Verification

- [ ] **Story Status Updated:** Story Status set to "review"
- [ ] **Sprint Status Updated:** Sprint status updated to "review" (when sprint tracking is used)
- [ ] **Quality Gates Passed:** All quality checks and validations completed successfully
- [ ] **No HALT Conditions:** No blocking issues or incomplete work remaining
- [ ] **User Communication Ready:** Implementation summary prepared for user review

## 🎯 Final Validation Output

```
Definition of Done: {{PASS/FAIL}}

✅ **Story Ready for Review:** {{story_key}}
📊 **Completion Score:** {{completed_items}}/{{total_items}} items passed
🔍 **Quality Gates:** {{quality_gates_status}}
📋 **Test Results:** {{test_results_summary}}
📝 **Documentation:** {{documentation_status}}
```

**If FAIL:** List specific failures and required actions before story can be marked Ready for Review

**If PASS:** Story is fully ready for code review and production consideration
