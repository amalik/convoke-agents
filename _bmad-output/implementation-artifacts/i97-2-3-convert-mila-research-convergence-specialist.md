# Story i97-2.3: Convert Mila (research-convergence-specialist)

Status: in-progress

**Epic:** [i97-epic-2 — Vortex Agent Conversions Complete](../planning-artifacts/convoke-epic-bmad-v63-source-format-adoption.md#epic-2-vortex-agent-conversions-complete) (atomic-by-agent commit pattern per ADR-004; one PR per agent)
**Origin:** I97 (BMAD v6.3+ Source Format Adoption / Convoke 4.0 packaging-contract). **Third per-agent conversion** — second post-POC application after Story 2.1 (Emma POC) and Story 2.2 (Wade).
**Branch convention (per ADR-004):** `i97-mila-conversion`. **Practice (per Stories 2.1, 2.2):** work directly on `main` with one-file-per-commit cadence; this is the established Convoke pattern, ADR-004's branch-per-agent prescription is honored only at the conceptual level (one PR per agent = one logical merge unit).
**Predecessor:** Story 2.2 (Wade) — shipped 2026-05-02, status `done` (Round 1 code-review converged in-place; no Round 2 spawned per `code-review-convergence` + `feedback_avoid_overcomplicating_audits`). **All 12 calibration carry-forwards from 2.1 + 2.2 apply load-bearing here.** See [project_i97_story_2_1_calibration.md](../../../.claude/projects/-Users-amalikamriou-BMAD-Enhanced/memory/project_i97_story_2_1_calibration.md), [Story 2.2 Dev Agent Record Completion Notes](i97-2-2-convert-wade-lean-experiments-specialist.md#L320), and the Story 2.2 [Review Findings](i97-2-2-convert-wade-lean-experiments-specialist.md#review-findings-round-1-2026-05-02) before starting.
**Namespace decision:** All edits live under `_bmad/bme/_vortex/`. The `covenant-compliance-for-convoke-skills` rule applies (Operator Covenant compliance is mandatory).
**Pre-test rubric prerequisite:** ✓ Satisfied. Mila's baseline fixtures exist at [`tests/migration/personality-preservation/fixtures/research-convergence-specialist/`](../../tests/migration/personality-preservation/fixtures/research-convergence-specialist/). Reuse — do NOT re-capture.
**Estimated effort:** ~1-1.5 hr dev work + ~30 min operator capture (Mila has 3 capabilities — fewer than Wade's 5; tooling matured further on third application). Wade actuals: ~2 hr dev + ~30 min operator capture; Mila should land below Wade due to lower capability count.

## Story

As the Convoke maintainer, I want Mila's `SKILL.md` migrated from v5/early-v6 XML-in-markdown to v6.3+ outcome-based markdown — preserving operational equivalence (menu codes, workflow paths, output filenames) AND personality preservation (per the calibrated rubric) AND Operator Covenant compliance — with all atomic-by-agent dependents (3 capability prompts, manifest entries, parity tests, audit-report citations) in the same PR, so that:

1. Mila is marketplace-eligible per the BMAD v6.3+ format submission gate;
2. Mila preserves her synthesis-with-triangulation persona under the calibrated rubric (FR23);
3. Stories 2.1 + 2.2's per-agent cycle is validated against a lower-capability-count agent (calibration delta vs Emma 4 caps and Wade 5 caps);
4. Stories 2.4-2.7 estimate against the composite Emma + Wade + Mila actuals, with cycle-cost trend established;
5. **NEW from Story 2.2 R1 review:** the 3rd data point on Emma's two surprises (CF #1 cross-agent escalation regression, CF #3 stage directions) — if Mila replicates either pattern, re-flag as systemic concern; if she preserves like Wade did, the agent-specific-to-Emma reading hardens. Similarly the 3rd data point on the D6-outperforms-baseline pattern (Emma + Wade both outperformed; Mila is the tie-breaker for "is this a real systemic v6.3+ format property?").

## Context & Motivation

**Why Mila after Wade.** Per architecture § "Migration Sequencing" + epic AR17. Mila has the **lowest capability count of any Vortex agent (3)**. Conversion exercises the per-capability authoring loop more lightly than Wade's 5 or Emma's 4. Mila's persona fingerprint is "synthesis with triangulation, comfortable holding contradictions" — distinct from Wade's hypothesis-driven action-bias and Emma's curious-clarifying probing — so personality preservation is tested against a third signal class.

**What's the same as Emma + Wade:**
- 11-activity Within-PR Sequence
- 4-category fixup checklist (ADR-002)
- Personality scoring against rubric (FR21-23)
- Operator Covenant self-check (OC-R0..R7)
- DoD per-agent PR checklist (12 items + carry-forward bindings — semantics now canonically "12 items + N CF bindings" per Story 2.2 R1 Patch 5)
- 12 calibration carry-forwards from Stories 2.1 + 2.2 (apply explicitly per AC18; previously 6 from 2.1, now +6 from 2.2 R1 review)

**What's different vs Wade:**
- 3 capabilities → 3 `references/*.md` files (two fewer than Wade)
- Menu code set: `{MH, CH, RC, PR, PA, PM, DA}` — 7 codes (vs Wade's 9); 3 routed (RC/PR/PA) + 4 meta (MH/CH/PM/DA)
- Workflow source files (FR12 — unchanged):
  - `_bmad/bme/_vortex/workflows/research-convergence/workflow.md`
  - `_bmad/bme/_vortex/workflows/pivot-resynthesis/workflow.md`
  - `_bmad/bme/_vortex/workflows/pattern-mapping/workflow.md`
- Capability prompt files (NEW): `references/{research-convergence,pivot-resynthesis,pattern-mapping}.md`
- Persona fingerprint: synthesis-with-triangulation; "convergence over collection"; "one data point is an anecdote, three are a pattern"; comfortable holding contradictions while patterns emerge.
- **No `validate.md`-style indirection capability** — cleaner than Wade's `VE → mvp/validate.md` placeholder chain. AC4 honest-representation cell will be simpler.

## Acceptance Criteria

**Pattern note:** ACs follow Story 2.1/2.2's structure. Where wording is identical, reference is by AC number. Where Mila-specific, the AC is restated.

### AC1 — Mila's SKILL.md converted to v6.3+ format with zero XML elements

**Given** Mila's pre-migration SKILL.md at [`_bmad/bme/_vortex/agents/research-convergence-specialist/SKILL.md`](../../_bmad/bme/_vortex/agents/research-convergence-specialist/SKILL.md) (current state: v5 XML-in-markdown — verify before conversion; pre-migration git blob `dd332ae9d3600056285f167d7875733ce1952685`)
**When** the BMB conversion tooling runs (or dev agent authors per BMB-converted-Wade pattern) AND the fixup checklist is applied
**Then** the post-migration SKILL.md contains zero v5 XML elements (regex `/<(agent|activation|menu|item|step|persona|rules|menu-handlers|handler|r)\b/` returns no matches)
**And** the `## On Activation` section delegates config loading to bmad-init skill (per Story 2.1 OC-R3 Option A precedent — pedagogy over punition; CF #5)
**And** the `**CRITICAL Handling**` block enumerates Mila's load-bearing principles ("convergence over collection" / "one data point is an anecdote, three are a pattern" / triangulation discipline) AND describes the actual observed pattern, not a softer aspiration (CF #12 — see persona-vs-transcript binding below).

### AC2 — Frontmatter `name:` field equals `bmad-bme-agent-mila` (BMB canonical per ADR-001)

Pattern matches Story 2.1 AC2.

### AC3 — 3 capability prompts authored at `references/{cap}.md` per Pattern-C-friendly format

**Given** Mila has 3 routed capabilities: RC (research-convergence), PR (pivot-resynthesis), PA (pattern-mapping)
**When** capability prompts are authored
**Then** all 3 files exist:
- `_bmad/bme/_vortex/agents/research-convergence-specialist/references/research-convergence.md`
- `_bmad/bme/_vortex/agents/research-convergence-specialist/references/pivot-resynthesis.md`
- `_bmad/bme/_vortex/agents/research-convergence-specialist/references/pattern-mapping.md`

**And** each has the four Pattern-C-friendly sections: `## Identity`, `## How It Works`, `## Output Expectations`, `## Activation`
**And** each is ~20-50 lines (metadata + activation pointer; not workflow re-author)
**And** each capability prompt's `## Activation` references the correct workflow source path (FR12 paths unchanged)
**And** capability prompts surface cross-agent escalation hooks (CF #1 binding) — RC mentions Isla as upstream evidence source; PR mentions Wade as downstream pivot-or-persevere context; PA mentions Liam if cross-source patterns surface a falsifiable hypothesis. Cross-agent map preserved is the load-bearing test for CF #1 at the 3rd observation.

### AC4 — Menu code set preservation

**Given** Mila's pre-migration menu codes: `{MH, CH, RC, PR, PA, PM, DA}`
**Then** post-migration `## Capabilities` table contains the same 7 codes (lexical set equality per FR13).

### AC5 — Workflow source files unchanged (FR12)

`git diff main -- _bmad/bme/_vortex/workflows/` returns empty for the 3 workflow directories Mila routes to.

### AC6 — `module.yaml` `agents:` array entry added for Mila

Pattern matches Story 2.2 AC6 (real one-line description, no TBD placeholder).

### AC7 — `module-help.csv` row added for Mila

BMM-canonical column ordering. Phase = `synthesize`. No I100 collision flag.

### AC8 — Slash-command wrapper auto-regenerates from updated template (Story 2.1 OC-R5 inheritance)

**Given** Story 2.1's format-agnostic template fix landed at [`scripts/update/lib/refresh-installation.js`](../../scripts/update/lib/refresh-installation.js) (line 710 substring "FOLLOW the activation steps precisely"; line 11 of generated wrapper reads `3. FOLLOW the activation steps precisely` per Story 2.2 R1 Patch 4)
**When** `convoke-update` regenerates wrappers
**Then** Mila's wrapper at `.claude/skills/bmad-agent-bme-research-convergence-specialist/SKILL.md` works cleanly for the converted SKILL.md (no per-agent override needed).

**Note (delta from Story 2.1):** inherited from Story 2.1 + Story 2.2; **no per-agent wrapper changes required**. Operator Covenant self-check should mark OC-R5 PASS by inheritance per CF #6.

### AC9 — Parity tests added for Mila

**Given** [`tests/integration/vortex-parity.test.js`](../../tests/integration/vortex-parity.test.js) exists from Story 2.1 + Wade describe-block from 2.2
**Then** add a Mila describe block (parallel to Emma + Wade) with the same 9 test cases:
- post-migration SKILL.md exists at canonical path
- zero v5 XML elements
- post-migration menu code set equals pre-migration baseline
- frontmatter `name:` equals `bmad-bme-agent-mila`
- references/ directory has 3 capability prompts (derive count from `fs.readdirSync`)
- each capability prompt has the 4 Pattern-C-friendly sections
- workflow source files referenced from menu codes still exist
- `runParityCheck` returns documented shape
- `extractV5MenuCodes` regression test against a Mila-shaped synthetic v5 fixture (7 codes — different from Emma's 2-code or Wade's 9-code samples; exercises a third code-set shape)

**Action item from Story 2.1 calibration carry-forward #2:** before declaring dev done, run `extractV5MenuCodes` against Mila's pre-migration SKILL.md fixture content and verify the result is non-empty + matches the baseline. This catches R2-P4-class regressions where reviewers lack project-context.

### AC10 — Mila's pre-migration parity baseline fixture authored

**Given** baseline fixtures exist at [`tests/migration/personality-preservation/fixtures/research-convergence-specialist/`](../../tests/migration/personality-preservation/fixtures/research-convergence-specialist/)
**Then** create `tests/integration/fixtures/vortex-parity/research-convergence-specialist-baseline.json` mirroring Emma + Wade baseline schema (agentRoleName, agentFirstName="Mila", agentTitle, agentIcon="🔬", preMigrationMenuCodes [7 codes], routedCapabilityCount=3, routedCapabilityCodes RC/PR/PA, metaCapabilityCodes MH/CH/PM/DA, menuCodeToWorkflow map for 3 workflow paths, preMigrationGitBlob `dd332ae9d3600056285f167d7875733ce1952685`).

### AC11 — Personality preservation: no dim at 1 per FR23 disconfirmation gate

**Given** Mila's calibrated baselines at fixtures dir + the calibrated rubric
**When** post-migration capture runs (operator handoff — fresh `/bmad-agent-bme-research-convergence-specialist` session)
**Then** all 7 dimensions score ≥ 2 (FR23 disconfirmation gate — no dim at 1 → does not block merge).

**Threshold-tier semantics (per Story 2.2 R1 CF #9):** the rubric's gate table is canonical for ship-decision tiering — ≥3 across all dims = auto-PASS, any dim = 2 = ship-with-note (operator judgment), any dim = 1 = BLOCK per FR23. AC11 enforces only the BLOCK threshold (no dim at 1). Report against the rubric's tiered table, not just the AC11 minimum.

**Calibration carry-forward bindings (apply during scoring):**
- **CF #1 (cross-agent escalation regression watch — D5/D7):** Mila is the 3rd observation. Emma regressed (no cross-agent map), Wade preserved (routes to Isla, references Liam). If Mila ALSO regresses → 2-of-3 = re-flag as systemic concern. If Mila preserves like Wade → 2-of-3 preserved → agent-specific-to-Emma reading hardens. Mila's SKILL.md identity already mentions "Synthesize stream — transforming raw empathy data and contextual insights" (i.e., Isla's outputs); preserving this routing in capability prompts gives the cross-agent map a structural anchor.
- **CF #3 (stage directions — D2):** Mila is the 3rd observation. Emma had stage directions across all 7 EM-FP responses; Wade had zero. If Mila has stage directions → 2-of-3 — re-flag as systemic; if zero → 2-of-3 preserved → Emma-specific reading hardens.
- **Round-2 cue #6 (pedagogical scaling under pressure):** Mila's analog will be "uncertainty under pressure" — does she hold "we don't have enough sources to triangulate yet" when operator pushes for premature problem-statement? Adaptive-rigor preservation is the test.
- **CF #4 (don't penalize lean compression as automatic D7 drift):** honored.
- **CF #11 (capture metadata fields — NEW from Story 2.2 R1):** at capture time, fill `capture_date` and `capture_session_id` immediately — do not leave as `TBD-fill-when-captured`. If captured in same session as implementation, write `same-session-as-implementation (per same-LLM caveat documented in scoring report)` for `capture_session_id`.
- **CF #12 (persona description matches observed behavior — NEW from Story 2.2 R1):** the SKILL.md `**CRITICAL Handling**` paragraph must describe Mila's actual observed pattern, not a softer aspiration. Wade's R1 surfaced that the original "redirect to a Capabilities item" wording was softer than the captured "No / Hard no" behavior; the fix was to write "refuse the framed scope first, then offer a smaller alternative." Mila's pattern is likely "withhold problem-statement until triangulation succeeds" — phrase the CRITICAL Handling line to match what's captured, not what's aspired.
- **D6-outperforms-baseline pattern (NEW from Story 2.2 R1):** Mila is the 3rd observation. Emma + Wade both outperformed baseline on D6 (held line longer / under more pushback). If Mila ALSO outperforms → 3-of-3 → escalate as architecture-doc finding ("v6.3+ outcome-based markdown has measurable cross-turn-coherence advantage over v5 step-counter activation"). If Mila does NOT outperform → 2-of-3 → keep watching, possibly a same-LLM artifact rather than a format property.

**Fixup-rescore loop:** max 3 iterations. After 3 without all-≥-2, escalate via `bmad-correct-course`.

### AC12 — Audit report citations refreshed atomically (NFR12)

`grep -rE 'research-convergence-specialist/SKILL\.md#' _bmad-output/planning-artifacts/` — refresh any anchors found, OR note "N/A — no Mila-specific line anchors found" in PR description / Dev Agent Record per Story 2.1/2.2 precedent.

### AC13 — Reference integrity passes

`node scripts/audit/reference-integrity.js` exits 0 with zero broken refs.

### AC14 — `npm run lint` zero warnings on touched files (NFR5)

### AC15 — Fixup checklist (per ADR-002) reviewed; 4 categories all PASS

**Mila-specific Category 1 scrutiny (per epic AR17 #5):** synthesis logic in capability prompts requires extra care on persona dimension. Triangulation patterns ("one data point is an anecdote, three are a pattern") and contradiction-holding posture must surface in capability prompts, not just the SKILL.md persona section.

### AC16 — Operator Covenant self-check (OC-R0..R7) all PASS

**CF #5 binding:** OC-R3 PASS by inheriting Story 2.1's Option A decision (walkthrough satisfies OC-R3); document inheritance, don't rejustify.
**CF #6 binding:** OC-R5 PASS by inheriting Story 2.1's template fix; document.

### AC17 — Failure Handling Pattern path documented

5 modes — Mode 2 (fixup misses persona drift; trigger = any dim at 1 per FR23) and Mode 5 (operator unavailable) most relevant. Mode 4 (rubric mis-calibration trigger from epic AR17 #6) explicitly noted as potential for Mila if D5 ambiguity surfaces.

### AC18 — DoD checklist (per-agent PR checklist + carry-forwards binding)

Per-agent PR checklist (12 items, one per AC1–AC12) + 12 carry-forward bindings (6 from Story 2.1 + 6 from Story 2.2 R1). Closure semantics: "12/12 ACs satisfied + 12/12 CF bindings explicitly addressed in Dev Agent Record" (per Story 2.2 R1 Patch 5 reconciliation).

**Carry-forward bindings (must be explicitly addressed in Dev Agent Record):**

**From Story 2.1 (6):**
1. **Cross-agent escalation regression watch** — explicitly score in D5/D7. 3rd observation now; resolves the systemic-vs-agent-specific question if results diverge from Wade.
2. **Run parity-harness fixture extraction during dev** — catches R2-P4-class regressions before reviewers declare done.
3. **Track stage directions / emoji presence per response** — 3rd observation; resolves systemic-vs-Emma-specific question.
4. **Don't penalize lean-over-comprehensive output compression as automatic D7 drift.**
5. **bmad-init walkthrough is the OC-R3 implementation** — inherit, don't re-justify.
6. **Wrapper template format-agnostic** — inherit, no scope expansion to `refresh-installation.js`.

**NEW from Story 2.2 R1 code review (6):**
7. **D6-outperforms-baseline pattern tracking** — 3rd observation; if 3-of-3, escalate as architecture-doc finding (v6.3+ format has cross-turn-coherence advantage over v5).
8. **Scoring report `status: pending-operator-confirmation` until D7 sanity-check** — frontmatter starts at `pending-operator-confirmation`; flips to `pass` after operator confirms at PR review. Include explicit `status_transition` field documenting the trigger.
9. **AC11 three-tier-semantics** — defer to rubric gate table as canonical (≥3 auto-PASS, =2 ship-with-note, =1 BLOCK). AC11 enforces only the BLOCK threshold.
10. **"Not replicated in N observations" wording** — until n≥3, do not write "FALSIFIED". Use neutral "not replicated in X observations; n=X not yet decisive — continue tracking through Stories 2.4-2.7 before declaring agent-specific". For Mila this becomes "not replicated in 3 observations" if patterns hold from Wade.
11. **Capture metadata fields filled at capture time** — `capture_date` and `capture_session_id` set immediately, never `TBD-fill-when-captured`. Honest about same-LLM session reality if applicable.
12. **Persona description matches captured behavior** — SKILL.md `**CRITICAL Handling**` paragraph describes the actual observed pattern, not a softer aspiration. Cross-check against the 7 fixed-prompt responses + scenario transcript before marking AC15 Category 1 complete.

## Tasks / Subtasks

> **Sequencing:** Same 11-activity Within-PR Sequence as Stories 2.1, 2.2. Tasks below mirror Story 2.2's task structure; estimate is leaner since the cycle is proven and Mila has fewer capabilities.

- [ ] **Task 1 — Capture pre-migration baseline** (Activity 1) (AC10)
  - [ ] 1.1 Confirm Mila's personality baseline fixtures intact at `tests/migration/personality-preservation/fixtures/research-convergence-specialist/` — verify `baseline-fixed-prompt.json` + `baseline-unscripted-scenario.md` both present
  - [ ] 1.2 Capture Mila's pre-migration menu codes via `extractV5MenuCodes`; create [`tests/integration/fixtures/vortex-parity/research-convergence-specialist-baseline.json`](../../tests/integration/fixtures/vortex-parity/research-convergence-specialist-baseline.json) (Wade schema mirrored; 7 codes / 3 routed / 3 workflow paths)
  - [ ] 1.3 **CF #2 explicit gate:** `extractV5MenuCodes` returns `[CH, DA, MH, PA, PM, PR, RC]` against Mila's pre-migration SKILL.md — must match expected 7-code set. No R2-P4 regression.
  - [ ] 1.4 Pre-migration v5 SKILL.md content snapshot: git blob `dd332ae9d3600056285f167d7875733ce1952685` (117 lines, fenced ```xml structure)
  - [ ] 1.5 **Natural commit point** — fixture-baselines (suggested commit message: `[i97-mila] capture pre-migration baselines for parity + personality`)

- [ ] **Task 2 — Run BMB conversion tooling (or author per BMB pattern)** (Activity 2) (AC1, AC2)
  - [ ] 2.1 Author conversion directly per BMB-converted-Wade pattern (Story 2.2 precedent — same outcome shape, lower cycle cost on third per-agent application)
  - [ ] 2.2 Inspect output; verify v6.3+ shape per ADR-002 fixup checklist
  - [ ] 2.3 If invalid v6.3+ markdown (Failure Mode 1): invoke `bmad-correct-course`
  - [ ] 2.4 **Natural commit point** — raw conversion output

- [ ] **Task 3 — Apply fixup checklist** (Activity 3) (AC1, AC4, AC15)
  - [ ] 3.1 Category 1 (Persona): diff pre-migration `<persona>` against post-migration `## Identity`/`## Communication Style`/`## Principles`. **Mila-specific scrutiny per epic AR17 #5:** triangulation patterns ("one data point is an anecdote, three are a pattern"), contradiction-holding posture, JTBD framing, Pains & Gains analysis must surface explicitly. **CF #12 binding:** the `**CRITICAL Handling**` block describes Mila's actual observed pattern, not a softer aspiration.
  - [ ] 3.2 Category 2 (Hardcoded errors / OC-R3): inherit Story 2.1 Option A — bmad-init walkthrough handles; no per-agent Activation override (CF #5)
  - [ ] 3.3 Category 3 (Menu code preservation): assert `{MH, CH, RC, PR, PA, PM, DA}` lexical set equality
  - [ ] 3.4 Category 4 (Workflow paths per FR12): `git diff main -- _bmad/bme/_vortex/workflows/` empty
  - [ ] 3.5 **Natural commit point** — fixup applied

- [ ] **Task 4 — Author 3 capability prompts** (Activity 4) (AC3)
  - [ ] 4.1 `references/research-convergence.md` (Pattern-C-friendly, ~21 lines; mention Isla as upstream evidence source per CF #1 binding)
  - [ ] 4.2 `references/pivot-resynthesis.md` (mention Wade as downstream pivot-or-persevere context)
  - [ ] 4.3 `references/pattern-mapping.md` (mention Liam if cross-source patterns surface a falsifiable hypothesis)
  - [ ] 4.4 Update converted SKILL.md `## Capabilities` table to use `Load \`./references/{cap}.md\`` route convention (FR11)
  - [ ] 4.5 **Natural commit point** — capability prompts authored

- [ ] **Task 5 — Update `module.yaml` + `module-help.csv`** (Activity 5) (AC6, AC7)
  - [ ] 5.1 Add Mila's entry to `module.yaml` `agents:` array. **Description:** real one-line description (no TBD placeholders).
  - [ ] 5.2 Append Mila's row to `module-help.csv` (BMM-canonical schema; phase=synthesize)
  - [ ] 5.3 **Natural commit point** — manifests updated

- [ ] **Task 6 — Wrapper inheritance verification** (Activity 6) (AC8)
  - [ ] 6.1 Inspect Mila's wrapper at `.claude/skills/bmad-agent-bme-research-convergence-specialist/SKILL.md` — verify line 11 reads `3. FOLLOW the activation steps precisely` (format-agnostic substring per Story 2.1 OC-R5 fix; full-line quote per Story 2.2 R1 Patch 4)
  - [ ] 6.2 No commit — wrapper is gitignored auto-regen artifact

- [ ] **Task 7 — Author parity tests for Mila** (Activity 7) (AC9)
  - [ ] 7.1 Add Mila describe block to `tests/integration/vortex-parity.test.js` (mirror Wade's structure; substitute Mila specifics — 7 menu codes, 3 routed, 3 workflow paths)
  - [ ] 7.2 Reuse the fixture-loading pattern; reference `research-convergence-specialist-baseline.json` from Task 1.2
  - [ ] 7.3 Run `node --test tests/integration/vortex-parity.test.js` — all Mila tests pass + Emma + Wade tests still pass (target: 27/27)
  - [ ] 7.4 **CF #2 reminder:** Mila-shaped synthetic-fixture regression test exercises `extractV5MenuCodes` against a third code-set shape (7 codes — different from Wade's 9 and Emma's 2)
  - [ ] 7.5 **Natural commit point** — parity tests added

- [ ] **Task 8 — Capture post-migration personality samples + operator scoring** (Activity 8) (AC11)
  - [ ] 8.1 Operator handoff: open fresh session, invoke `/bmad-agent-bme-research-convergence-specialist`, run fixed-prompt set + unscripted scenario per existing fixtures
  - [ ] 8.2 Pre-create `post-migration-fixed-prompt.json` and `post-migration-unscripted-scenario.md` skeletons (per Story 2.1/2.2 pattern; **CF #11 binding:** fill `capture_date: 2026-MM-DD` + `capture_session_id` at capture time, never leave as `TBD-fill-when-captured`)
  - [ ] 8.3 Operator scores 7 dimensions; **explicit checks per carry-forwards:** CF #1 cross-agent regression (D5 — 3rd observation), CF #3 stage directions (D2 — 3rd observation), CF #7 D6-outperforms-baseline (D6 — 3rd observation), CF #12 persona-vs-transcript match (D2)
  - [ ] 8.4 If any dim scores 1: 3-iteration max fixup-rescore loop; escalate via `bmad-correct-course` if not resolved
  - [ ] 8.5 Record scoring at `_bmad-output/planning-artifacts/convoke-report-personality-rubric-scoring-mila-conversion-{YYYY-MM-DD}.md` with **frontmatter `status: pending-operator-confirmation`** (CF #8 binding) until operator confirms D7 at PR review; include `status_transition` field
  - [ ] 8.6 **Wording binding (CF #10):** if Emma's surprise patterns (CF #1 / CF #3) do not replicate in Mila, write "not replicated in 3 observations; pattern likely agent-specific-to-Emma — continue tracking through Stories 2.4-2.7 before declaring decisive". Do NOT use "FALSIFIED" until n≥4 (or until rubric calibration explicitly authorizes the stronger framing).
  - [ ] 8.7 **D6 binding (CF #7):** if Mila outperforms baseline on D6 → 3-of-3 → escalate as architecture-doc finding candidate (track in epic Completion Notes, do not patch architecture mid-story).
  - [ ] 8.8 **Natural commit point** — personality scoring complete

- [ ] **Task 9 — Refresh audit report citations atomically** (Activity 9) (AC12)
  - [ ] 9.1 `grep -rE 'research-convergence-specialist/SKILL\.md#' _bmad-output/planning-artifacts/` — fix or note N/A
  - [ ] 9.2 **Natural commit point** — audit citations refreshed (or note N/A in DAR if no anchors)

- [ ] **Task 10 — Validation suite** (Activity 10) (AC13, AC14)
  - [ ] 10.1 `node scripts/audit/reference-integrity.js` — exit 0
  - [ ] 10.2 `npm run lint` — exit 0 zero warnings on touched files
  - [ ] 10.3 `node --test tests/integration/*.test.js` and `node --test tests/unit/*.test.js` — full regression no new failures

- [ ] **Task 11 — Operator Covenant self-check + Failure Handling documentation** (Activity 11) (AC16, AC17)
  - [ ] 11.1 OC-R0 enumeration (3-layer interaction surface for Mila + 3 capability prompts + slash-command wrapper)
  - [ ] 11.2 OC-R1..R7 self-check; each PASS (OC-R3 + OC-R5 inherit Story 2.1 decisions per CF #5 + #6 — document inheritance, don't rejustify)
  - [ ] 11.3 Record self-check at `_bmad-output/planning-artifacts/convoke-report-operator-covenant-self-check-mila-conversion-{YYYY-MM-DD}.md`
  - [ ] 11.4 Document Failure Handling Pattern modes encountered + resolutions
  - [ ] 11.5 Capture **calibration data** in Dev Agent Record Completion Notes: actual hours/days; surprises vs Wade + Emma; recommendations for Stories 2.4-2.7

- [ ] **Task 12 — Per-agent PR checklist + final DoD gate** (AC18)
  - [ ] 12.1 All 12 items from per-agent PR checklist marked complete
  - [ ] 12.2 All 12 carry-forward bindings (6 from 2.1 + 6 from 2.2 R1) explicitly addressed in Dev Agent Record
  - [ ] 12.3 All ACs (AC1–AC18) demonstrably satisfied
  - [ ] 12.4 Update sprint-status.yaml: `i97-2-3-...: ready-for-dev → in-progress → review` (during execution) → `done` (post-review)

## Dev Notes

### Read in this order before implementing

**Load-bearing for Mila's conversion (per Stories 2.1 + 2.2 calibration carry-forwards):**

1. **Story 2.2 spec (full)** — [`i97-2-2-convert-wade-lean-experiments-specialist.md`](i97-2-2-convert-wade-lean-experiments-specialist.md) — most recent application of the per-agent cycle, includes Round 1 review findings + 6 NEW carry-forwards. **Read the Review Findings section especially** — it documents the new bindings that apply to Mila.
2. **Story 2.1 spec** — [`i97-2-1-convert-emma-contextualization-expert-proof-of-concept.md`](i97-2-1-convert-emma-contextualization-expert-proof-of-concept.md) — POC implementation pattern, original 6 carry-forwards.
3. **Wade Operator Covenant self-check** — [`convoke-report-operator-covenant-self-check-wade-conversion-2026-05-02.md`](../planning-artifacts/convoke-report-operator-covenant-self-check-wade-conversion-2026-05-02.md) — most recent self-check; OC-R3 + OC-R5 inheritance pattern documented.
4. **Wade personality scoring** — [`convoke-report-personality-rubric-scoring-wade-conversion-2026-05-02.md`](../planning-artifacts/convoke-report-personality-rubric-scoring-wade-conversion-2026-05-02.md) — methodology + lowest dim = 4 outcome + n=2 calibration carry-forwards.
5. **Story 2.1 personality scoring** — [`convoke-report-personality-rubric-scoring-emma-conversion-2026-05-02.md`](../planning-artifacts/convoke-report-personality-rubric-scoring-emma-conversion-2026-05-02.md) — original Emma surprise patterns (CF #1 + CF #3).
6. **Calibration memory** — [project_i97_story_2_1_calibration.md](../../../.claude/projects/-Users-amalikamriou-BMAD-Enhanced/memory/project_i97_story_2_1_calibration.md).
7. **Personality rubric (calibrated)** — [`convoke-spec-personality-preservation-rubric.md`](../planning-artifacts/convoke-spec-personality-preservation-rubric.md) — Mila's fingerprint at § "Per-Agent Personality Fingerprints".
8. **Architecture § "Process Patterns"** — [`convoke-arch-bmad-v63-source-format-adoption.md`](../planning-artifacts/convoke-arch-bmad-v63-source-format-adoption.md).
9. **Deferred-work file** — [`deferred-work.md`](deferred-work.md) § "Deferred from: code review of i97-2-2-convert-wade-lean-experiments-specialist (2026-05-02 R1)" — 4 deferred items (JSON validity, sprint-status hunk, test-fixture-isolation, sic typo). Story 2.3 should NOT introduce new instances of these patterns.

### Mila-specific persona notes

From SKILL.md `<persona>` (pre-migration):
> **Role:** Research Convergence + Problem Definition Specialist.
> **Identity:** Expert in converging divergent research streams into actionable problem definitions. Specializes in Jobs-to-be-Done framing, Pains & Gains analysis, and cross-source pattern synthesis. Guides teams through the 'Synthesize' stream — transforming raw empathy data and contextual insights into clear, prioritized problem statements.
> **Communication style:** Warm but analytically precise — connects dots others miss while keeping teams grounded in evidence. Says things like 'Here's what the research is telling us...' and 'Three patterns converge on this insight.' Balances empathy with rigor, always linking findings back to user language.

**Persona fingerprint for rubric scoring:**
- **Synthesis-with-triangulation** — refuses to call something a pattern from one source; "three sources or it's an anecdote"
- **Contradiction-holding** — comfortable surfacing tensions in data without rushing to resolve them
- **Evidence-anchored language** — uses verbatim quotes, not paraphrases; cites cohort sizes; differentiates "what users said" from "what users did"
- **Jobs-to-be-Done lens** — translates "feature requests" into JTBD frames before scoping
- **Cross-source map** — explicitly notes when data is missing from a source class (e.g., "we have NPS but no exit interviews — that's a blindspot")

### Mila-specific capability count consideration

Mila has 3 routed capabilities — fewest of any Vortex agent. Capability prompt authoring is the per-capability-proportional task; tooling maturation through Stories 2.1 + 2.2 means per-prompt cost is now ~5 min each. Mila estimate: 3 prompts × ~5 min = ~15 min total. Total Mila effort: < Wade (since fewer capabilities + cycle proven on 2nd application).

### Pickup-order context

Per epic AR17: Mila and Wade can run in parallel; Mila is the next sequential pick after Wade ships. After Mila ships:
- Stories 2.4 (Isla) + 2.5 (Noah) can run in parallel
- Story 2.6 (Max) sequential after 2.5 (Max processes Noah's signal-interpretation outputs)
- Story 2.7 (Liam) closes Epic 2 — heaviest HC schema, sequential at end

### Same-LLM-bias mitigation

Carry forward Stories 2.1 + 2.2's discipline: when scoring Mila's personality, the dev agent (likely the same LLM that performed the conversion) should NOT score independently. Operator handoff is mandatory at Task 8.1. Same-LLM caveat documented in scoring report; CF #8 binding sets `status: pending-operator-confirmation` until operator confirms at PR review.

### Mila-specific rubric re-calibration trigger

Per epic AR17 #6: if Mila scoring surfaces ambiguity (especially around D5 Failure Handling — she has distinctive uncertainty-acknowledgment patterns: "we don't have enough sources to triangulate yet"), pause + re-calibrate. Do NOT silently re-tune the rubric mid-story; open a backlog row at I97 epic note per the rubric's anti-silent-retune rule.

## Dev Agent Record

### Agent Model Used

Amelia (dev) — Claude Opus 4.7 (1M context). **Same-LLM-bias caveat:** dev agent here is the same LLM that authored the Story 2.3 spec earlier in this session. Operator handoff at Task 8 (personality scoring) is the standard mitigation; CF #8 binding adds `status: pending-operator-confirmation` until operator confirms.

### Debug Log References

_(To be filled during dev — pre-migration git blob, CF #2 gate result, baseline fixture path, etc.)_

### Completion Notes List

_To be filled by dev agent — **especially:**_
1. _Actual effort vs Wade's ~2 hr_
2. _Whether stage directions appeared in Mila (CF #3 — 3rd observation)_
3. _Whether cross-agent escalation regressed in D5/D7 (CF #1 — 3rd observation)_
4. _Whether D6 outperformed baseline (CF #7 — 3rd observation; if 3-of-3 → architecture-doc finding candidate)_
5. _D5-uncalibration risk: did Mila's uncertainty-acknowledgment patterns ("we don't have enough sources yet") map cleanly to the rubric, or surface ambiguity?_
6. _Recommendations for Stories 2.4-2.7_

### File List

_To be filled by dev agent — distinguishing new vs modified files_

## Change Log

| Date | Change | By |
|------|--------|-----|
| 2026-05-02 | Story spec authored by Bob via `bmad-create-story` workflow. Status: ready-for-dev. **Lean version of Wade's spec** (which was lean version of Emma's POC) — Wade-pattern reference + Mila-specific deltas + 12 calibration carry-forwards explicitly bound at AC18 (6 from Story 2.1 + 6 NEW from Story 2.2 Round 1 code review). Estimate: ~1-1.5 hr dev + ~30 min operator capture (Mila has 3 capabilities — fewer than Wade's 5; cycle proven on 3rd application). | Bob (SM) |
