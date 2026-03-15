---
stepsCompleted: [step-01-init, step-02-discovery, step-02b-vision, step-02c-executive-summary, step-03-success, step-04-journeys, step-05-domain-skipped, step-06-innovation, step-07-project-type, step-08-scoping, step-09-functional, step-10-nonfunctional, step-11-polish]
inputDocuments:
  - _bmad-output/planning-artifacts/P4-enhance-module-architecture.md
  - _bmad-output/planning-artifacts/initiatives-backlog.md
workflowType: 'prd'
documentCounts:
  briefs: 0
  research: 0
  projectDocs: 2
classification:
  projectType: "Content Platform + Workflow System"
  domain: "Product Discovery / Innovation Methodology"
  complexity: "medium (v1 scope), with architectural note that the Enhance pattern establishes cross-module extension precedent"
  projectContext: brownfield
elicitation:
  methods_applied: [architecture-decision-records, stakeholder-round-table, first-principles-analysis, 5-whys-deep-dive]
  core_framing: "Closing the review-to-backlog feedback loop"
  success_metric: "80% reduction in time-to-backlog-update (currently 20-40 minutes manual)"
  incubation_angle: "Prove the Enhance pattern in Convoke, then propose upstream to BMAD core as dynamic extensions tag"
  adrs:
    - "ADR-1: Single install via convoke-install-vortex — no new CLI command"
    - "ADR-2: Verify workflow entry point in installer — additive-only patch, fail-fast on missing"
    - "ADR-3: Explicit user menu for mode selection (T/R/C) — no auto-detection"
    - "ADR-4: No mode switching — modes run independently, backlog file is shared state"
    - "ADR-5: Shared RICE scoring guide as reference doc in templates/"
  stakeholder_concerns:
    - "John PM: Triage mode is the highest-value deliverable"
    - "Winston: Cross-module coupling boundaries and failure isolation"
    - "Morgan: Installation path and package distribution for _enhance/"
    - "Wendy: Tri-modal workflow complexity and shared state"
    - "Emma: RICE scoring must feel like strategic conversation, not calculator"
    - "Max: Input format flexibility for diverse review transcript types"
  first_principles: "Core deliverable is RICE backlog workflow for John PM. The _enhance/ structure is an architectural investment. Option C chosen — full v1 with pattern establishment."
  vision:
    statement: "Convoke's Enhance module makes existing BMAD agents more capable. First enhancement — RICE backlog management for John PM — closes the feedback loop between review sessions and strategic prioritization."
    differentiator: "Going from chaos (a review transcript) to clarity (a scored, prioritized list) in one step. Not a new tool — a capability upgrade to an agent you already use."
    core_insight: "The bottleneck isn't generating findings, it's turning findings into prioritized action."
    interaction_model: "Agent proposes, human validates. Batch validation — John extracts all, scores all, presents in one shot, user validates in one pass."
    proof_of_concept_bar: "Zero lost findings + calibrated scoring = success"
  party_mode_refinements:
    - "Batch over individual — one interaction per phase, not one per finding"
    - "Success metric reframed to 80% reduction rather than absolute minutes"
    - "Deprecation question acknowledged but deferred to post-v1"
---

# Product Requirements Document - Convoke P4: Enhance Module

**Author:** Amalik
**Date:** 2026-03-14

## Executive Summary

Convoke P4 introduces the Enhance module (`_bmad/bme/_enhance/`) — a new submodule that upgrades existing BMAD agents with capabilities they don't have today. While Vortex adds new agent teams, Enhance makes agents you already use more powerful. The first enhancement is a RICE Initiatives Backlog workflow for John PM, closing the feedback loop between review sessions and strategic prioritization.

Today, after every multi-agent review cycle (party mode, adversarial review, retrospective), findings must be manually extracted, RICE-scored, and formatted into the initiatives backlog. This takes an estimated 20-40 minutes, produces inconsistent scoring, and risks losing findings. P4 automates this: John PM ingests a review transcript, extracts all findings, proposes RICE scores in batch, and presents them for human validation in a single pass. Agent proposes, human validates.

The workflow is tri-modal — Triage (ingest review findings), Review (rescore existing backlog), Create (build backlog from scratch) — with Triage as the critical path. All three modes reference a shared RICE scoring guide template for consistent calibration and write to the same backlog file. The workflow attaches to John PM via a single `<item>` tag added to `pm.md` — if removed, John works exactly as before. The Enhance module ships via the existing `convoke-install-vortex` installer with no new CLI commands.

P4 is deliberately scoped as Option C (full pattern establishment) rather than a minimal workflow addition, because the Enhance pattern — one module upgrading another module's agent — is the architectural proof-of-concept for a proposed BMAD core `<extensions>` mechanism. The v1 investment in directory structure, config, guide, and extension documentation serves that upstream goal. If the pattern proves valuable, it becomes the basis for declarative agent extensibility across the BMAD ecosystem.

**v1 scope:** Workflow content (11 step files, 3 modes), installer integration, menu patch, skill wrapper, workflow-manifest registration, skill-manifest registration, config, and guide. **Deferred:** BMAD external module registration, dynamic extensions mechanism, individual initiative files.

### What Makes This Special

The differentiation moment: a user finishes a 16-agent party mode session with pages of findings, tells John to triage them, and sees every finding extracted, scored, and formatted in one shot. Chaos to clarity in one step — with zero lost findings and calibrated scoring as the measurable proof. Not a new tool to learn — a capability upgrade to an agent they already trust.

Success metric: 80% reduction in time-to-backlog-update.

## Project Classification

