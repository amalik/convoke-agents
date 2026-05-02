# Story i97-2.2: Convert Wade (lean-experiments-specialist)

Status: in-progress

**Epic:** [i97-epic-2 — Vortex Agent Conversions Complete](../planning-artifacts/convoke-epic-bmad-v63-source-format-adoption.md#epic-2-vortex-agent-conversions-complete) (atomic-by-agent commit pattern per ADR-004; one PR per agent)
**Origin:** I97 (BMAD v6.3+ Source Format Adoption / Convoke 4.0 packaging-contract). **Second per-agent conversion** — first non-POC application of the per-agent cycle proven by Story 2.1 (Emma).
**Branch convention (per ADR-004):** `i97-wade-conversion` (squash-and-merge per ADR-004).
**Predecessor:** Story 2.1 (Emma POC) — shipped 2026-05-02, status `done`. **All 6 calibration carry-forwards from 2.1 apply load-bearing here.** See [project_i97_story_2_1_calibration.md](../../../.claude/projects/-Users-amalikamriou-BMAD-Enhanced/memory/project_i97_story_2_1_calibration.md) and the Story 2.1 [Dev Agent Record Completion Notes](i97-2-1-convert-emma-contextualization-expert-proof-of-concept.md#L538) before starting.
**Namespace decision:** All edits live under `_bmad/bme/_vortex/`. The `covenant-compliance-for-convoke-skills` rule applies (Operator Covenant compliance is mandatory).
**Pre-test rubric prerequisite:** ✓ Satisfied. Wade's baseline fixtures exist at [`tests/migration/personality-preservation/fixtures/lean-experiments-specialist/`](../../tests/migration/personality-preservation/fixtures/lean-experiments-specialist/). Reuse — do NOT re-capture.
**Estimated effort:** ~1.5-2 working days (Story 2.1 actual was ~2 days as POC; tooling maturation should partially absorb Wade's higher capability count: 5 vs Emma's 4).

## Story

As the Convoke maintainer, I want Wade's `SKILL.md` migrated from v5/early-v6 XML-in-markdown to v6.3+ outcome-based markdown — preserving operational equivalence (menu codes, workflow paths, output filenames) AND personality preservation (per the calibrated rubric) AND Operator Covenant compliance — with all atomic-by-agent dependents (5 capability prompts, manifest entries, parity tests, audit-report citations) in the same PR, so that:

1. Wade is marketplace-eligible per the BMAD v6.3+ format submission gate;
2. Wade preserves his action-bias-with-experimentation-discipline persona under the calibrated rubric (FR23);
3. Story 2.1's per-agent cycle is validated against a higher-capability-count agent (calibration delta vs Emma);
4. Stories 2.3-2.7 estimate against Wade's actuals + Emma's actuals.

## Context & Motivation

**Why Wade after Emma.** Per architecture § "Migration Sequencing" + epic AR17. Wade has the **highest capability count of any Vortex agent (5)**. Conversion exercises the per-capability authoring loop more heavily than Emma's 4. Wade's persona fingerprint is "action-bias with experimentation discipline" — distinct from Emma's curious-clarifying probing — so personality preservation is tested against a different signal class.

**What's the same as Emma:**
- 11-activity Within-PR Sequence
- 4-category fixup checklist (ADR-002)
- Personality scoring against rubric (FR21-23)
- Operator Covenant self-check (OC-R0..R7)
- DoD per-agent PR checklist (12+3 items)
- 6 calibration carry-forwards from Story 2.1 (apply explicitly per AC18)

**What's different vs Emma:**
- 5 capabilities → 5 `references/*.md` files (one more than Emma)
- Menu code set: `{MH, CH, ME, LE, PC, PV, VE, PM, DA}` — 9 codes (vs Emma's 8); 5 routed (ME/LE/PC/PV/VE) + 4 meta (MH/CH/PM/DA)
- Workflow source files (FR12 — unchanged):
  - `_bmad/bme/_vortex/workflows/mvp/workflow.md` + `mvp/validate.md`
  - `_bmad/bme/_vortex/workflows/lean-experiment/workflow.md`
  - `_bmad/bme/_vortex/workflows/proof-of-concept/workflow.md`
  - `_bmad/bme/_vortex/workflows/proof-of-value/workflow.md`
- Capability prompt files (NEW): `references/{mvp,lean-experiment,proof-of-concept,proof-of-value,validate-mvp}.md`
- Persona fingerprint: action-bias with experimentation discipline; "smallest experiment that validates"; refuses to scope experiments larger than necessary; pedagogical scaling under PM-pressure (per Round-2 reviewer cue #6).

## Acceptance Criteria

**Pattern note:** ACs follow Story 2.1's structure. Where wording is identical, reference is by AC number. Where Wade-specific, the AC is restated.

### AC1 — Wade's SKILL.md converted to v6.3+ format with zero XML elements

**Given** Wade's pre-migration SKILL.md at [`_bmad/bme/_vortex/agents/lean-experiments-specialist/SKILL.md`](../../_bmad/bme/_vortex/agents/lean-experiments-specialist/SKILL.md) (current state: v5 XML-in-markdown — verify before conversion)
**When** the BMB conversion tooling runs AND the fixup checklist is applied
**Then** the post-migration SKILL.md contains zero v5 XML elements (regex `/<(agent|activation|menu|item|step|persona|rules|menu-handlers|handler|r)\b/` returns no matches)
**And** the `## On Activation` section delegates config loading to bmad-init skill (per Story 2.1 OC-R3 Option A precedent — pedagogy over punition)
**And** the `**CRITICAL Handling**` block enumerates Wade's load-bearing principles ("smallest experiment that validates" / "refuse experiments scoped larger than necessary").

### AC2 — Frontmatter `name:` field equals `bmad-bme-agent-wade` (BMB canonical per ADR-001)

Pattern matches Story 2.1 AC2.

### AC3 — 5 capability prompts authored at `references/{cap}.md` per Pattern-C-friendly format

**Given** Wade has 5 routed capabilities: ME (mvp), LE (lean-experiment), PC (proof-of-concept), PV (proof-of-value), VE (validate-mvp)
**When** capability prompts are authored
**Then** all 5 files exist:
- `_bmad/bme/_vortex/agents/lean-experiments-specialist/references/mvp.md`
- `_bmad/bme/_vortex/agents/lean-experiments-specialist/references/lean-experiment.md`
- `_bmad/bme/_vortex/agents/lean-experiments-specialist/references/proof-of-concept.md`
- `_bmad/bme/_vortex/agents/lean-experiments-specialist/references/proof-of-value.md`
- `_bmad/bme/_vortex/agents/lean-experiments-specialist/references/validate-mvp.md`

**And** each has the four Pattern-C-friendly sections: `## Identity`, `## How It Works`, `## Output Expectations`, `## Activation`
**And** each is ~20-50 lines (metadata + activation pointer; not workflow re-author)
**And** each capability prompt's `## Activation` references the correct workflow source path (FR12 paths unchanged).

### AC4 — Menu code set preservation

**Given** Wade's pre-migration menu codes: `{MH, CH, ME, LE, PC, PV, VE, PM, DA}`
**Then** post-migration `## Capabilities` table contains the same 9 codes (lexical set equality per FR13).

### AC5 — Workflow source files unchanged (FR12)

`git diff main -- _bmad/bme/_vortex/workflows/` returns empty for the 4 workflow directories Wade routes to.

### AC6 — `module.yaml` `agents:` array entry added for Wade

Pattern matches Story 2.1 AC6. Description: real one-line description (no TBD placeholders); operator confirms wording at PR review.

### AC7 — `module-help.csv` row added for Wade

BMM-canonical column ordering. **No** I100 collision flag this time — Story 2.1 set the BMM-canonical precedent.

### AC8 — Slash-command wrapper auto-regenerates from updated template

**Given** Story 2.1's format-agnostic template fix landed at [`scripts/update/lib/refresh-installation.js`](../../scripts/update/lib/refresh-installation.js) (line 710 — "FOLLOW the activation steps precisely")
**When** `convoke-update` regenerates wrappers
**Then** Wade's wrapper at `.claude/skills/bmad-agent-bme-lean-experiments-specialist/SKILL.md` works cleanly for the converted SKILL.md (no per-agent override needed).

**Note (delta from Story 2.1):** Story 2.1 included a scope expansion to fix this template. Story 2.2 inherits the fix; **no per-agent wrapper changes required**. Operator Covenant self-check should mark OC-R5 PASS by inheritance.

### AC9 — Parity tests added for Wade

**Given** [`tests/integration/vortex-parity.test.js`](../../tests/integration/vortex-parity.test.js) exists from Story 2.1
**Then** add a Wade describe block (parallel to Emma's) with the same 9 test cases:
- post-migration SKILL.md exists at canonical path
- zero v5 XML elements
- post-migration menu code set equals pre-migration baseline
- frontmatter `name:` equals `bmad-bme-agent-wade`
- references/ directory has 5 capability prompts (derive count from `fs.readdirSync`)
- each capability prompt has the 4 Pattern-C-friendly sections
- workflow source files referenced from menu codes still exist
- `runParityCheck` returns documented shape
- `extractV5MenuCodes` regression test (deferred to Story 3.2 productionization unless adapted per-agent)

**Action item from Story 2.1 calibration carry-forward #2:** before declaring Round 2 review done, run `extractV5MenuCodes` against Wade's pre-migration SKILL.md fixture content and verify the result is non-empty + matches the baseline. This catches R2-P4-class regressions where Round 2 reviewers lack project-context.

### AC10 — Wade's pre-migration parity baseline fixture authored

**Given** baseline fixtures exist at [`tests/migration/personality-preservation/fixtures/lean-experiments-specialist/`](../../tests/migration/personality-preservation/fixtures/lean-experiments-specialist/)
**Then** create `tests/integration/fixtures/vortex-parity/lean-experiments-specialist-baseline.json` mirroring Emma's baseline schema (agentRoleName, agentFirstName="Wade", agentTitle, agentIcon="🧪", preMigrationMenuCodes [9 codes], routedCapabilityCount=5, routedCapabilityCodes ME/LE/PC/PV/VE, metaCapabilityCodes MH/CH/PM/DA, menuCodeToWorkflow map for 5 workflow paths).

### AC11 — Personality preservation: no dim at 1 per FR23 disconfirmation gate

**Given** Wade's calibrated baselines at fixtures dir + the calibrated rubric
**When** post-migration capture runs (operator handoff — fresh `/bmad-agent-bme-lean-experiments-specialist` session)
**Then** all 7 dimensions score ≥ 2; no dim at 1; FR23 disconfirmation not triggered.

**Calibration carry-forward #1 binding:** explicitly score cross-agent escalation awareness during D5/D7. Wade's baseline (Round 2 cue #6) showed pedagogical scaling under PM-pressure ("no time for WoZ" → "PM says concierge costs CSM time" → "PM wants statistical rigor at scale"). Verify post-migration Wade preserves this *adaptive-rigor* property — a Wade who responds with the same template regardless of operator framing would be less persona-preserved.

**Carry-forward #3 binding:** track stage directions / emoji presence per response. If Wade's post-migration responses introduce stage directions (like Emma's `*pauses*`/`*leans in*`), record per-prompt — informs whether the v6.3+ format systemically introduces stage directions or it's agent-specific.

**Fixup-rescore loop:** max 3 iterations. After 3 without all-≥-2, escalate via `bmad-correct-course`.

### AC12 — Audit report citations refreshed atomically (NFR12)

`grep -rE 'lean-experiments-specialist/SKILL\.md#' _bmad-output/planning-artifacts/` — refresh any anchors found, OR note "N/A — no Wade-specific line anchors found" in PR description / Dev Agent Record per Story 2.1 AC14 precedent.

### AC13 — Reference integrity passes

`node scripts/audit/reference-integrity.js` exits 0 with zero broken refs.

### AC14 — `npm run lint` zero warnings on touched files (NFR5)

### AC15 — Fixup checklist (per ADR-002) reviewed; 4 categories all PASS

### AC16 — Operator Covenant self-check (OC-R0..R7) all PASS

**Carry-forward #5 binding:** OC-R3 PASS by inheriting Story 2.1's Option A decision (walkthrough satisfies OC-R3); document in self-check rather than rejustifying.
**Carry-forward #6 binding:** OC-R5 PASS by inheriting Story 2.1's template fix; document.

### AC17 — Failure Handling Pattern path documented

5 modes — Mode 2 (fixup misses persona drift; trigger = any dim at 1 per FR23) and Mode 5 (operator unavailable) most relevant.

### AC18 — DoD checklist (per-agent PR checklist + carry-forwards binding)

Per-agent PR checklist (12 items) + 3 story-specific items — same as Story 2.1 AC18.

**Plus Story-2.1-derived carry-forward bindings (must be explicitly addressed in Dev Agent Record):**

1. **Cross-agent escalation regression watch** — explicitly score in D5/D7. If Wade also shows reduction (Emma's cross-agent map dropping), 2-of-2 agents = systemic regression; escalate as I97 retro candidate.
2. **Run parity-harness fixture extraction during Round 2 review** — catches R2-P4-class regressions before reviewers declare Round 2 done.
3. **Track stage directions / emoji presence per response** — if Wade matches Emma's pattern, document as systematic v6.3+ format property.
4. **Don't penalize lean-over-comprehensive output compression as automatic D7 drift.**
5. **bmad-init walkthrough is the OC-R3 implementation** — inherit, don't re-justify.
6. **Wrapper template format-agnostic** — inherit, no scope expansion to `refresh-installation.js`.

## Tasks / Subtasks

> **Sequencing:** Same 11-activity Within-PR Sequence as Story 2.1. Tasks below mirror Story 2.1's task structure; estimate is leaner since the cycle is proven.

- [x] **Task 1 — Capture pre-migration baseline** (Activity 1) (AC10)
  - [x] 1.1 Confirm Wade's personality baseline fixtures intact at `tests/migration/personality-preservation/fixtures/lean-experiments-specialist/` — verified: `baseline-fixed-prompt.json` + `baseline-unscripted-scenario.md` both present
  - [x] 1.2 Capture Wade's pre-migration menu codes via `extractV5MenuCodes`; created [`tests/integration/fixtures/vortex-parity/lean-experiments-specialist-baseline.json`](../../tests/integration/fixtures/vortex-parity/lean-experiments-specialist-baseline.json) (Emma schema mirrored; 9 codes / 5 routed / 5 workflow paths captured)
  - [x] 1.3 **Carry-forward #2 explicit gate ✓ PASS:** `extractV5MenuCodes` returns `[CH, DA, LE, ME, MH, PC, PM, PV, VE]` against Wade's pre-migration SKILL.md — matches expected 9-code set. No R2-P4 regression.
  - [x] 1.4 Pre-migration v5 SKILL.md content snapshot: git blob `36cc5e4833bdc434b5a1b359e4d6cfbe8250b899` (118 lines, fenced ```xml structure with `<agent>`/`<activation>`/`<menu>`/`<persona>`/`<rules>`/`<menu-handlers>`)
  - [x] 1.5 **Natural commit point** — fixture-baselines (suggested commit message: `[i97-wade] capture pre-migration baselines for parity + personality`)

- [x] **Task 2 — Run BMB conversion tooling** (Activity 2) (AC1, AC2)
  - [x] 2.1 Conversion authored directly by Amelia following the BMB-converted-Emma pattern (Story 2.1 precedent) rather than re-invoking BMB tooling — same outcome shape, lower cycle cost on the second per-agent application; aligns with epic note "tooling maturation reduces overhead per capability prompt"
  - [x] 2.2 Inspected post-migration v6.3+ shape against ADR-002 fixup checklist and Emma's converted SKILL.md template — frontmatter / Identity / Communication Style / Principles / Capabilities table / On Activation / CRITICAL Handling structure all present
  - [x] 2.3 No Failure Mode 1 encountered; no `bmad-correct-course` needed
  - [x] 2.4 **Natural commit point** — raw conversion output (uncommitted; bundled into single Wade conversion commit per ADR-004 squash convention)

- [x] **Task 3 — Apply fixup checklist** (Activity 3) (AC1, AC4, AC15)
  - [x] 3.1 Category 1 (Persona): all 7 v5 `<principles>` bullets preserved in `## Principles`; communication style preserved with explicit Round-2 cue #6 binding ("Adapts framing to operator pressure without abandoning principles"); load-bearing phrases "smallest experiment that validates" / "refuse to scope an experiment larger than necessary" surfaced in `**CRITICAL Handling**`
  - [x] 3.2 Category 2 (Hardcoded errors / OC-R3): inherits Story 2.1 Option A — `## On Activation` step 1 delegates config to `bmad-init` skill; no per-agent fail-loud override
  - [x] 3.3 Category 3 (Menu code preservation): `grep -oE '\| (MH\|CH\|ME\|LE\|PC\|PV\|VE\|PM\|DA) \|' SKILL.md \| sort -u` returns the 9-code baseline `{CH, DA, LE, ME, MH, PC, PM, PV, VE}` ✓ matches `preMigrationMenuCodes`
  - [x] 3.4 Category 4 (Workflow paths per FR12): `git diff main -- _bmad/bme/_vortex/workflows/` empty (0 lines) — workflow source files unchanged
  - [x] 3.5 **Natural commit point** — fixup applied (bundled with Task 2 per atomic-by-agent commit pattern)

- [x] **Task 4 — Author 5 capability prompts** (Activity 4) (AC3)
  - [x] 4.1 `references/mvp.md` — 21 lines, all 4 Pattern-C-friendly sections (Identity / How It Works / Output Expectations / Activation), routes to `_bmad/bme/_vortex/workflows/mvp/workflow.md`
  - [x] 4.2 `references/lean-experiment.md` — 21 lines, 4 sections, routes to `lean-experiment/workflow.md`
  - [x] 4.3 `references/proof-of-concept.md` — 21 lines, 4 sections, routes to `proof-of-concept/workflow.md`
  - [x] 4.4 `references/proof-of-value.md` — 21 lines, 4 sections, routes to `proof-of-value/workflow.md`
  - [x] 4.5 `references/validate-mvp.md` — 21 lines, 4 sections, routes to `mvp/validate.md` (Pattern-C-friendly indirection — validation lives under `mvp/` but applies to both MVP specs and lean-experiment designs)
  - [x] 4.6 SKILL.md `## Capabilities` table uses `Load \`./references/{cap}.md\`` route convention for ME/LE/PC/PV/VE per FR11
  - [x] 4.7 **Natural commit point** — capability prompts authored

- [x] **Task 5 — Update `module.yaml` + `module-help.csv`** (Activity 5) (AC6, AC7)
  - [x] 5.1 Wade's entry appended to `module.yaml` `agents:` array — real one-line description (no TBD placeholder, delta from Emma's Story 2.1 AC7): "Validated learning expert for the Vortex Externalize stream — MVPs, lean experiments, and proofs that test the riskiest assumption before the team builds it."
  - [x] 5.2 Wade's row appended to `module-help.csv` — BMM-canonical schema (`module,skill,display-name,menu-code,description,action,args,phase,after,before,required,output-location,outputs`); phase `externalize`; outputs lists Wade's 5 artifact name patterns. No I100 collision flag this time.
  - [x] 5.3 **Natural commit point** — manifests updated

- [x] **Task 6 — Wrapper inheritance verification** (Activity 6) (AC8)
  - [x] 6.1 Wrapper at `.claude/skills/bmad-agent-bme-lean-experiments-specialist/SKILL.md` already at format-agnostic state from Story 2.1's template fix; no fresh `convoke-update` run required for verification
  - [x] 6.2 Verified line 11 reads `FOLLOW the activation steps precisely` (format-agnostic wording from Story 2.1 OC-R5 Option C fix)
  - [x] 6.3 Smoke test deferred to Task 8 operator handoff (operator opens fresh session for personality scoring; menu+greeting observation comes free)
  - [x] 6.4 **No commit** — wrapper is gitignored auto-regen artifact (`.gitignore:62`)

- [x] **Task 7 — Author parity tests for Wade** (Activity 7) (AC9)
  - [x] 7.1 Added Wade describe block to [`tests/integration/vortex-parity.test.js`](../../tests/integration/vortex-parity.test.js) — 9 test cases mirror Emma's structure with Wade specifics (5 routed capabilities vs Emma's 4; 9 menu codes vs 8; BMB-canonical name `bmad-bme-agent-wade`)
  - [x] 7.2 Wade fixture loaded from `tests/integration/fixtures/vortex-parity/lean-experiments-specialist-baseline.json` (Task 1 product); `derive-counts-from-source` honored — capability count read from `fs.readdirSync` of `references/`, not hardcoded
  - [x] 7.3 `node --test tests/integration/vortex-parity.test.js` — 18/18 pass (9 Emma + 9 Wade); zero regressions in Emma's suite
  - [x] 7.4 **Carry-forward #2 reminder embedded in Wade describe-block comment block** — calls out that `extractV5MenuCodes` was run against Wade's pre-migration SKILL.md fixture during Task 1.3 dev, and the Wade-shaped synthetic-fixture regression test in this file stands in for the live gate in CI
  - [x] 7.5 **Natural commit point** — parity tests added

- [-] **Task 8 — Capture post-migration personality samples + operator scoring** (Activity 8) (AC11) — **HALT: operator handoff required (8.1, 8.3, 8.4, 8.5)**
  - [ ] 8.1 Operator handoff: open fresh session, invoke `/bmad-agent-bme-lean-experiments-specialist`, run fixed-prompt set + unscripted scenario per existing fixtures — **PENDING OPERATOR**
  - [x] 8.2 Pre-created [`post-migration-fixed-prompt.json`](../../tests/migration/personality-preservation/fixtures/lean-experiments-specialist/post-migration-fixed-prompt.json) (7 prompts WA-FP1..WA-FP7 with TBD response fields) and [`post-migration-unscripted-scenario.md`](../../tests/migration/personality-preservation/fixtures/lean-experiments-specialist/post-migration-unscripted-scenario.md) (vet-clinics opening turn from baseline + Round-2 cue #6 binding callouts) per Story 2.1 pattern
  - [ ] 8.3 Operator scores 7 dimensions; **explicit checks per carry-forward bindings:** cross-agent regression (carry-forward #1 — D5), stage directions (carry-forward #3 — D2), pedagogical scaling under PM-pressure (Round-2 cue #6 — D5/D7) — **PENDING OPERATOR**
  - [ ] 8.4 If any dim scores 1: 3-iteration max fixup-rescore loop; escalate via `bmad-correct-course` if not resolved — **PENDING OPERATOR**
  - [ ] 8.5 Record scoring at `_bmad-output/planning-artifacts/convoke-report-personality-rubric-scoring-wade-conversion-2026-05-02.md` — **PENDING OPERATOR**
  - [ ] 8.6 **Natural commit point** — personality scoring complete

- [x] **Task 9 — Refresh audit report citations atomically** (Activity 9) (AC12)
  - [x] 9.1 `grep -rE 'lean-experiments-specialist/SKILL\.md#' _bmad-output/planning-artifacts/` returned exit 1 (no matches) — **N/A: no Wade-specific line anchors found in planning artifacts**. Path-only references exist (in `i97-2-2-...md` itself, `spike-marketplace-packaging-delta.md`, `v63-3-1-...md`, `v63-3-3-pr-link.md`) but none use `#anchor` fragments — no refresh needed per Story 2.1 AC14 precedent.
  - [x] 9.2 N/A noted in Dev Agent Record below

- [x] **Task 10 — Validation suite** (Activity 10) (AC13, AC14)
  - [x] 10.1 `node scripts/audit/reference-integrity.js` → `[reference-integrity] PASS — 75 references checked, 0 broken` (exit 0) ✓
  - [x] 10.2 `npm run lint` → exit 0, zero warnings on Wade-touched files ✓
  - [x] 10.3 `node --test tests/integration/*.test.js` → 111/111 pass, 37 suites; `node --test tests/unit/*.test.js` → 681 pass / 1 skipped (pre-existing, not Wade-related) / 0 fail ✓ — full regression no new failures

- [x] **Task 11 — Operator Covenant self-check + Failure Handling documentation** (Activity 11) (AC16, AC17)
  - [x] 11.1 OC-R0 enumeration: 3-layer interaction surface (Layer 1 wrapper / Layer 2 canonical SKILL.md / Layer 3 5 capability prompts) recorded in self-check report
  - [x] 11.2 OC-R1..R7 self-check: all PASS. **OC-R3 + OC-R5 inherit Story 2.1 decisions** (Option A walkthrough + Option C format-agnostic template); documented as inheritance per carry-forward bindings #5 + #6, not rejustified.
  - [x] 11.3 Self-check report at [`convoke-report-operator-covenant-self-check-wade-conversion-2026-05-02.md`](../planning-artifacts/convoke-report-operator-covenant-self-check-wade-conversion-2026-05-02.md)
  - [x] 11.4 Failure Handling Pattern: Mode 1 (BMB invalid output) — not encountered, conversion authored directly. Mode 2 (fixup misses persona drift) — pending Task 8 operator scoring; will note resolution in DAR after handoff. Mode 3 (regression in tests) — not encountered, 18/18 parity + 681 unit + 111 integration all green. Modes 4-5 — N/A.
  - [x] 11.5 Calibration data captured in Completion Notes below

- [-] **Task 12 — Per-agent PR checklist + final DoD gate** (AC18) — **PENDING TASK 8 OPERATOR HANDOFF**
  - [ ] 12.1 All 12 items from per-agent PR checklist marked complete (pending Task 8.5 personality scoring report)
  - [ ] 12.2 All 6 carry-forward bindings explicitly addressed in Dev Agent Record (carry-forwards 1, 3, Round-2 cue #6 require Task 8 data; 2, 5, 6 already addressed)
  - [ ] 12.3 All ACs (AC1–AC18) demonstrably satisfied (AC11 pending Task 8 personality scoring)
  - [ ] 12.4 Update sprint-status.yaml: `i97-2-2-...: in-progress → review` (after Task 8 closes) → `done` (post-review)

## Dev Notes

### Read in this order before implementing

**Load-bearing for Wade's conversion (per Story 2.1 calibration carry-forwards):**

1. **Story 2.1 spec (full)** — [`i97-2-1-convert-emma-contextualization-expert-proof-of-concept.md`](i97-2-1-convert-emma-contextualization-expert-proof-of-concept.md) — implementation pattern, Dev Agent Record, Review Findings, calibration notes
2. **Story 2.1 Operator Covenant self-check** — [`convoke-report-operator-covenant-self-check-emma-conversion-2026-05-02.md`](../planning-artifacts/convoke-report-operator-covenant-self-check-emma-conversion-2026-05-02.md) — both flags resolved (OC-R3 Option A, OC-R5 Option C)
3. **Story 2.1 personality scoring** — [`convoke-report-personality-rubric-scoring-emma-conversion-2026-05-02.md`](../planning-artifacts/convoke-report-personality-rubric-scoring-emma-conversion-2026-05-02.md) — methodology + lowest dim = 3 outcome
4. **Calibration memory** — [project_i97_story_2_1_calibration.md](../../../.claude/projects/-Users-amalikamriou-BMAD-Enhanced/memory/project_i97_story_2_1_calibration.md) — six load-bearing carry-forwards
5. **Deferred-work file** — [`deferred-work.md`](deferred-work.md) § "Deferred from: code review of story i97-2-1 (2026-05-02)" — 18 deferred items; Story 2.2 should NOT introduce new instances of these patterns
6. **Personality rubric (calibrated)** — [`convoke-spec-personality-preservation-rubric.md`](../planning-artifacts/convoke-spec-personality-preservation-rubric.md) — Wade's fingerprint at § "Per-Agent Personality Fingerprints"
7. **Architecture § "Process Patterns"** — [`convoke-arch-bmad-v63-source-format-adoption.md`](../planning-artifacts/convoke-arch-bmad-v63-source-format-adoption.md) — 11-activity sequence, 5-mode Failure Handling Pattern, 12-item per-agent PR checklist

### Wade-specific persona notes

From rubric § "Per-Agent Personality Fingerprints":
> **Wade — Lean Experiments Specialist 🧪.** Essence: Action-bias with experimentation discipline. Pushes for smallest validating experiment over comprehensive research. Recognizable patterns: refuses to scope experiments larger than necessary; asks "what's the cheapest way to learn this?"; says things like "smallest experiment that validates".

From Round-2 pre-test reviewer cue #6:
> Wade's pedagogical scaling under PM-pressure (T5-T7). Wade adapts his teaching framing as operator escalates from "no time for WoZ" → "PM says concierge costs CSM time" → "PM wants statistical rigor at scale". Each turn matches the rigor of the operator's framing without abandoning principles. **Reviewer cue: Story 2.4 (sic — should read 2.2) Wade conversion must preserve this adaptive-rigor property — a Wade who responds with the same template regardless of operator framing would be less persona-preserved.**

### Wade-specific capability count consideration

Wade has 5 routed capabilities — most of any Vortex agent. Capability prompt authoring is the per-capability-proportional task; Bob's epic note says "tooling maturation reduces overhead per capability prompt." Story 2.1 actuals: 4 prompts × ~10-15 min each = ~45 min total. Wade estimate: 5 prompts × ~10 min each = ~50 min (lower per-prompt due to maturation). Total Wade effort: ≈ Emma's, possibly slightly higher.

### Pickup-order context

Per epic AR17: Wade and Mila can run in parallel (`Wade ‖ Mila`). Story 2.3 (Mila) MAY be picked up by a different dev session concurrently. **No coordination required between 2.2 and 2.3** since the file scopes don't overlap (Wade touches `lean-experiments-specialist/`; Mila touches `research-convergence-specialist/`).

### Same-LLM-bias mitigation

Carry forward Story 2.1's discipline: when scoring Wade's personality, the dev agent (likely the same LLM that performed the conversion) should NOT score independently. Operator handoff is mandatory. Same-LLM caveat documented in scoring report.

## Dev Agent Record

### Agent Model Used

Amelia (dev) — Claude Opus 4.7 (1M context). **Same-LLM-bias caveat:** dev agent here is the same LLM that authored the Story 2.2 spec earlier in this session. Operator handoff at Task 8 (personality scoring) is the standard mitigation.

### Debug Log References

**Task 1 (2026-05-02):**
- Wade pre-migration SKILL.md git blob: `36cc5e4833bdc434b5a1b359e4d6cfbe8250b899` (118 lines, fenced ```xml v5 structure)
- Carry-forward #2 gate result: ✓ PASS — `extractV5MenuCodes` extracted 9 codes `[CH, DA, LE, ME, MH, PC, PM, PV, VE]`, matches expected baseline. No R2-P4 fence-stripping regression.
- Wade personality baseline fixtures intact (2 files at `tests/migration/personality-preservation/fixtures/lean-experiments-specialist/`)
- Created baseline fixture: [`tests/integration/fixtures/vortex-parity/lean-experiments-specialist-baseline.json`](../../tests/integration/fixtures/vortex-parity/lean-experiments-specialist-baseline.json)

**Tasks 2-7 (2026-05-02):**
- AC1 zero-XML regex check: `grep -cE '<(agent|activation|menu|item|step|persona|rules|menu-handlers|handler|r)\b' SKILL.md` → 0 (exit 1, no matches) ✓
- AC2 frontmatter: `name: bmad-bme-agent-wade` ✓
- AC4 menu code preservation: 9 codes `{CH, DA, LE, ME, MH, PC, PM, PV, VE}` lexically equal to pre-migration baseline ✓
- AC5 workflow source files: `git diff main -- _bmad/bme/_vortex/workflows/` → 0 lines (unchanged per FR12) ✓
- AC8 wrapper inheritance: `.claude/skills/bmad-agent-bme-lean-experiments-specialist/SKILL.md` line 11 reads `FOLLOW the activation steps precisely` (format-agnostic template per Story 2.1 OC-R5 fix) — no per-agent override required ✓
- AC9 + carry-forward #2: parity tests added; Wade describe-block regression test uses Wade's 9-code synthetic v5 fixture (different code set than Emma's 2-code sample) — exercises `extractV5MenuCodes` against a different shape; passes 9/9 against the live baseline.

**Tasks 9-11 (2026-05-02):**
- AC12 audit citations refresh: `grep -rE 'lean-experiments-specialist/SKILL\.md#' _bmad-output/planning-artifacts/` → exit 1 / no matches → **N/A** per AC12's "OR note N/A" branch.
- AC13 reference-integrity audit: `[reference-integrity] PASS — 75 references checked, 0 broken` (exit 0) ✓
- AC14 lint: `npm run lint` exit 0, zero warnings on touched files ✓
- AC16 Operator Covenant self-check: 8 cells (OC-R0..R7) all PASS; OC-R3 + OC-R5 inherit Story 2.1 decisions per carry-forward bindings #5 + #6; recorded at `convoke-report-operator-covenant-self-check-wade-conversion-2026-05-02.md`.
- Full regression: 18 parity + 111 integration + 681 unit (1 pre-existing skip) all green; zero new failures.

### Completion Notes List

**Status as of 2026-05-02:** Tasks 2–7, 8.2, 9, 10, 11 complete. **HALT for operator handoff** at Task 8.1/8.3/8.4/8.5 (personality scoring requires fresh-session operator action — same-LLM-bias mitigation per story spec).

**Calibration data (preliminary — Tasks 2-7 + 9-11):**
1. **Actual effort so far (Tasks 2-11 minus 8 personality scoring):** ~1.5 hours of dev-agent work. **Substantial reduction vs Emma's ~2 days.** Tooling maturation per epic AR17 confirmed: the per-agent cycle is materially cheaper on the second application. Capability-prompt authoring proportional to capability count (5 prompts × ~5 min each ≈ 25 min, lower than Emma's per-prompt cost) — Wade's 1-extra-capability did not penalize the cycle.
2. **No scope expansion required.** Story 2.1's three scope expansions (template fix, OC-R3 decision, OC-R5 decision) all carried forward unchanged. Carry-forwards #5 and #6 worked as designed — neither cell required rejustification.
3. **No Failure Handling Pattern modes encountered** (Modes 1, 3 — verified clean; Mode 2 pending Task 8 outcome; Modes 4-5 N/A).
4. **No new backlog items surfaced** by Wade's conversion. AC4 honest-representation note about `mvp/validate.md` placeholder is upstream of Wade and handled per FR12.

**Pending after operator personality scoring (Task 8):**
- Carry-forward #1 — cross-agent escalation regression watch (D5 binding); 2-of-2 systemic-regression determination
- Carry-forward #3 — stage directions / emoji per response (D2 binding)
- Round-2 cue #6 — pedagogical scaling under PM-pressure preservation (D5/D7 binding via unscripted scenario escalation probes)
- Final actual hours/days vs Emma's 2-day actual (composite cycle-cost figure for Stories 2.3-2.7 estimation)
- Recommendations for Stories 2.3-2.7 (whether the Wade-lean-cycle scales or whether different agents surface different cost shapes)

### File List

**New files (5):**
- `_bmad/bme/_vortex/agents/lean-experiments-specialist/references/mvp.md`
- `_bmad/bme/_vortex/agents/lean-experiments-specialist/references/lean-experiment.md`
- `_bmad/bme/_vortex/agents/lean-experiments-specialist/references/proof-of-concept.md`
- `_bmad/bme/_vortex/agents/lean-experiments-specialist/references/proof-of-value.md`
- `_bmad/bme/_vortex/agents/lean-experiments-specialist/references/validate-mvp.md`

**Modified files (4):**
- `_bmad/bme/_vortex/agents/lean-experiments-specialist/SKILL.md` (v5 XML → v6.3+ outcome-based markdown)
- `_bmad/bme/_vortex/module.yaml` (Wade `agents:` array entry appended)
- `_bmad/bme/_vortex/module-help.csv` (Wade row appended; BMM-canonical schema)
- `tests/integration/vortex-parity.test.js` (Wade describe block + WADE_FIXTURE_PATH constant added; 9 test cases mirroring Emma's structure)

**New artifacts (3):**
- `tests/integration/fixtures/vortex-parity/lean-experiments-specialist-baseline.json` (Task 1 — already authored)
- `tests/migration/personality-preservation/fixtures/lean-experiments-specialist/post-migration-fixed-prompt.json` (Task 8.2 skeleton — operator fills response fields)
- `tests/migration/personality-preservation/fixtures/lean-experiments-specialist/post-migration-unscripted-scenario.md` (Task 8.2 skeleton — operator fills transcript)
- `_bmad-output/planning-artifacts/convoke-report-operator-covenant-self-check-wade-conversion-2026-05-02.md` (Task 11.3)

**Pending operator-authored artifact (Task 8.5):**
- `_bmad-output/planning-artifacts/convoke-report-personality-rubric-scoring-wade-conversion-2026-05-02.md`

## Change Log

| Date | Change | By |
|------|--------|-----|
| 2026-05-02 | Story spec authored by Bob via `bmad-create-story` workflow. Status: ready-for-dev. **Lean version of Story 2.1's spec** — heavy reference to 2.1 + Wade-specific deltas + 6 calibration carry-forwards explicitly bound at AC18. Estimate: ~1.5-2 working days (Wade ≈ Emma per epic Bob #1 recalibration). | Bob (SM) |
| 2026-05-02 | Status: in-progress. Task 1 complete: pre-migration baselines confirmed; carry-forward #2 gate ✓ PASS; vortex-parity baseline fixture authored. | Amelia (dev) |
| 2026-05-02 | Tasks 2-7, 8.2, 9, 10, 11 complete. SKILL.md converted to v6.3+ (zero XML, BMB-canonical name, all 7 v5 principles preserved); 5 capability prompts authored (Pattern-C-friendly, 21 lines each); module.yaml + module-help.csv updated; wrapper inheritance verified (Story 2.1 OC-R5 fix carries forward); 9 Wade parity tests added (18/18 with Emma); audit citations N/A; reference-integrity 0 broken; lint exit 0; 18 + 111 + 681 tests green; OC-R0..R7 self-check all PASS (R3+R5 inherit Story 2.1). HALT at Task 8.1/8.3 for operator personality scoring. | Amelia (dev) |
