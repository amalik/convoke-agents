---
workflow: initiatives-backlog
type: step-file
description: Lane-aware initiative lifecycle backlog management — Triage intakes through the qualifying gate, review lane items, or bootstrap a new lifecycle backlog
author: John PM (pm.md)
version: 2.0.0
---

# Initiative Lifecycle Backlog Workflow

Manage the **Convoke Initiative Lifecycle & Backlog** — a three-lane (Bug / Fast / Initiative) model with a qualifying gate (Vortex, John, or Winston). Transforms unstructured findings into logged intakes, routes them through qualification, and keeps RICE scores calibrated across lanes over time.

## Workflow Structure

**Step-file architecture:**
- Just-in-time loading (each step loads only when needed)
- Sequential enforcement within each mode
- State tracking in frontmatter (progress preserved across sessions)
- Qualifying gate sub-flow in Triage + Create modes

## Modes Overview

### [T] Triage — Ingest → Intake → Qualify
Accepts text input (review transcripts, party mode outputs, audit findings, retro notes), extracts actionable findings, logs every finding as an **Intake** (§2.1), then offers the qualifying gate: for each intake, assign a **Lane** (Bug / Fast / Initiative), **Portfolio**, and **RICE** score.
- **Steps:** Ingest > Extract & log to Intakes > Qualify into lanes > Update backlog
- **When to use:** After any session that produces findings — code review, retrospective, party mode, user report

### [R] Review — Rescore Existing Items
Loads the current backlog, lets you pick which lane(s) to walk (Bug / Fast / Initiative / All), then walks items one at a time for RICE rescoring. Prevents score drift as project context evolves.
- **Steps:** Load & choose lanes > Walkthrough & rescore > Update backlog
- **When to use:** Periodically (monthly, after major milestones, or when an epic completes and changes adjacent effort)

### [C] Create — Bootstrap New Lifecycle Backlog
Generates a new lifecycle backlog file from scratch: Part 1 (canonical lifecycle process) verbatim from template + empty Part 2 lanes. Optionally gather initial intakes and run the qualifying gate on them.
- **Steps:** Initialize & guard overwrite > Gather intakes (optional) > Qualify (optional) > Generate file
- **When to use:** Starting a new project or creating a fresh backlog for a new domain. Existing Convoke backlog was bootstrapped on 2026-04-12.

## Output

**Artifact:** `{planning_artifacts}/convoke-note-initiative-lifecycle-backlog.md`
**Templates:**
- `templates/backlog-format-spec.md` — canonical file structure and table formats
- `templates/lifecycle-process-spec.md` — canonical Part 1 content (Create mode only)
- `templates/rice-scoring-guide.md` — RICE factor definitions and calibration examples

---

## INITIALIZATION

Load config from `{project-root}/_bmad/bme/_enhance/config.yaml`

## MODE SELECTION

Display the following menu to the user:

---

**Initiative Lifecycle Backlog — Select a Mode:**

- **[T] Triage** — Ingest findings → log as intakes → route through qualifying gate into lanes
- **[R] Review** — Walk a lane and rescore items to keep RICE calibrated
- **[C] Create** — Bootstrap a new lifecycle backlog from scratch
- **[X] Exit** — Return to John PM agent menu

---

**ALWAYS halt and wait for user input after presenting the menu.**

### Menu Handling Logic:

- **IF T:** Load, read the entire file, and execute `{project-root}/_bmad/bme/_enhance/workflows/initiatives-backlog/steps-t/step-t-01-ingest.md`
- **IF R:** Load, read the entire file, and execute `{project-root}/_bmad/bme/_enhance/workflows/initiatives-backlog/steps-r/step-r-01-load.md`
- **IF C:** Load, read the entire file, and execute `{project-root}/_bmad/bme/_enhance/workflows/initiatives-backlog/steps-c/step-c-01-init.md`
- **IF X:** Display "Exiting Initiative Lifecycle Backlog workflow." and end the workflow — return control to the John PM agent menu
- **IF any other input:** Display "Unknown option. Please select **T**, **R**, **C**, or **X**." then redisplay the Mode Selection menu above

### EXECUTION RULES:

- ALWAYS halt and wait for user input after presenting the menu
- Do NOT auto-select a mode — the user must explicitly choose
- Modes run independently — do NOT switch modes mid-execution
- After X, end the workflow completely

---

## Qualifying Gate Reference

The **qualifying gate** is the decision point in Triage and Create modes where intakes become lane items. Only three qualifiers can invoke it:

1. **Vortex team** — through discovery (full 7-stream or partial)
2. **John (PM)** — product framing shortcut (this agent)
3. **Winston (Architect)** — technical framing shortcut

The qualifier assigns:
- **Lane:** Bug / Fast / Initiative (per §1.3 of lifecycle-process-spec.md)
- **Portfolio:** convoke, vortex, gyre, forge, bmm, enhance, loom, helm — or new (John+Winston decision)
- **RICE:** Reach × Impact × Confidence / Effort (per rice-scoring-guide.md)

**Default lane when uncertain:** Fast Lane. Can be promoted later if scope grows.

**Intakes stay logged even after qualification.** §2.1 is the audit trail — never deleted.