- **Project Type:** Content Platform + Workflow System — the deliverable is markdown workflow step files and YAML config, shipped via npm
- **Domain:** Product Discovery / Innovation Methodology
- **Complexity:** Medium (v1 scope). Architectural note: this establishes the cross-module extension pattern — one module modifying another module's agent menu — which has higher complexity implications for future versions
- **Project Context:** Brownfield — extending Convoke v2.2.0, adding second submodule alongside Vortex

## Success Criteria

### User Success

- **Triage completes without lost actionable findings** — every actionable item (proposes a change, identifies a gap, or flags a risk) in a review transcript appears in the proposed batch. Observations and commentary excluded unless user escalates during validation.
- **Scoring requires minimal correction** — user accepts 80%+ of proposed RICE scores without modification. Guard: no more than 3 items with identical scores in the top 10 of the prioritized view.
- **Backlog update is fast** — under 10 minutes for a 12-finding transcript (baseline: estimated 20-40 minutes manual).

### Business Success

- **The Enhance pattern works** — one module successfully extends another module's agent without breakage, coupling issues, or user confusion. Ready for upstream proposal to BMAD core as `<extensions>` mechanism.
- **Convoke positioning expands** — Enhance establishes Convoke as "Vortex + upgrades to existing agents," not just "Vortex."

### Technical Success

- **Zero test regressions** — existing John PM test suite passes unchanged after menu patch applied.
- **Installer integration clean** — `convoke-install-vortex` installs Enhance files alongside Vortex. `verifyInstallation()` confirms workflow entry point exists.
- **Idempotent** — running the installer twice produces identical results.
- **Update-resilient** — BMAD upstream updates to `pm.md` do not break the Enhance workflow (the `exec` path is stable).

### Measurable Outcomes

| Metric | Target | How Measured |
|--------|--------|-------------|
| Actionable findings extraction | 100% | Compare transcript findings to proposed batch |
| Score acceptance rate | 80%+ without modification | Count approved vs. adjusted scores |
| Score distribution health | No more than 3 identical scores in top 10 | Inspect prioritized view |
| Time-to-backlog-update | Under 10 min (12-finding transcript) | Stopwatch on real session |
| Installer success | Pass on first run | `verifyInstallation()` all checks green |
| Test regression | Zero failures | Existing PM test suite |
| Idempotency | Zero diff on second run | `git diff` on installer-managed files after second run |
| Update resilience | Patch survives BMAD update | `verifyInstallation()` passes after `pm.md` upstream update |

## Product Scope

### MVP — Minimum Viable Product

- **Triage mode** (4 step files) — ingest review transcript, extract actionable findings, propose RICE scores in batch, update backlog with user approval
- **Review mode** (3 step files) — load existing backlog, walk through items for rescoring, regenerate prioritized view
- **Create mode** (4 step files) — initialize new backlog, gather initiatives, score, generate prioritized view
- **Workflow entry point** — mode selection menu (T/R/C), shared RICE scoring guide template
- **Installer integration** — section 8 in `refreshInstallation()`, verification check, `package.json` files array. **Highest-risk MVP item** — only part that touches existing codebase.
- **Menu patch** — single `<item>` tag added to John PM's `pm.md`
- **Directory structure** — `_bmad/bme/_enhance/` with config.yaml, extensions/, workflows/, guides/, templates/
- **Lean guide** — half-page `ENHANCE-GUIDE.md` (30-minute writing budget). Audience: end users + future module authors.

### Growth Features (Post-MVP)

- **Individual initiative files** (v2) — per-item markdown files with RICE frontmatter, auto-generated summary view
- **Cross-agent routing** — "next actions by agent" section in backlog output
- **Additional enhancement workflows** — second and third workflows for other BMAD agents (candidates TBD based on usage)

### Vision (Future)

- **Dynamic `<extensions>` tag** (v3) — proposed BMAD core mechanism for declarative agent extensibility
- **Enhance ecosystem** — multiple modules contributing enhancements to shared agents
- **BMAD external module registration** — Convoke listed in `external-official-modules.yaml`

### Strategic Reassessment

Pattern establishment requirements (config.yaml extensibility, guide documentation, validation checks) are strategic investments. If no second enhancement is added within 6 months, reassess whether the Enhance module should be simplified to a single-workflow integration.

### Architecture Constraints (from ADRs)

- **ADR-1:** Single install via `convoke-install-vortex` — no new CLI command
- **ADR-2:** Verify workflow entry point in installer — additive-only patch (`<item>` tag removable, John works without it), fail-fast on missing files
- **ADR-3:** Explicit user menu for mode selection (T/R/C) — no auto-detection
- **ADR-4:** No mode switching — modes run independently, backlog file is shared state
- **ADR-5:** Shared RICE scoring guide as reference document in templates/

## User Journeys

### Journey 1: Product Owner — Triage After Review (Happy Path)

**Amalik** just wrapped a 45-minute adversarial review of the Vortex handoff contracts. The transcript is 3 pages — a mix of sharp findings, tangential observations, and a few "nice to have" suggestions buried in the noise. Normally, he'd copy-paste findings into the backlog, wrestle with RICE scores for each one, and try to slot them into the prioritized view. It takes 30 minutes and the scoring is inconsistent.

**Opening Scene:** Amalik closes the review session. He invokes `/bmad-pm`, John PM loads, and Amalik tells him to triage the review. He pastes the transcript — raw, unformatted, as-is.

**Rising Action:** John parses the transcript and extracts 9 actionable findings, discarding 4 observations and 2 compliments. He presents the extraction batch first: "Here are the 9 findings I pulled. Review them before we score — did I miss anything? Should any be removed?" He also flags 2 potential overlaps: "Finding #3 looks similar to existing item P2 in the backlog, and finding #7 may overlap with D5. For each: merge into existing, skip, or add as new?" Amalik confirms 8 findings, flags 1 as noise, adds 1 John missed, merges finding #3 into P2, and keeps #7 as a separate item.

