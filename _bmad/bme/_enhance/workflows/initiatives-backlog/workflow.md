---
workflow: initiatives-backlog
type: step-file
description: Tri-modal RICE initiatives backlog management — Triage review findings, Review existing items, or Create a new backlog from scratch
author: John PM (pm.md)
version: 1.0.0
---

# Initiatives Backlog Workflow

Manage a RICE-scored initiatives backlog through three complementary modes. This workflow transforms unstructured review findings, audit outputs, and team discussions into prioritized, scored backlog items — and keeps them calibrated over time.

## Workflow Structure

**Step-file architecture:**
- Just-in-time loading (each step loads only when needed)
- Sequential enforcement within each mode
- State tracking in frontmatter (progress preserved across sessions)
- Two-gate validation in Triage mode (extraction review, then scoring review)

## Modes Overview

### [T] Triage — Ingest Review Findings
Accepts text input (review transcripts, meeting notes, audit outputs), extracts actionable findings, proposes RICE scores with two-gate validation, and appends scored items to the existing backlog.
- **Steps:** Ingest > Extract & Gate 1 > Score & Gate 2 > Update backlog
- **When to use:** After a party-mode review, code review, retrospective, or any session that produces findings

### [R] Review — Rescore Existing Items
Loads the current backlog and walks through items for rescoring. Prevents score drift by prompting reassessment of Reach, Impact, Confidence, and Effort as project context evolves.
- **Steps:** Load backlog > Walkthrough & rescore > Update backlog
- **When to use:** Periodically (monthly or after major project milestones) to keep priorities calibrated

### [C] Create — Build New Backlog
Bootstraps a new RICE-scored backlog from scratch through guided interactive gathering and scoring.
- **Steps:** Initialize > Gather initiatives > Score > Generate prioritized view
- **When to use:** Starting a new project or creating a fresh backlog for a new domain

## Output

**Artifact:** `{planning_artifacts}/initiatives-backlog.md`
**Templates:** `templates/rice-scoring-guide.md`, `templates/backlog-format-spec.md`

---

## INITIALIZATION

Load config from `{project-root}/_bmad/bme/_enhance/config.yaml`

## MODE SELECTION

Display the following menu to the user:

---

**Initiatives Backlog — Select a Mode:**

- **[T] Triage** — Ingest review findings into scored backlog items
- **[R] Review** — Rescore existing backlog items to keep priorities calibrated
- **[C] Create** — Bootstrap a new RICE-scored backlog from scratch
- **[X] Exit** — Return to John PM agent menu

---

**ALWAYS halt and wait for user input after presenting the menu.**

### Menu Handling Logic:

- **IF T:** Load, read the entire file, and execute `{project-root}/_bmad/bme/_enhance/workflows/initiatives-backlog/steps-t/step-t-01-ingest.md`
- **IF R:** Load, read the entire file, and execute `{project-root}/_bmad/bme/_enhance/workflows/initiatives-backlog/steps-r/step-r-01-load.md`
- **IF C:** Display "**Coming soon** — Create mode will be available in a future update." then redisplay the Mode Selection menu above
- **IF X:** Display "Exiting Initiatives Backlog workflow." and end the workflow — return control to the John PM agent menu
- **IF any other input:** Display "Unknown option. Please select **T**, **R**, **C**, or **X**." then redisplay the Mode Selection menu above

### EXECUTION RULES:

- ALWAYS halt and wait for user input after presenting the menu
- Do NOT auto-select a mode — the user must explicitly choose (ADR-3)
- Modes run independently — do NOT switch modes mid-execution (ADR-4)
- After C (coming soon), redisplay this menu immediately
- After X, end the workflow completely

---

<!-- RETURN-TO-MENU CONVENTION (for step file authors):
     When the final step of any mode completes (e.g., step-t-04-update.md for Triage),
     it must instruct the LLM to re-load this entire workflow file:
     {project-root}/_bmad/bme/_enhance/workflows/initiatives-backlog/workflow.md
     This re-presents the INITIALIZATION section and Mode Selection menu,
     allowing the user to run another mode or exit (FR28). -->
