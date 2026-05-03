---
initiative: convoke
artifact_type: epic
created: 2026-05-03T00:00:00.000Z
schema_version: 1
status: active
inputDocuments:
  - _bmad-output/implementation-artifacts/sprint-status.yaml
  - _bmad-output/planning-artifacts/convoke-epic-bmad-v63-source-format-adoption.md
  - tests/p0/p0-activation.test.js
  - tests/p0/helpers.js
  - _bmad/bme/_vortex/agents/contextualization-expert/SKILL.md
---

# Epic i97-bug-1 — I97 Conversion-Discovery Hotfixes

## Overview

Single-story mini-epic for hotfixes that surface during the I97 BMAD v6.3+ source format adoption stream but cannot wait for I97 Epic 3 (CI Gate Productionization) — typically because they unblock CI red on already-shipped conversions. Mini-epic following [`convoke-epic-lint-cleanup-dod-gate.md`](convoke-epic-lint-cleanup-dod-gate.md) + [`convoke-epic-restore-coverage-green-ci.md`](convoke-epic-restore-coverage-green-ci.md) precedent (cross-cutting, incident-driven, retrospective optional).

This epic exists because the I97 conversion stream (v5 XML-in-markdown → v6.3 outcome-based markdown) periodically discovers contract assumptions that pre-date the conversion and need to be updated forward. Rather than re-opening shipped conversion stories or blocking active Epic 2 work, hotfixes land here as narrowly-scoped fast-follows with explicit cross-references to the I97 epic.