Then John proposes RICE scores for all 9 confirmed findings in batch. The scoring questions feel like a strategic conversation — "This one scores high on Reach because it affects all 7 Vortex agents — does that match your sense of blast radius?"

**Climax:** Amalik scans the 9 score proposals. He adjusts 1 (Confidence was too high on a speculative item), accepts the other 8 as-is. One pass. Done.

**Resolution:** John appends 8 new items and updates 1 existing item (P2 merge) in the initiatives backlog with provenance tags ("Added from adversarial review, 2026-03-14"), regenerates the prioritized view, and the changelog entry reads today's date. Amalik sees the new items ranked against existing work. Total time: 7 minutes.

### Journey 2: Product Owner — Triage from Non-BMAD Source

**Amalik** took notes during a planning call about Convoke's positioning. The notes are in a markdown file — bullet points, half-sentences, a few questions. Not a BMAD review transcript at all.

**Opening Scene:** Amalik invokes `/bmad-pm`, John PM loads, and Amalik tells him to triage his planning notes. He pastes the markdown.

**Rising Action:** John parses the unstructured input and presents his extraction: 5 actionable items (feature ideas, a gap to address, a risk to mitigate) and 3 ambiguous items flagged separately — "These look like questions rather than findings. Should I treat them as exploration candidates or skip them?" He also checks for overlaps against the existing backlog — none found. Amalik reviews the extraction, confirms all 5 actionable items, and says "exploration candidates for 2 of the ambiguous ones, skip the third."

John then scores the 7 items (5 actionable + 2 exploration candidates) in batch, presenting them with adjusted categories.

**Climax:** Amalik validates all 7 scores in one pass.

**Resolution:** 7 items added to the backlog with provenance ("Added from planning call notes, 2026-03-14"). The format flexibility means John works with whatever input Amalik has — not just BMAD transcripts.

### Journey 3: Product Owner — Zero Actionable Findings (Edge Case)

**Amalik** runs a code review on a well-built feature. The transcript is mostly confirmations and minor style preferences — nothing actionable.

**Opening Scene:** Amalik invokes `/bmad-pm`, John PM loads, and Amalik tells him to triage the review transcript.

**Rising Action:** John parses the transcript and finds 0 actionable findings. No proposed changes, no gaps, no risks — just affirmations.

**Climax:** John reports: "I found 0 actionable findings in this transcript. 6 items were observations or confirmations. Nothing to add to the backlog." Then offers the escape hatch: "Did I miss something? If you believe there are findings I didn't catch, highlight specific passages and I'll re-examine them."

**Resolution:** Amalik either moves on (nothing missed) or highlights a passage John re-examines. The workflow handled the edge case gracefully — no wasted time, no noise in the backlog, no silent misses.

### Journey 4: BMM Team Consumer — Reading the Backlog

**Winston** (the architect) needs to frame the next epic. He opens `initiatives-backlog.md` and scans the prioritized view.

**Opening Scene:** Winston sees the ranked list — RICE scores, categories, status. The top 3 items are infrastructure work he's been expecting.

**Rising Action:** He reads the item descriptions. Each has enough context — title, category, and provenance tags showing source and date ("Added from adversarial review, 2026-03-14"). Items that were rescored show the change: "Rescored 4.2→6.1, Review mode, 2026-03-12" — so he understands not just the current ranking but how it evolved. He doesn't need to ask Amalik what "D7" means — the backlog is self-documenting.

Winston's trust in the ranking grows over cycles. The first time, he cross-checks a few scores against his own intuition. By the third triage cycle, provenance and consistent scoring have built confidence — the ranking reflects strategic priority, not arbitrary numbers.

**Resolution:** Winston frames the epic around the top-ranked item. He never touched John PM, never ran the workflow. The backlog output — with its provenance, rescore history, and scoring context — was his interface.

### Journey 5: Module Author — Adding a Second Enhancement

**A developer** wants to add a "Sprint Health Check" enhancement for the SM agent. They've seen the RICE backlog workflow and want to follow the pattern.

**Opening Scene:** They read `ENHANCE-GUIDE.md` — half a page. It explains the directory structure, how to create a workflow, how to patch an agent menu, and the discoverability contract: every new workflow must be registered in `config.yaml` — the installer reads config to discover what to deploy.

**Rising Action:** They create `_bmad/bme/_enhance/workflows/sprint-health/` with step files following the same structure as the backlog workflow. They add an `<item>` tag to `sm.md`. They register the new workflow in `config.yaml`.

Before first use, they run the validation command. It confirms: "Workflow has 4 steps, entry point resolves correctly, menu patch for sm.md is valid, config.yaml registration found." If they'd forgotten the config registration, validation would have caught it: "Workflow directory found but not registered in config.yaml."

**Climax:** They run `convoke-install-vortex`. The installer reads `config.yaml`, discovers the new enhancement workflow, and deploys it alongside the existing backlog workflow.

**Resolution:** SM now has a "Sprint Health Check" menu item. The Enhance pattern worked — no framework changes, no installer modifications, just content files, a config entry, a menu patch, and a passing validation.

### Journey Requirements Summary

