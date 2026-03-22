# Scope-Adjacent Improvements Backlog

**Purpose:** Capture improvements discovered during Phase 2 work that fall outside the current story's scope. This preserves good ideas for future consideration without interrupting deliverable progress.

**How to use:** When you discover something worth improving while working on a Phase 2 story — but it's not part of your current deliverable — add an entry below using the convention format.

**When NOT to use this backlog:** If the improvement is required to complete your current Phase 2 deliverable, pull it into the current story or epic instead of deferring it here. This backlog is for ideas that can wait, not for blockers.

---

## Convention

Add a new `###` section for each entry with these four fields:

- **Discovered during:** Which story or epic triggered the discovery
- **Description:** What the improvement is and why it matters
- **Estimated impact:** High, Medium, or Low — with a brief reason
- **Suggested priority:** When to address it (Phase 2.5, Phase 3, or Nice-to-have)

---

## Entries

### Expand documentation audit tool to catch content patterns needing manual review

- **Discovered during:** Phase 2 Epic 1, Story 1.3 — forward-compatibility and extension guidance
- **Description:** The audit tool catches broken links and stale references automatically, but four content patterns still require manual review: outdated agent counts embedded in prose, internal naming conventions leaking into user-facing text, incomplete agent lists in tables, and tense inconsistencies. Automating these checks would reduce manual review effort for future documentation passes.
- **Estimated impact:** Medium — would catch issues earlier and reduce review cycles, but requires more sophisticated text analysis
- **Suggested priority:** Phase 3

### Complete placeholder content in three experimentation workflows

- **Discovered during:** Phase 2 Epic 2, Story 2.3 — Wade activation and workflow tests
- **Description:** Three of Wade's experimentation workflows (lean-experiment, proof-of-concept, proof-of-value) contain placeholder steps with incomplete guidance. The structural framework is sound, but the step-by-step content lacks the cross-references and synthesis instructions that make other workflows self-contained for users.
- **Estimated impact:** Medium — affects content completeness for users following these specific workflows, though the primary workflows are fully functional
- **Suggested priority:** Phase 2.5

### Reduce narrative overlap in the seven-agent journey example

- **Discovered during:** Phase 2 Epic 4, Story 4.3 — journey quality verification and editorial review
- **Description:** The journey example contains approximately 950-1,100 words of overlap between the narrative paragraphs and the transition notes. Some repetition is intentional (serving readers who read sequentially vs. those who skip to specific sections), but the overlap grew unchecked and could be trimmed without losing clarity for either reading style.
- **Estimated impact:** Medium — improves readability and makes the journey example more concise, though the current version is functional
- **Suggested priority:** Nice-to-have

### Preserve user-customized agents when running the update command

- **Discovered during:** Phase 2 Epic 5, Story 5.1 — CLI update script test coverage
- **Description:** When a user adds custom agents to their installation and then runs the update command, the settings update process does not preserve those user-added agents. Two tests document this gap. Users who extend the agent roster and then update would lose their customizations.
- **Estimated impact:** Low — affects only users who both customize agents and run updates, which is an uncommon workflow during early adoption
- **Suggested priority:** Phase 3
