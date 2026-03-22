# Post-Release Review

**Purpose:** Structured checklist for evaluating release quality after deployment. Compare reported issues against existing test coverage to identify validation gaps and strengthen future testing.

**When to use:** Conduct this review 7 days after a release (per the release quality gate: "Zero bugs the test suite should have caught").

**How to use:** Copy the sections below into a new file for each release review. Fill in the release information, document each reported issue, analyze gaps, and produce actionable improvements.

---

## Release Information

- **Version:**
- **Release date:**
- **Review date:**
- **Reviewer:**

---

## Reported Issues

For each issue reported after release, add a row. Leave this section empty if no issues were reported.

| # | Issue description | Severity | Test coverage status | Which test should have caught it | Why the gap exists |
|---|-------------------|----------|---------------------|----------------------------------|-------------------|
| 1 | | High / Medium / Low | Covered / Gap | | |

---

## Validation Gap Analysis

Group any gaps from the table above by test type. Skip categories with no gaps.

**Unit test gaps:**
-

**Integration test gaps:**
-

**Content correctness gaps:**
-

**CI pipeline (automated checks) gaps:**
-

---

## Actionable Improvements

For each gap identified above, describe a concrete test to add. Each entry should be specific enough that a developer can implement it without further clarification.

| Gap | Concrete test to add | Target phase |
|-----|---------------------|--------------|
| | | |

---

## Review Outcome

- **Total issues reported:**
- **Issues that existing tests should have caught:**
- **Quality gate result:** Pass (zero test gaps) / Fail (gaps found)
- **Summary:**

---

## Example Entry (Phase 2 reference)

This example demonstrates how to use the template with a real finding from Phase 2.

**Release Information:** v1.6.0, released 2026-02-26, reviewed 2026-03-02

| # | Issue description | Severity | Test coverage status | Which test should have caught it | Why the gap exists |
|---|-------------------|----------|---------------------|----------------------------------|-------------------|
| 1 | BMAD-METHOD-COMPATIBILITY.md frozen at v1.0.4-alpha — architecture diagram listed only Emma and Wade with deprecated IDs, referenced abandoned agents (Sage, Stan), used wrong module path (_designos instead of _vortex) | Medium | Gap | The docs audit tool checks for stale numeric references and broken links, but does not check structural diagrams or directory tree listings for completeness | The audit tool pattern-matches digits and words for agent/workflow counts but cannot parse ASCII diagrams or verify agent enumeration completeness in prose |

**Validation Gap Analysis:**

- **Content correctness gaps:** Docs audit tool does not verify agent enumeration completeness in directory trees or architecture diagrams

**Actionable Improvements:**

| Gap | Concrete test to add | Target phase |
|-----|---------------------|--------------|
| Structural diagram staleness | Add a manual review checklist item for architecture diagrams and directory tree listings — verify they enumerate all registered agents | Phase 3 |