| Journey | Key Capabilities Revealed |
|---------|--------------------------|
| J1: Triage happy path | Transcript parsing, finding extraction, deduplication detection against existing backlog (merge/skip/add), two-gate validation (extraction then scoring), batch RICE scoring, backlog append with provenance, prioritized view regeneration |
| J2: Non-BMAD input | Flexible input parsing, ambiguity detection, exploration candidate handling, overlap checking, provenance tagging by source type |
| J3: Zero findings | Graceful empty-result handling, no manufactured findings, escape hatch for user-directed re-examination |
| J4: BMM consumer | Self-documenting backlog output, provenance tags (source + date), rescore provenance (old→new score with mode and date), readable prioritized view, trust builds over cycles |
| J5: Module author | Guide documentation, discoverability contract (config.yaml registration required), workflow validation command (structure, entry point, menu patch, config), installer error on missing registration, pattern replicability |

## Innovation & Design Patterns

### Primary Innovation: Two-Gate Batch Validation Model

Most agentic workflows offer binary validation (accept/reject) or per-item confirmation. The Enhance backlog workflow introduces a third pattern: batch presentation with two distinct validation gates — extraction review (pattern recognition) then scoring review (calibration). This separates "did the agent find the right things?" from "did the agent quantify them correctly?" — matching how human cognition actually works. Gate 1 shows findings + categories + overlap flags only (no scores). Gate 2 shows findings + RICE scores + rationale only (extraction settled). Three touchpoints total: review findings, review scores, confirm output.

### Application Domain: Closed Review-to-Backlog Feedback Loop

Review sessions produce unstructured findings. The backlog requires structured, scored, ranked items. The gap between these formats is where findings get lost. The RICE backlog workflow closes this loop in one step — unstructured input to structured, scored output — with provenance tracking that connects every backlog item back to its source.

### Delivery Mechanism: Cross-Module Agent Extension

The Enhance pattern brings the extension/plugin model to BMAD's agent ecosystem, where agents have been closed systems. Novel in context, not in concept. This is a strategic infrastructure investment, not a user-facing innovation. Its value is measured by whether it unlocks the `<extensions>` mechanism, not by user experience impact. The v1 implementation serves as an incubation proof for a proposed upstream mechanism.

### UX Design Principles

*Note: These principles generate specific functional requirements in the Functional Requirements section.*

- **Information separation between gates** — no scores at Gate 1, no extraction re-decisions at Gate 2
- **Gate 2 removal allowance** — users can drop items during scoring without returning to Gate 1
- **Completion summary** — after backlog update, show what was added/merged/changed + new top 3 positions. Serves dual purpose: UX closure and trust-building mechanism.
- **Rationale visibility** — every RICE score includes a one-line rationale, not just the number

### Innovation Hypotheses

*Note: These are observational metrics for the product owner to assess over multiple sessions, not instrumented telemetry in the workflow.*

- **H1 (Gate effectiveness):** Extraction modification rate >2x scoring modification rate — confirming the gates focus attention on distinct cognitive tasks
- **H2 (Batch efficiency):** Time-per-item validation decreases as batch size increases — confirming cognitive warm-up effect. If time-per-item *increases*, batch model breaks down and pagination is needed.
- **H3 (Trust building):** Completion summary increases user confidence that nothing was lost — measured by whether users re-check the backlog after triage (lower re-check rate = higher trust)
- **H4 (Strategic conversation):** RICE scoring questions prompt genuine reflection, not rubber-stamping — measured by whether users modify their initial instinct on at least 1 score per session (modification = engagement, not rubber-stamping)

### Risk Mitigation

- **Two-gate overhead:** If users find two gates tedious, the extraction gate can be made optional (auto-confirm if confidence is high). Start with both gates to validate the model.
- **Gate rigidity:** Strict separation may feel rigid if users want to annotate during extraction. v1 starts strict to validate; if users consistently try to score during extraction, consider lightweight annotation in v2.
- **Batch size limits:** Large transcripts (30+ findings) may make batch review overwhelming. Consider pagination or grouping by category if batch exceeds 15 items. H2 will signal when this threshold is hit.
- **Extension pattern coupling:** If BMAD upstream changes `pm.md` structure, the `<item>` patch may break. Mitigated by ADR-2 (fail-fast verification on install).

## Content Platform & Workflow System Requirements

### Project-Type Overview

P4 delivers markdown workflow files and YAML configuration, shipped via npm as part of Convoke. The deliverable is not code — it's structured content that agents execute at runtime. This means:

- No compilation, transpilation, or build step
- The installer copies files; the agent interprets them
- Versioning is handled by the npm package, not by the workflow files themselves

**Scope boundary:** The initiatives backlog markdown file is the authoritative source for RICE-scored priorities. The workflow does not sync with external tracking tools (Linear, Notion, etc.).

**Module independence:** Enhance and Vortex are independent submodules under `_bmad/bme/`. They share the installer pipeline and npm package but have no runtime dependencies on each other. Vortex agents do not read or write Enhance artifacts. BMM agents (Winston, Bob, etc.) may read the backlog output as a reference document but do not write to it. Only the Enhance workflow modifies the backlog file.

### Workflow File Requirements — *Consumed by: step file authors*

- **Step file format:** Markdown with YAML frontmatter, following the existing BMAD step-file pattern (as used by the PRD workflow, create-story workflow, etc.)
- **Frontmatter fields:** `name`, `description`, file references (`nextStepFile`, `outputFile`), task references as needed
- **Step file convention:** Sequential numbering (`step-01-*.md`, `step-02-*.md`), self-contained instructions per step, explicit next-step loading at completion
- **Entry point:** `workflow.md` presenting the T/R/C mode selection menu with one-line descriptions:
  - **T — Triage:** Ingest findings from a review or notes
  - **R — Review:** Rescore existing backlog items
  - **C — Create:** Build a new backlog from scratch