**Source documents:**
- [convoke-epic-bmad-v63-source-format-adoption.md](convoke-epic-bmad-v63-source-format-adoption.md) §Epic 3 (Story 3.1 CI Infrastructure Spike) — the long-term home for the work this epic ships early.
- [GitHub Actions run #25282010960](https://github.com/amalik/convoke-agents/actions/runs/25282010960) — `coverage` job log lines 5028–5210+ document the P0 activation failures discovered during cov-1.1 work.
- [tests/p0/p0-activation.test.js](../../tests/p0/p0-activation.test.js) + [tests/p0/helpers.js](../../tests/p0/helpers.js) — the P0 contract that needs format-aware updating.
- [_bmad/bme/_vortex/agents/contextualization-expert/SKILL.md](../../_bmad/bme/_vortex/agents/contextualization-expert/SKILL.md) — exemplar v6.3 outcome-based markdown structure (Emma; shipped via I97 Story 2.1 2026-05-02).

**Why now:** Each I97 Epic 2 conversion (Emma ✓, Wade ✓, Mila in-progress, Isla/Noah/Max/Liam queued) makes another agent fail P0 activation tests. The `coverage` job in GitHub Actions remains red until the P0 contract is format-aware. Waiting for I97 Epic 3 (currently `backlog` behind Epic 2) would mean every Epic 2 story ships with known P0 failures — accumulating CI-red debt across 5 more conversions.

**Stakeholder:** I97 dev agent picking up the next Vortex conversion (currently Mila); operator (Amalik) maintaining green CI as the sprint signal; Convoke 4.0 release readiness (cov-1.1 closed the c8 gate but the coverage job's overall exit-0 outcome depends on this epic shipping).

## Requirements Inventory

Epic i97-bug-1 has no formal PRD — it ships forward-going contract updates discovered at conversion time. The FRs below restate the AC scope from each constituent story.

### Functional Requirements

FR1: [tests/p0/p0-activation.test.js](../../tests/p0/p0-activation.test.js) and [tests/p0/helpers.js](../../tests/p0/helpers.js) MUST be **format-aware** — discriminating between v5 XML-in-markdown agents (Isla, Noah, Max, Liam at epic-creation time) and v6.3 outcome-based markdown agents (Emma, Wade at epic-creation time; Mila in-flight). The format-discriminator MUST be mechanical (e.g., presence/absence of `<agent ...>` XML opening tag in the file body). *(Source: i97-bug-1 AC1 — see story file)*

FR2: All P0 activation assertions MUST pass for **every registered agent** (mixed v5 + v6.3 cohort) post-fix. The test suite MUST NOT weaken its semantic contract — each agent must satisfy the equivalent activation invariants for its declared format (frontmatter completeness, identity/communication-style/principles presence, ≥5 capabilities, ≥7 activation steps, step-2 error-handling compliance). *(Source: i97-bug-1 AC1)*

FR3: This epic MUST NOT modify any v6.3-converted agent file (e.g., [_bmad/bme/_vortex/agents/contextualization-expert/SKILL.md](../../_bmad/bme/_vortex/agents/contextualization-expert/SKILL.md)) to add v5-XML constructs back. The fix lives in the test-contract layer; v6.3 agents are correct as shipped per I97 Story 2.1 + 2.2. *(Source: i97-bug-1 AC2 — preserve I97 conversion integrity)*

FR4: This epic MUST NOT modify any v5 agent file (e.g., Isla / Noah / Max / Liam at epic-creation time). The format-aware test continues to apply v5-XML assertions to v5 agents until they are migrated. *(Source: i97-bug-1 AC3 — preserve un-converted agent shipping path)*

FR5: After this epic ships, the GitHub Actions `coverage` job for the next push to main MUST exit 0 — finally satisfying the original AC1 of cov-1.1 (whose scope-isolation clause explicitly named `i97-bug-1` as the parallel work that closes the second cause). *(Source: cov-1-1 AC1 amended scope-isolation clause)*

FR6: This epic MUST NOT pull I97 Epic 3 forward in plan. Epic 3 (Story 3.1 CI Infrastructure Spike + Story 3.2 Productionize Parity/Covenant Gates + Story 3.3 Productionize Reference Integrity Gate) retains its scope and sequencing-after-Epic-2 plan. The P0 contract update is recognized as a sliver of what 3.1 would have surfaced; cross-references in the I97 epic file note the early-ship absorption. *(Source: project_v63_adoption.md memory + operator option γ choice 2026-05-03)*

### Non-Functional Requirements

NFR1: Behavior-preserving for production code paths. No agent runtime behavior changes; no migration script changes; no `convoke-*.js` CLI changes. Pure test-contract layer fix.

NFR2: Full CI matrix MUST exit 0 (`lint` + `test (18|20|22)` + `python-test` + `coverage` + `security` + `package-check`) before story is marked `review`. The `coverage` job exit-0 is the headline outcome.

NFR3: Stories MUST be code-reviewed adversarially using `bmad-code-review`. Round 1 mandatory; Rounds 2/3 follow `code-review-convergence` bounds + `feedback_avoid_overcomplicating_audits` (V-pass+R1 only by default).

NFR4: Scope discipline — any test-contract gap not in the story's AC table at implementation time MUST be logged as a deferred backlog item. The known parity / covenant / reference-integrity gates are EXPLICITLY out of scope (they're I97 Epic 3 territory).

### Additional Requirements (from existing project-context.md)

- **`code-review-convergence`:** This epic does NOT reopen any shipped conversion (Emma 2.1, Wade 2.2). The P0 contract gap is a forward-going test-layer remediation per the same convergence rule that lint-1.1 used to ship without re-opening v63-1a-2.
- **`namespace-decision-for-new-skills`:** N/A — no new skills, workflows, or agents under `_bmad/bme/`. Test-layer changes only at [tests/p0/](../../tests/p0/).
- **`covenant-compliance-for-convoke-skills`:** N/A — no `_bmad/bme/` content modified.
- **`path-safety-for-destructive-ops`:** N/A — test-file edits only; no scripts that accept user paths or perform destructive operations.
- **`derive-counts-from-source`:** P0 test counts (≥5 capabilities, ≥7 activation steps) are mechanical thresholds and MUST NOT be hardcoded against specific agents — they apply per-agent uniformly across both formats.
- **`spec-verify-referenced-files`:** Verified 2026-05-03 — tests/p0/p0-activation.test.js, tests/p0/helpers.js, all 7 agent SKILL.md files exist in working tree at epic-authoring time.
- **`lint-passes-before-review`:** `npm run lint` must exit 0 with zero new warnings in modified files before `review`.

## Stories

| ID | Title | Status | Notes |
|---|---|---|---|
| i97-bug-1 | Update P0 activation test contract to be format-aware (v5 XML + v6.3 markdown) | ready-for-dev | Single story; covers FR1–FR6. See [story file](../implementation-artifacts/i97-bug-1-fix-p0-activation-defects.md) |

## Convergence & Sequencing

- **Pre-conditions:** [cov-1.1](../implementation-artifacts/cov-1-1-close-functions-coverage-gap.md) shipped (✓ done 2026-05-03). The c8 gate must already be passing before this epic's CI verification step is meaningful.
- **Parallel with:** [i97-2-3 Mila conversion](../implementation-artifacts/i97-2-3-convert-mila-research-convergence-specialist.md) (currently `in-progress`). Coordination note in story AC4 — Mila's conversion ships independently; this epic's test-contract update applies retroactively the moment her SKILL.md lands.
- **Cross-reference:** [I97 Epic 3 Story 3.1 (CI Infrastructure Spike)](convoke-epic-bmad-v63-source-format-adoption.md#story-31-ci-infrastructure-spike) is the long-term home of CI gate work. Per operator option γ (2026-05-03), Story 3.1's narrative is amended at this epic's ship to note "P0 activation contract sliver absorbed early via i97-bug-1 — Story 3.1 retains its full parity/covenant/reference-integrity gating scope".
- **Retrospective:** Optional (single-story mini-epic).

## Out of Scope (for this epic, future-candidates for backlog)

- **CI gate productionization beyond P0 activation.** Parity-harness gating, covenant-survival gating, reference-integrity gating — all I97 Epic 3 territory.
- **Personality preservation rubric assertions in P0.** The vortex-parity test suite already covers personality preservation via the calibration baselines from I97 Story 2.1; not duplicated here.
- **v6.3 agent file completeness audit.** Each I97 Epic 2 conversion ships under its own ACs; this epic does not re-litigate already-shipped conversions.
- **Per-agent contract manifest** (Path 2 in story AC). Over-engineering for current state; logged as backlog candidate if future-format-stability proves elusive.
