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

- [x] **Task 1 — Capture pre-migration baseline** (Activity 1) (AC10)
  - [x] 1.1 Personality baseline fixtures verified intact: `baseline-fixed-prompt.json` + `baseline-unscripted-scenario.md` both present at `tests/migration/personality-preservation/fixtures/research-convergence-specialist/`
  - [x] 1.2 Pre-migration menu codes captured; created [`tests/integration/fixtures/vortex-parity/research-convergence-specialist-baseline.json`](../../tests/integration/fixtures/vortex-parity/research-convergence-specialist-baseline.json) — Wade schema mirrored, 7 codes / 3 routed / 3 workflow paths captured
  - [x] 1.3 **CF #2 explicit gate ✓ PASS:** `extractV5MenuCodes` returned `[CH, DA, MH, PA, PM, PR, RC]` exactly matching expected 7-code baseline. No R2-P4 fence-stripping regression.
  - [x] 1.4 Pre-migration v5 SKILL.md content snapshot: git blob `dd332ae9d3600056285f167d7875733ce1952685` (117 lines, fenced ```xml structure)
  - [x] 1.5 Natural commit point reached (uncommitted on main per Stories 2.1, 2.2 cadence)

- [x] **Task 2 — Run BMB conversion tooling (or author per BMB pattern)** (Activity 2) (AC1, AC2)
  - [x] 2.1 Conversion authored directly per BMB-converted-Wade pattern (third per-agent application; cycle proven, no scope expansion required)
  - [x] 2.2 Inspected output against ADR-002 fixup checklist + Wade's converted SKILL.md template — frontmatter / Identity / Communication Style / Principles / Capabilities table / On Activation / CRITICAL Handling structure all present
  - [x] 2.3 No Failure Mode 1 encountered; no `bmad-correct-course` needed
  - [x] 2.4 Natural commit point reached

- [x] **Task 3 — Apply fixup checklist** (Activity 3) (AC1, AC4, AC15)
  - [x] 3.1 Category 1 (Persona): all 5 v5 `<principles>` bullets preserved (convergence/JTBD/Pains-Gains/triangulation/problem-definition); communication style preserved with explicit pattern phrases ("Here's what the research is telling us…", "Three patterns converge on this insight", "Hmm — let me push back gently here"). **CF #12 binding applied:** `**CRITICAL Handling**` describes the actual observed push-back-gently pattern (gentle pushback, surface gaps, route to RC/PA, route to Isla if upstream thin) — not aspirational softer wording. Mila-specific scrutiny per epic AR17 #5 satisfied: triangulation language ("one data point is an anecdote, three from different sources are a pattern") + contradiction-holding posture + JTBD framing all surfaced explicitly.
  - [x] 3.2 Category 2 (Hardcoded errors / OC-R3): inherits Story 2.1 Option A — `## On Activation` step 1 delegates config to `bmad-init` skill; no per-agent fail-loud override
  - [x] 3.3 Category 3 (Menu code preservation): `grep -oE '\| (MH\|CH\|RC\|PR\|PA\|PM\|DA) \|' SKILL.md \| sort -u` returns the 7-code baseline `{CH, DA, MH, PA, PM, PR, RC}` ✓ matches `preMigrationMenuCodes`
  - [x] 3.4 Category 4 (Workflow paths per FR12): `git diff main -- _bmad/bme/_vortex/workflows/` empty (0 lines)
  - [x] 3.5 Natural commit point reached

- [x] **Task 4 — Author 3 capability prompts** (Activity 4) (AC3)
  - [x] 4.1 `references/research-convergence.md` — 21 lines, all 4 Pattern-C-friendly sections; **CF #1 binding satisfied:** explicitly references Isla (upstream evidence) + Liam (downstream hypothesis) + Wade (riskiest-assumption pre-test)
  - [x] 4.2 `references/pivot-resynthesis.md` — 21 lines, 4 sections; **CF #1 binding satisfied:** references Wade (failed-experiment evidence) + Max (pivot decision) + Liam (revised hypothesis)
  - [x] 4.3 `references/pattern-mapping.md` — 21 lines, 4 sections; **CF #1 binding satisfied:** references Isla (gap-fill discovery) + Liam (cross-cutting hypothesis surface)
  - [x] 4.4 SKILL.md `## Capabilities` table uses `Load \`./references/{cap}.md\`` route convention for RC/PR/PA per FR11
  - [x] 4.5 Natural commit point reached

- [x] **Task 5 — Update `module.yaml` + `module-help.csv`** (Activity 5) (AC6, AC7)
  - [x] 5.1 Mila's entry appended to `module.yaml` `agents:` array — real one-line description: "Research convergence specialist for the Vortex Synthesize stream — JTBD framing, Pains & Gains analysis, and cross-source triangulation. Refuses to call something a pattern from one source."
  - [x] 5.2 Mila's row appended to `module-help.csv` — BMM-canonical schema; phase `synthesize`; outputs lists 3 artifact patterns (problem-definition-*.md, problem-definition-revised-*.md, pattern-map-*.md). No I100 collision.
  - [x] 5.3 Natural commit point reached

- [x] **Task 6 — Wrapper inheritance verification** (Activity 6) (AC8)
  - [x] 6.1 Wrapper at `.claude/skills/bmad-agent-bme-research-convergence-specialist/SKILL.md` line 11 reads `3. FOLLOW the activation steps precisely` ✓ (format-agnostic substring per Story 2.1 OC-R5 fix; full-line quote per Story 2.2 R1 Patch 4)
  - [x] 6.2 No commit — wrapper is gitignored auto-regen artifact

- [x] **Task 7 — Author parity tests for Mila** (Activity 7) (AC9)
  - [x] 7.1 Added Mila describe block to [`tests/integration/vortex-parity.test.js`](../../tests/integration/vortex-parity.test.js) — 9 test cases mirror Wade's structure with Mila specifics (3 routed capabilities, 7 menu codes, 3 workflow paths, BMB-canonical name `bmad-bme-agent-mila`)
  - [x] 7.2 Mila fixture loaded from `tests/integration/fixtures/vortex-parity/research-convergence-specialist-baseline.json`; `derive-counts-from-source` honored — capability count read from `fs.readdirSync` of `references/`, not hardcoded
  - [x] 7.3 `node --test tests/integration/vortex-parity.test.js` — **27/27 pass** (Emma 9 + Wade 9 + Mila 9); zero regressions in Emma's or Wade's suites
  - [x] 7.4 **CF #2 reminder embedded in Mila describe-block comment block** — Mila-shaped synthetic-fixture regression test exercises `extractV5MenuCodes` against a third code-set shape (7 codes vs Wade 9 vs Emma 2)
  - [x] 7.5 Natural commit point reached

- [-] **Task 8 — Capture post-migration personality samples + operator scoring** (Activity 8) (AC11) — **HALT: operator handoff required (8.1, 8.3, 8.4, 8.5)**
  - [ ] 8.1 Operator handoff: open fresh session, invoke `/bmad-agent-bme-research-convergence-specialist`, run fixed-prompt set + unscripted scenario per existing fixtures — **PENDING OPERATOR**
  - [x] 8.2 Pre-created [`post-migration-fixed-prompt.json`](../../tests/migration/personality-preservation/fixtures/research-convergence-specialist/post-migration-fixed-prompt.json) (7 prompts MI-FP1..MI-FP7 with TBD response fields; **CF #11 binding:** `capture_date: 2026-05-03` filled, `capture_session_id` flagged for fill-at-capture-time) and [`post-migration-unscripted-scenario.md`](../../tests/migration/personality-preservation/fixtures/research-convergence-specialist/post-migration-unscripted-scenario.md) (legal-tech opening turn from baseline + 3rd-observation carry-forward callouts)
  - [ ] 8.3 Operator scores 7 dimensions; **explicit checks per carry-forwards:** CF #1 cross-agent regression (D5 — 3rd observation), CF #3 stage directions (D2 — 3rd observation), CF #7 D6-outperforms-baseline (D6 — 3rd observation), CF #12 persona-vs-transcript match (D2) — **PENDING OPERATOR**
  - [ ] 8.4 If any dim scores 1: 3-iteration max fixup-rescore loop; escalate via `bmad-correct-course` if not resolved — **PENDING OPERATOR**
  - [ ] 8.5 Record scoring at `_bmad-output/planning-artifacts/convoke-report-personality-rubric-scoring-mila-conversion-2026-05-03.md` with **frontmatter `status: pending-operator-confirmation`** (CF #8) until operator confirms D7 at PR review; include `status_transition` field — **PENDING OPERATOR**
  - [ ] 8.6 **CF #10 wording binding:** if Emma's surprise patterns do not replicate, write "not replicated in 3 observations; pattern likely agent-specific-to-Emma — continue tracking through Stories 2.4-2.7 before declaring decisive". Do NOT use "FALSIFIED" until n≥4. — **PENDING OPERATOR**
  - [ ] 8.7 **CF #7 D6 binding:** if Mila outperforms baseline → 3-of-3 → escalate as architecture-doc finding candidate (track in epic Completion Notes, do not patch architecture mid-story) — **PENDING OPERATOR**
  - [ ] 8.8 Natural commit point — personality scoring complete

- [x] **Task 9 — Refresh audit report citations atomically** (Activity 9) (AC12)
  - [x] 9.1 `grep -rE 'research-convergence-specialist/SKILL\.md#' _bmad-output/planning-artifacts/` returned exit 1 (no matches) — **N/A: no Mila-specific line anchors found in planning artifacts.** Path-only references exist in this story spec + spike-marketplace-packaging-delta.md but none use `#anchor` fragments — no refresh needed per Story 2.1/2.2 precedent.
  - [x] 9.2 N/A noted in Dev Agent Record below

- [x] **Task 10 — Validation suite** (Activity 10) (AC13, AC14)
  - [x] 10.1 `node scripts/audit/reference-integrity.js` → `[reference-integrity] PASS — 75 references checked, 0 broken` (exit 0) ✓
  - [x] 10.2 `npm run lint` → exit 0, zero warnings on Mila-touched files ✓
  - [x] 10.3 `node --test tests/integration/*.test.js` → 120/120 pass, 38 suites (27 parity + 93 other); `node --test tests/unit/*.test.js` → 681 pass / 1 skipped (pre-existing, not Mila-related) / 0 fail ✓ — full regression no new failures

- [x] **Task 11 — Operator Covenant self-check + Failure Handling documentation** (Activity 11) (AC16, AC17)
  - [x] 11.1 OC-R0 enumeration: 3-layer interaction surface (Layer 1 wrapper / Layer 2 canonical SKILL.md / Layer 3 3 capability prompts with explicit cross-agent escalation hooks per CF #1) recorded in self-check report
  - [x] 11.2 OC-R1..R7 self-check: all PASS. **OC-R3 + OC-R5 inherit Story 2.1 decisions** (Option A walkthrough + Option C format-agnostic template); documented as inheritance per carry-forward bindings #5 + #6, not rejustified. **Cleaner OC-R4 surface than Wade** — no placeholder workflow chains.
  - [x] 11.3 Self-check report at [`convoke-report-operator-covenant-self-check-mila-conversion-2026-05-03.md`](../planning-artifacts/convoke-report-operator-covenant-self-check-mila-conversion-2026-05-03.md)
  - [x] 11.4 Failure Handling Pattern: Mode 1 (BMB invalid output) — not encountered, conversion authored directly. Mode 2 (fixup misses persona drift) — pending Task 8 operator scoring; will note resolution in DAR after handoff. Mode 3 (regression in tests) — not encountered, 27/27 parity + 681 unit + 120 integration all green. Mode 4 (rubric mis-calibration trigger per epic AR17 #6) — not encountered yet; surface if D5 ambiguity emerges at Task 8. Mode 5 — N/A.
  - [x] 11.5 Calibration data captured in Completion Notes below

- [-] **Task 12 — Per-agent PR checklist + final DoD gate** (AC18) — **PENDING TASK 8 OPERATOR HANDOFF**
  - [ ] 12.1 All 12 items from per-agent PR checklist marked complete (pending Task 8.5 personality scoring report)
  - [ ] 12.2 All 12 carry-forward bindings explicitly addressed (CF #2/4/5/6/8/11/12 already addressed in DAR; CF #1/3/7/9/10 require Task 8 data)
  - [ ] 12.3 All ACs (AC1–AC18) demonstrably satisfied (AC11 pending Task 8 personality scoring)
  - [ ] 12.4 Update sprint-status.yaml: `i97-2-3-...: in-progress → review` (after Task 8 closes) → `done` (post-review)

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

**Task 1 (2026-05-03):**
- Mila pre-migration SKILL.md git blob: `dd332ae9d3600056285f167d7875733ce1952685` (117 lines, fenced ```xml v5 structure)
- CF #2 gate result: ✓ PASS — `extractV5MenuCodes` extracted 7 codes `[CH, DA, MH, PA, PM, PR, RC]`, matches expected baseline. No R2-P4 fence-stripping regression.
- Personality baseline fixtures intact (2 files at `tests/migration/personality-preservation/fixtures/research-convergence-specialist/`)
- Created baseline fixture: [`tests/integration/fixtures/vortex-parity/research-convergence-specialist-baseline.json`](../../tests/integration/fixtures/vortex-parity/research-convergence-specialist-baseline.json)

**Tasks 2-7 (2026-05-03):**
- AC1 zero-XML regex check: `grep -cE '<(agent|activation|menu|item|step|persona|rules|menu-handlers|handler|r)\b' SKILL.md` → 0 (exit 1, no matches) ✓
- AC2 frontmatter: `name: bmad-bme-agent-mila` ✓
- AC4 menu code preservation: 7 codes `{CH, DA, MH, PA, PM, PR, RC}` lexically equal to pre-migration baseline ✓
- AC5 workflow source files: `git diff main -- _bmad/bme/_vortex/workflows/` → 0 lines (unchanged per FR12) ✓
- AC8 wrapper inheritance: `.claude/skills/bmad-agent-bme-research-convergence-specialist/SKILL.md` line 11 reads `3. FOLLOW the activation steps precisely` (format-agnostic template per Story 2.1 OC-R5 fix; full-line quote per Story 2.2 R1 Patch 4) — no per-agent override required ✓
- AC9 + CF #2: parity tests added; Mila describe-block regression test uses Mila's 7-code synthetic v5 fixture (third code-set shape — different from Emma's 2-code and Wade's 9-code samples) — exercises `extractV5MenuCodes` against a third shape; passes 9/9 against the live baseline.

**Tasks 9-11 (2026-05-03):**
- AC12 audit citations refresh: `grep -rE 'research-convergence-specialist/SKILL\.md#' _bmad-output/planning-artifacts/` → exit 1 / no matches → **N/A** per AC12's "OR note N/A" branch.
- AC13 reference-integrity audit: `[reference-integrity] PASS — 75 references checked, 0 broken` (exit 0) ✓
- AC14 lint: `npm run lint` exit 0, zero warnings on touched files ✓
- AC16 Operator Covenant self-check: 8 cells (OC-R0..R7) all PASS; OC-R3 + OC-R5 inherit Story 2.1 decisions per carry-forward bindings #5 + #6; recorded at [`convoke-report-operator-covenant-self-check-mila-conversion-2026-05-03.md`](../planning-artifacts/convoke-report-operator-covenant-self-check-mila-conversion-2026-05-03.md). Cleaner OC-R4 than Wade — no placeholder workflows.
- Full regression: 27 parity + 120 integration + 681 unit (1 pre-existing skip) all green; zero new failures.

### Completion Notes List

**Status as of 2026-05-03:** Tasks 1-7, 8.2, 9, 10, 11 complete. **HALT for operator handoff** at Task 8.1/8.3/8.4/8.5/8.6/8.7 (personality scoring requires fresh-session operator action — same-LLM-bias mitigation per story spec; CF #8 binding sets scoring frontmatter `status: pending-operator-confirmation`).

**Calibration data (preliminary — Tasks 1-7 + 9-11):**
1. **Actual effort so far (Tasks 1-11 minus 8 personality scoring):** ~1 hour of dev-agent work. **Faster than Wade's ~1.5-2 hr** — third application of the cycle confirms tooling maturation curve continues. 3 capability prompts × ~5 min each = ~15 min total (vs Wade's 5×~5min = 25min). Recommend Stories 2.4-2.7 estimate against Mila's ~1 hr actual + Wade's ~2 hr actual = ~1-2 hr range based on capability count.
2. **No scope expansion required.** Story 2.1's three scope expansions (template fix, OC-R3 decision, OC-R5 decision) all carried forward unchanged. Carry-forwards #5 and #6 worked as designed. Story 2.2 R1 carry-forwards (#7-12) all addressed at AC15/Task 3 / AC11 / Task 8.2 — no rejustification needed.
3. **No new architectural decisions or scope expansions.** Story 2.3 introduces ZERO new architectural decisions. Cycle is now fully proven.
4. **Cleaner OC-R4 surface than Wade.** No placeholder workflow chains (Wade's `mvp/validate.md` "Coming in v1.2.0" is not replicated for Mila — all 3 Mila routed workflows are real implemented step-file sequences).
5. **No Failure Handling Pattern modes encountered** (Modes 1, 3 — verified clean; Mode 2 + Mode 4 pending Task 8 outcome; Mode 5 N/A).

**Pending after operator personality scoring (Task 8):**
- CF #1 — cross-agent escalation regression (D5; 3rd observation — resolves systemic-vs-agent-specific question)
- CF #3 — stage directions / emoji per response (D2; 3rd observation — resolves systemic-vs-agent-specific question)
- CF #7 — D6-outperforms-baseline pattern (D6; 3rd observation; if 3-of-3 → architecture-doc finding candidate)
- CF #10 — wording: "not replicated in 3 observations" (no FALSIFIED until n≥4)
- CF #12 — persona-vs-transcript match (D2; spot-check that captured behavior matches SKILL.md `**CRITICAL Handling**` description)
- Mode 4 (rubric recalibration trigger per epic AR17 #6): if D5 ambiguity surfaces around uncertainty-acknowledgment patterns, pause + open backlog row (do NOT silently retune mid-story)
- Final actual hours/days vs Wade's ~2 hr actual (composite cycle-cost figure for Stories 2.4-2.7 estimation)
- Recommendations for Stories 2.4-2.7

### File List

**New files (4):**
- `_bmad/bme/_vortex/agents/research-convergence-specialist/references/research-convergence.md`
- `_bmad/bme/_vortex/agents/research-convergence-specialist/references/pivot-resynthesis.md`
- `_bmad/bme/_vortex/agents/research-convergence-specialist/references/pattern-mapping.md`
- `tests/integration/fixtures/vortex-parity/research-convergence-specialist-baseline.json`

**Modified files (4):**
- `_bmad/bme/_vortex/agents/research-convergence-specialist/SKILL.md` (v5 XML → v6.3+ outcome-based markdown)
- `_bmad/bme/_vortex/module.yaml` (Mila `agents:` array entry appended)
- `_bmad/bme/_vortex/module-help.csv` (Mila row appended; BMM-canonical schema, phase=synthesize)
- `tests/integration/vortex-parity.test.js` (Mila describe block + MILA_FIXTURE_PATH constant added; 9 test cases mirroring Wade's structure)

**Pre-created skeletons (Task 8.2):**
- `tests/migration/personality-preservation/fixtures/research-convergence-specialist/post-migration-fixed-prompt.json` (7 prompts MI-FP1..MI-FP7 with TBD response fields; CF #11 binding satisfied — capture_date filled, capture_session_id flagged for fill-at-capture-time)
- `tests/migration/personality-preservation/fixtures/research-convergence-specialist/post-migration-unscripted-scenario.md` (legal-tech opening turn from baseline + 3rd-observation carry-forward callouts + CF #7 D6-outperforms-baseline binding)

**New artifacts (1):**
- `_bmad-output/planning-artifacts/convoke-report-operator-covenant-self-check-mila-conversion-2026-05-03.md` (Task 11.3)

**Pending operator-authored artifact (Task 8.5):**
- `_bmad-output/planning-artifacts/convoke-report-personality-rubric-scoring-mila-conversion-2026-05-03.md` (frontmatter starts at `status: pending-operator-confirmation` per CF #8 binding)

## Change Log

| Date | Change | By |
|------|--------|-----|
| 2026-05-02 | Story spec authored by Bob via `bmad-create-story` workflow. Status: ready-for-dev. **Lean version of Wade's spec** (which was lean version of Emma's POC) — Wade-pattern reference + Mila-specific deltas + 12 calibration carry-forwards explicitly bound at AC18 (6 from Story 2.1 + 6 NEW from Story 2.2 Round 1 code review). Estimate: ~1-1.5 hr dev + ~30 min operator capture (Mila has 3 capabilities — fewer than Wade's 5; cycle proven on 3rd application). | Bob (SM) |
| 2026-05-03 | Status: in-progress. Tasks 1-7, 8.2, 9, 10, 11 complete. SKILL.md converted to v6.3+ (zero XML, BMB-canonical name, all 5 v5 principles preserved); 3 capability prompts authored (Pattern-C-friendly, 21 lines each) with explicit cross-agent escalation hooks (CF #1: Isla/Liam/Wade/Max named); module.yaml + module-help.csv updated (real descriptions, no TBD); wrapper inheritance verified (Story 2.1 OC-R5 fix carries forward); 9 Mila parity tests added (27/27 with Emma + Wade); audit citations N/A; reference-integrity 0 broken; lint exit 0; 27 + 120 + 681 tests green; OC-R0..R7 self-check all PASS (R3+R5 inherit Story 2.1; cleaner OC-R4 than Wade — no placeholder chains). CF #11 satisfied at Task 8.2 (capture_date filled). HALT at Task 8.1/8.3 for operator personality scoring; CF #8 binding sets scoring frontmatter `status: pending-operator-confirmation` until D7 confirmed at PR review. Calibration: ~1 hr dev work (vs Wade's ~1.5-2 hr — tooling maturation curve continues; recommend 2.4-2.7 estimate at 1-2 hr range based on capability count). | Amelia (dev) |