- **Mode exit contract:** Each mode terminates with a completion summary and returns to the T/R/C menu. The user can then select another mode or exit the workflow. No automatic mode chaining.
- **Phase requirements per mode:**
  - **Triage:** Input parsing → extraction + Gate 1 validation → scoring + Gate 2 validation → backlog update
  - **Review:** Backlog load → rescore walkthrough → prioritized view regeneration
  - **Create:** Initialization → initiative gathering → scoring → output generation
- **Per-mode instruction framing:** Each mode may require distinct agent instruction framing within its step files. Triage emphasizes extraction and deduplication. Review emphasizes comparative rescoring. Create emphasizes open-ended gathering. Step files should set the appropriate cognitive context for John PM at mode entry.
- **Instruction override precedence:** Step file instructions override agent persona behavior for procedural actions (what to present, when to halt, what format to use). Agent persona governs tone and interaction style — how the agent communicates, not what it communicates. If a step file says "present the numbered list," John presents it in his voice but does not add unsolicited commentary.
- **Content validation:** Step file quality validated by `verifyInstallation()` — all frontmatter paths resolve, all steps reachable from entry point, required templates exist

#### Triage Mode Specifications

- **Actionable finding definition:** Per FR2. Observations, confirmations, and commentary are excluded unless user escalates during Gate 1 validation.
- **Gate 1 presentation format:** Each finding presented with: (1) extracted finding statement, (2) proposed category, (3) source reference (which part of the transcript it came from). Overlap flags shown inline with the potentially matching existing backlog item title and ID.
- **Gate 2 presentation format:** Scores presented as a numbered list with item title, RICE components (R/I/C/E individually), composite score, and one-line rationale. User can adjust individual items by number (e.g., "change #4's Confidence from 3 to 2") without re-reviewing the full batch.

### Template Requirements — *Consumed by: template authors*

- **Format:** Pure markdown — no template variables, no runtime resolution
- **Two template files** (separated by audience and purpose):
  - **`templates/rice-scoring-guide.md`** — Loaded by the agent during scoring. Contains scoring criteria, scale definitions, and calibration examples. This is the reference document for RICE methodology. **The scoring scale and formula must be consistent with the existing backlog's scoring convention, producing scores in the range currently used (approximately 1.0–10.0).** If the existing backlog was scored with a different method, the first Review mode session should establish the new RICE baseline.
  - **`templates/backlog-format-spec.md`** — Loaded by the agent during file operations. Contains exact heading structure, table columns for prioritized view, changelog entry format (table with Date and Change columns, newest first), insertion rules (new items appended to category section, prioritized view regenerated by score), provenance tag format, and RICE composite formula with sort order.
- **RICE composite formula:** Prioritized view sorted by RICE composite score (R × I × C ÷ E, descending). Ties broken by Confidence (higher first), then by insertion order (newer first).
- **Provenance conventions:**
  - **Triage — new items:** `"Added from [source], [date]"` — the score recorded is the final score after any Gate 2 user adjustments (John's proposal is not recorded separately)
  - **Review — rescored items:** `"Rescored [old]→[new], Review, [date]"` — only applies when an existing item's score changes during Review mode
  - **Triage Gate 2 adjustments are not rescores** — they are the initial score. No rescore provenance is generated.
- **Backlog output:** Must produce output matching the exact current format of `initiatives-backlog.md` as specified in the backlog format spec
- **Template update policy:** `templates/` is installer-managed content — overwritten on update. User customizations to calibration examples should be made in the target project's output folder, not in source template files.

### Configuration Requirements

- **`config.yaml` schema:**

```yaml
name: enhance
version: 1.0.0
description: "Enhance module — capability upgrades for existing BMAD agents"
workflows:
  - name: initiatives-backlog
    entry: workflows/initiatives-backlog/workflow.md
    target_agent: bmm/agents/pm.md
    menu_patch_name: "initiatives-backlog"
# dependencies: reserved for future use
```

- **Workflow registry:** Each workflow entry specifies name, entry point path (relative to `_enhance/`), target agent file (relative to `_bmad/`), and menu patch identifier
- **v1 uses static config only.** The RICE scoring guide template is loaded at agent runtime but is not configurable. Runtime config (e.g., custom output paths) deferred to v2 if needed.

### Installer Integration Requirements — *Consumed by: installer developer*

- **New section in `refreshInstallation()`:** Copies `_bmad/bme/_enhance/` directory tree to target project
- **Menu patch format:** Installer adds an `<item name="initiatives-backlog" exec="...">` tag to target agent file. Detection matches the `name` attribute value regardless of quote style or whitespace. If tag with matching name exists, skip. If target agent file missing from target project, fail-fast: "pm.md not found — BMM module must be installed first."
- **Anchor pattern:** Installer inserts the `<item>` tag before `</menu>` in the target agent file. If `</menu>` not found, fall back to inserting after the last existing `<item>` tag. If neither found, fail-fast: "pm.md menu structure not recognized — manual patch required."
- **`exec` path resolution:** The `exec` path in the `<item>` tag is relative to `{project-root}/_bmad/`. Example: `exec="bme/_enhance/workflows/initiatives-backlog/workflow.md"` resolves to `{project-root}/_bmad/bme/_enhance/workflows/initiatives-backlog/workflow.md`.
- **Runtime dispatch dependency (RESOLVED):** The `<item exec="...">` tag relies on BMAD core's menu system to load the referenced workflow file when the user selects the menu item. **Validated:** BMAD core v6.1.0 fully supports `exec` path loading — all pm.md and Vortex agent menu items use this pattern with `{project-root}` prefix paths.
- **Re-add behavior:** If a user manually removes the `<item>` tag and runs the installer again, the tag will be re-added. To permanently disable an enhancement, remove the workflow from `config.yaml`.
- **Verification:** `verifyInstallation()` confirms: (1) enhance directory exists, (2) workflow entry point resolves, (3) menu patch is present in target agent, (4) config.yaml is valid against schema, (5) config-to-filesystem consistency — every workflow registered in config.yaml has a corresponding directory and entry point file. **v1 verifies at install time only.** Runtime integrity checks (e.g., `convoke-doctor` detecting missing patches after BMAD updates) are deferred.
- **Verification behavior:** Verification runs all checks and reports all failures, not fail-on-first. The developer should see the complete installation state in one run.
- **Modular verification:** Enhance verification checks should be modular — callable independently for Enhance-only validation, and integrated into the existing `verifyInstallation()` pipeline.
- **Idempotency:** Running installer twice produces identical results — no duplicate patches, no file conflicts, no duplicate manifest entries
- **v6.1.0 skill registration:** For each workflow in config.yaml, the installer generates a `.claude/skills/bmad-enhance-{workflow-name}/SKILL.md` wrapper that references the workflow entry point. The installer also appends entries to `workflow-manifest.csv` and `skill-manifest.csv` if not already present. Detection uses the canonicalId column to prevent duplicates. The skill wrapper follows the standard BMAD v6.1.0 pattern: YAML frontmatter (`name`, `description`) with a body instruction to load the workflow file.
- **Uninstall path:** Removing the `<item>` tag from `pm.md` disables the enhancement until next install. John PM works exactly as before. No cleanup of enhance files required (they're inert without the menu entry). Skill wrapper and manifest entries persist but are inert without the menu activation path.

### Backlog Safety Requirements

Write safety, pre-write format validation, and concurrent manual edit support are specified in FR18, FR24, FR25, NFR1, NFR2, and NFR3.

- **Staleness nudge (Deferred — see Post-MVP Features):** When Triage mode loads the existing backlog, detect staleness by counting distinct Triage-sourced changelog dates. If any existing item's last provenance date is older than the 3rd most recent Triage changelog date, surface a non-blocking suggestion: "Some items haven't been rescored in 3+ sessions. Consider running Review mode after this triage."

### Implementation Considerations

- **Installer test surface:** The new installer section and verification checks are the only new JavaScript. This includes file copying, menu patch insertion with anchor detection and name-attribute matching across quote styles, config schema validation, config-to-filesystem consistency checks, idempotency logic, and fail-fast error paths — each independently testable.
- **Semantic correctness requires manual testing:** `verifyInstallation()` validates structural integrity (frontmatter paths, step reachability, template existence). Whether step file instructions produce correct agent behavior can only be verified through manual walkthrough — each mode story should include this as an acceptance criterion.

## Project Scoping & Phased Development

### MVP Strategy & Philosophy

**MVP Approach:** Problem-solving MVP — deliver the complete review-to-backlog feedback loop with all three modes operational. The MVP validates the two-gate batch validation model and the cross-module extension pattern simultaneously.

**Why all three modes in MVP:** Triage is the critical path, but Review and Create are necessary for a complete backlog lifecycle. Without Review, scores drift over time with no correction mechanism. Without Create, new projects must manually bootstrap the backlog before Triage can append to it. All three modes share the same templates, config, and installer — the incremental cost of shipping Review and Create alongside Triage is low relative to the standalone infrastructure investment.

**Pre-implementation spike: RESOLVED** — `<item exec="...">` menu dispatch is fully supported in BMAD core (confirmed in pm.md, Vortex agent files). No fallback needed. The installer uses both approaches in parallel: (1) menu patch via `<item exec="...">` for agent-level activation, and (2) `.claude/skills/` wrapper + manifest entries for v6.1.0 skill discovery compliance. These are complementary — the menu patch is the primary activation path, the skill wrapper ensures the workflow is discoverable via the BMAD v6.1.0 skill system.

### MVP Feature Set (Phase 1)

**Core User Journeys Supported:**
- J1: Triage after review (happy path)
- J2: Triage from non-BMAD source
- J3: Zero actionable findings (edge case)
- J4: BMM consumer reading the backlog (passive — no workflow changes needed)

**Must-Have Capabilities:**

| Capability | Rationale |
|-----------|-----------|
| Triage mode (all phases) | Critical path — highest-value deliverable |
| Review mode (all phases) | Prevents score drift, completes backlog lifecycle |
| Create mode (all phases) | Enables new project bootstrapping |
| Two-gate validation (Triage) | Primary innovation — must be validated in v1 |
| Completion summary (all modes) | UX closure + trust building — shows items added/merged/changed + new top 3. *Implementation note: completion summary is an acceptance criterion on each mode story, not a standalone story.* |
| Write safety | Prerequisite for all modes — protects backlog integrity |
| Pre-write format validation | Highest-risk failure mode mitigation — prevents backlog corruption |
| RICE scoring guide template | Scoring consistency across sessions |
| Backlog format spec template | File operation safety and format compliance |
| Installer integration | File copy, menu patch, verification |
| Modular verification | Enhance checks callable independently + integrated into pipeline |
| Config.yaml | Workflow registry for installer discovery |
| Menu patch (`<item>` tag) | Agent activation mechanism |
| Skill wrapper (`.claude/skills/`) | v6.1.0 discovery compliance |
| Workflow-manifest + skill-manifest entries | v6.1.0 registration compliance |
| ENHANCE-GUIDE.md | Pattern documentation for future module authors |
| Directory structure | `_bmad/bme/_enhance/` with full Option C layout |

**Explicitly NOT in MVP:**
- Staleness nudge (deferred — independently implementable enhancement, core workflow is complete without it, can be added post-MVP without changing existing step files)
- Individual initiative files (v2)
- Cross-agent routing (v2)
- Runtime integrity checks / `convoke-doctor` integration (deferred)
- BMAD external module registration (deferred — Enhance uses direct installer integration, not a registration API)
- Dynamic `<extensions>` mechanism (v3)
- Prioritized view pagination or category grouping (v2 if backlog exceeds ~75 items)

### Post-MVP Features

**Phase 2 (Growth):**
- Staleness nudge in Triage mode
- Individual initiative files with RICE frontmatter + auto-generated summary view
- Cross-agent routing ("next actions by agent" section)
- Runtime config support (custom output paths)
- Prioritized view scaling (pagination or category-grouped views if backlog exceeds ~75 items)
- Second enhancement workflow for another BMAD agent

**Phase 3 (Expansion):**
- Dynamic `<extensions>` tag — proposed BMAD core mechanism
- Enhance ecosystem — multiple modules contributing enhancements
- BMAD external module registration
- `convoke-doctor` integration for runtime integrity checks

### Risk Mitigation Strategy

**Technical Risks:**

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| `<item exec="...">` not supported by BMAD core | ~~Medium~~ **Resolved** | ~~Critical~~ | Spike confirmed: `<item exec="...">` fully supported in BMAD core v6.1.0 |
| BMAD upstream changes `pm.md` structure | Low (per release) | High — breaks menu patch | `verifyInstallation()` fail-fast detection + ADR-2 |
| Backlog corruption from agent write errors | Medium | High — data loss | Write safety + pre-write format validation (both MVP) |
| RICE score clustering (useless prioritization) | Medium | Medium — undermines value | Guard metric (no more than 3 identical in top 10) + scoring guide calibration |
| Installer works in source repo but fails on target | Medium | High — blocks first real usage | Installer must be tested on a clean target project (not the source repo) before v1 is complete |
| Step file instructions don't produce intended agent behavior | High | Medium — workflow feels broken | Semantic correctness requires manual testing (structural validation catches path/template issues only). Each mode story should include manual walkthrough as acceptance criterion. |

**Market Risks:**

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| No second enhancement added (pattern unused) | Medium | Low for users, Medium for strategy | Strategic reassessment at 6 months (documented in Product Scope) |
| Two-gate model feels tedious | Low | Medium — users skip Gate 1 | Gate 1 can be made optional post-MVP if feedback warrants |

**Resource Risks:**

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Step file authoring takes longer than expected | Medium | Schedule slip | Triage mode first — ship if Review/Create delayed |
| Installer integration more complex than estimated | Low | Schedule slip | Installer is one story — scope bounded by existing `refreshInstallation()` pattern |

### Dependency Map

```
Pre-implementation spike (exec validation)
    └── Story: Installer integration (file copy + menu patch + verification)
         └── Story: Directory structure + config.yaml + template authoring
              │     (includes rice-scoring-guide.md and backlog-format-spec.md content)
              ├── Story: Triage mode step files (AC includes completion summary + manual walkthrough)
              ├── Story: Review mode step files (AC includes completion summary + manual walkthrough)
              ├── Story: Create mode step files (AC includes completion summary + manual walkthrough)
              └── Story: ENHANCE-GUIDE.md (can parallel any mode story)
```

*Note: Mode stories are independent and can be developed in parallel. Template authoring is a prerequisite for all mode stories — step files reference templates at runtime.*

### Cross-Reference: Completion Summary Requirement

*The completion summary is specified in the Innovation & Design Patterns section (UX Design Principles) as: "after backlog update, show what was added/merged/changed + new top 3 positions." This applies to all three modes. Implementation: completion summary is an acceptance criterion on each mode story's final step, before returning to the T/R/C menu — not a standalone story.*

## Functional Requirements

### Finding Extraction & Classification

- FR1: Product Owner can submit any text input (review transcript, meeting notes, markdown) to Triage mode for finding extraction
- FR2: The workflow can extract actionable findings from unstructured text input, where actionable = proposes a change, identifies a gap, or flags a risk
- FR3: The workflow can classify each extracted finding into a backlog category
- FR4: The workflow can identify the source reference for each finding (which part of the input it came from)
- FR5: The workflow can detect potential overlaps between extracted findings and existing backlog items, presenting them with the matching item's title and ID
- FR6: Product Owner can resolve overlap flags by choosing merge, skip, or add-as-new for each flagged finding
- FR7: Product Owner can escalate observations to actionable status during Gate 1 validation
- FR8: Product Owner can add findings the workflow missed during Gate 1 validation
- FR9: Product Owner can remove findings from the extraction batch during Gate 1 validation
- FR10: The workflow can report zero actionable findings gracefully, with an escape hatch for user-directed re-examination of specific passages

### RICE Scoring & Prioritization

- FR11: The workflow can propose RICE scores (Reach, Impact, Confidence, Effort) for each confirmed finding in batch
- FR12: The workflow can present each score with a one-line rationale explaining the scoring basis
- FR13: Product Owner can adjust individual RICE component scores by item number without re-reviewing the full batch
- FR14: Product Owner can drop items from the scoring batch during Gate 2 without returning to Gate 1
- FR15: The workflow can calculate composite RICE scores per the formula in Template Requirements and sort by descending score with tiebreaking (Confidence first, then insertion order)
- FR16: The workflow can load and reference the RICE scoring guide template during scoring for consistent calibration
- FR17: The workflow can produce scores conforming to the range derived from the scoring guide's defined RICE component scales and composite formula (R × I × C ÷ E)

### Backlog Management

- FR18: Product Owner's existing backlog content is preserved when the workflow appends new items, including items added manually between sessions
- FR19: The workflow can append new items to the correct category section of the backlog, identified by section heading
- FR20: The workflow can regenerate the prioritized view table with all items (existing + new) sorted by composite score
- FR21: The workflow can add provenance tags to new items ("Added from [source], [date]")
- FR22: The workflow can add rescore provenance to changed items in Review mode ("Rescored [old]→[new], Review, [date]")
- FR23: The workflow can add changelog entries in the correct format (table with Date and Change columns, newest first)
- FR24: The workflow can validate structural format of the backlog file before writing (section headings, table columns, changelog section)
- FR25: Product Owner can proceed or abort when pre-write validation detects a structural mismatch

### Mode Management

- FR26: Product Owner can select between Triage, Review, and Create modes from a single entry point with mode descriptions
- FR27: The workflow can present a completion summary after each mode showing items added/merged/changed and new top 3 positions
- FR28: Product Owner can return to the T/R/C menu after any mode completes
- FR29: Product Owner can exit the workflow from the T/R/C menu
- FR30: The workflow can load the existing backlog for Review mode and walk through items for rescoring
- FR31: Product Owner can change or confirm the score for each item during Review mode walkthrough
- FR32: The workflow can initialize a new backlog file in Create mode
- FR33: Product Owner can provide initiatives interactively during Create mode gathering phase

### Installation & Activation

- FR34: The installer can copy the `_enhance/` directory tree to a target project
- FR35: The installer can add an `<item>` tag to the target agent file at the correct anchor point
- FR36: The installer can detect an existing `<item>` tag by name attribute and skip if present
- FR37a: The installer can fail-fast with a clear error if the target agent file is missing
- FR37b: The installer can fail-fast with a clear error if the target agent file's menu structure is unrecognized
- FR38: The installer can read `config.yaml` to discover registered workflows and their target agents
- FR39: The installer can perform the 5-point verification defined in Installer Integration Requirements (enhance directory, entry point, menu patch, config validity, config-to-filesystem consistency)
- FR40: The installer can report all verification failures in a single run (not fail-on-first)
- FR41: The installer can produce identical results when run twice (idempotency)
- FR42: Product Owner can disable an enhancement by removing the `<item>` tag (temporary) or removing the workflow from config.yaml (permanent)

### Pattern Documentation

- FR43: A module author can read ENHANCE-GUIDE.md to understand: directory structure, workflow creation, agent menu patching, config registration, and validation
- FR44: The installer can discover and deploy enhancement workflows based on config.yaml entries

### Cross-Cutting Capabilities

- FR45: The workflow can load and reference the backlog format spec template during file operations for consistent output formatting
- FR46: The workflow processes the complete input text regardless of length without truncation
- FR47: Product Owner can skip items during Review mode walkthrough without rescoring them
- FR48: Product Owner can view an item's current provenance before deciding to rescore in Review mode
- FR49: The installer fails fast with a clear error if config.yaml is missing or unparseable

#### v6.1.0 Skill Registration (FR50–FR52)
- FR50: The installer can generate a `.claude/skills/` wrapper directory for each Enhance workflow, following the BMAD v6.1.0 skill directory pattern (`SKILL.md` with frontmatter referencing the workflow entry point)
- FR51: The installer can add an entry to `workflow-manifest.csv` for each Enhance workflow, with module=`bme`, path to the workflow entry point, and canonicalId matching the skill directory name
- FR52: The installer can add an entry to `skill-manifest.csv` for each Enhance workflow skill, with module=`bme`, path to the SKILL.md file, and install_to_bmad=`true`

## Non-Functional Requirements

### Data Integrity

- NFR1: The workflow must never delete, overwrite, or reorder existing backlog category section content during any write operation. The prioritized view table is excluded from this constraint — it is regenerated per FR20. Verification: diff of backlog file before/after shows only additions to category sections and a regenerated prioritized view.
- NFR2: Pre-write format validation must detect mismatches in: section heading names that serve as insertion anchors, prioritized view table column count, and changelog section existence. Zero silent corruption for checked structures.
- NFR3: The backlog file must remain parseable by the workflow on next load and manually editable in any text editor after every workflow operation. No workflow-specific encoding, markers, or formatting that would break either round-trip processing or manual editing.

### Installer Reliability

- NFR4: Installer operations must be idempotent — running the installer twice produces no changes to installer-managed files detectable by `git diff`. Idempotency is scoped to files the installer creates or modifies, not the entire working tree.
- NFR5: All installer failures must be displayed to the user via stdout, stating: (1) what failed, (2) why it failed, (3) what to do next. No silent failures, no stack traces without context.

### Content Portability

- NFR6: All workflow output (backlog file, changelog, prioritized view) must be standard markdown readable by any markdown renderer. No proprietary extensions, no HTML embeds, no tool-specific syntax. Provenance tags are plain text, not structured metadata.

### Backward Compatibility

- NFR7a: Installing the Enhance module must not alter the behavior of any existing BMAD agent when the enhancement is not invoked. John PM without the `<item>` tag must work identically to pre-Enhance John PM.
- NFR7b: Removing the `<item>` tag from `pm.md` must fully disable the enhancement with no residual effects — no orphaned state, no error messages from missing references.

### Workflow Integrity

- NFR8: All step file frontmatter references (nextStepFile, outputFile, template paths) must resolve to existing files at install time. Verification: `verifyInstallation()` walks the step chain from entry point to terminal step, confirming every referenced file exists.

### v6.1.0 Registration Compliance

- NFR9: Skill wrapper generation, workflow-manifest entry, and skill-manifest entry must be idempotent — running the installer twice produces no changes to these artifacts detectable by `git diff`. Existing entries must be detected and skipped, not duplicated.
