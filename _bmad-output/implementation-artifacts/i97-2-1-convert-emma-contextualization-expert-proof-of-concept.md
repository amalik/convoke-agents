# Story i97-2.1: Convert Emma (contextualization-expert) — Proof-of-Concept

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

**Epic:** [i97-epic-2 — Vortex Agent Conversions Complete](../planning-artifacts/convoke-epic-bmad-v63-source-format-adoption.md#epic-2-vortex-agent-conversions-complete) (atomic-by-agent commit pattern per ADR-004; one PR per agent)
**Origin:** I97 (BMAD v6.3+ Source Format Adoption / Convoke 4.0 packaging-contract). This is the **first per-agent conversion** — the proof-of-concept. Per epic Bob #1 refinement: **Sprint 1 commits THIS story only**; subsequent E2 stories (2.2 Wade, 2.3 Mila, 2.4 Isla, 2.5 Noah, 2.6 Max, 2.7 Liam) are committed Sprint 2+ based on Emma's actual effort emergence.
**Variance commentary (from epic spec line 451):** "May take 2-3x estimated effort." That's by design — Emma is the calibration data point. Whatever this story actually takes, downstream sibling agent conversions estimate against Emma's actuals.
**Branch convention (per ADR-004):** `i97-emma-conversion` (canonical per architecture § D5; one PR squash-and-merged at end).
**Namespace decision:** All edits live under Convoke's `_bmad/bme/_vortex/` namespace + the `.claude/skills/bmad-agent-bme-contextualization-expert/` slash-command wrapper. The `namespace-decision-for-new-skills` rule (project-context.md) is **load-bearing here** — Emma is a `_bmad/bme/` skill, so the **`covenant-compliance-for-convoke-skills` rule applies** (Operator Covenant compliance is mandatory; see AC §"Operator Covenant compliance" below). Per architecture § D5, the `bmad-bme-agent-emma` canonical name is the BMB convention; `bmad-agent-bme-contextualization-expert` (existing slash-command wrapper) stays as compatibility alias (no rename).
**Safety analysis (path-safety rule):** No new scripts that accept user paths or perform destructive operations are added. The conversion uses BMB tooling (`bmad-agent-builder` + `bmad-workflow-builder` "convert" mode) which operates on author-controlled file paths in a known location. Story i97-1.1's harness scripts are read-only against `projectRoot` parameters; this story consumes them but does not introduce new path-handling surface.
**Pre-test rubric prerequisite:** ✓ Satisfied. Story 1.2 (rubric calibration) is `done` (rubric status: `calibrated`, 49/49 cells across both rounds). Emma's baseline fixtures exist at [`tests/migration/personality-preservation/fixtures/contextualization-expert/`](../../tests/migration/personality-preservation/fixtures/contextualization-expert/). This story may **reuse Story 1.2 baselines** (per epic line 461) rather than re-capture.

## Story

As the Convoke maintainer (Amalik) and any future dev agent picking up subsequent E2 conversions,
I want Emma's `SKILL.md` migrated from v5/early-v6 XML-in-markdown to v6.3+ outcome-based markdown — preserving operational equivalence (menu codes, workflow paths, output filenames) AND personality preservation (per the calibrated rubric) AND Operator Covenant compliance — with all atomic-by-agent dependents (capability prompts, manifests, slash-command wrapper, parity tests, audit-report citations) in the same PR,
so that:
1. Emma is marketplace-eligible per the BMAD v6.3+ format submission gate (per the marketplace PR #9 rejection that triggered I97);
2. Operators experience zero functional disruption per Journey 1 (mid-migration crossover);
3. Emma's actual conversion effort calibrates the per-agent estimate for Stories 2.2–2.7;
4. The 11-activity Within-PR Sequence + 5-mode Failure Handling Pattern (Epic 2 header) prove out before being applied 6 more times to siblings;
5. The per-agent dev cycle pattern in architecture § "Process Patterns" is validated against a real conversion.

## Context & Motivation

**Why Emma first.** Per architecture § "Migration Sequencing" + epic AR17: Emma → Wade ‖ Mila → Isla ‖ Noah ‖ Max → Liam. Emma is the deliberate POC because: (a) her persona is well-documented (curious-clarifying probing — characteristic markers like "Before we build, let's clarify..."); (b) her menu has both workflow capabilities (LP/PV/CS/VL) and meta items (MH/CH/PM/DA) — exercises the routing layer's distinction between routed-to-references and meta-items; (c) her capability count is 4 — middle-of-the-pack (Wade is 5, Mila is 3, Liam has only 3 but with HC schema density) — so she's a fair calibration sample; (d) her workflow source files (`lean-persona`, `product-vision`, `contextualize-scope`) are typical-shape — not exceptionally complex like Liam's HC1-HC5 contracts.

**Calibration purpose.** Per Bob #1 + variance commentary: this story is allowed to take 2-3x its estimated effort. The pattern Emma proves out includes:
- BMB tooling invocation flow + output review against fixup checklist
- Fixup checklist application (4 categories from `scripts/migration/format-conversion/fixup-checklist.md`)
- Capability prompt authoring at `references/{cap}.md` per Pattern-C-friendly format (Identity / How It Works / Output Expectations / Activation)
- `module.yaml` + `module-help.csv` schema population (BMM-canonical column ordering)
- Slash-command wrapper update (alias preserved per ADR-001)
- Parity test authoring + scoring against pre/post baselines
- Operator personality scoring against the calibrated rubric (FR23 disconfirmation gate)
- Audit-report citation refresh (NFR12 atomic update)
- The 11-activity Within-PR Sequence in execution
- Atomic-by-agent commit (squash-and-merge per ADR-004)

The actual hours/days this takes is itself a deliverable — captured in the Dev Agent Record Completion Notes for Story 2.2+ planning.

**What this story is NOT doing.**
- **Not authoring the parity test infrastructure productionization** — that's Story 3.2. This story authors per-agent test cases consumed by an existing test file (`tests/integration/vortex-parity.test.js` is created here in stub-form by this story; Story 3.2 productionizes it as a CI gate).
- **Not authoring the Covenant per-Right matrix** — that's Story 4.1 (per ADR-005). The Covenant survival harness is invoked by this story but only verifies the harness shell + scaffolding works against a stub matrix; full per-cell re-audit is Story 4.2.
- **Not modifying `marketplace.json`** — that's Story 2.7 (cross-agent manifest finalization happens at the last E2 PR per epic line 663-665).
- **Not touching workflow source files** under `_bmad/bme/_vortex/workflows/` — FR12 forbids it. Workflow files are unchanged by every E2 story.

## Acceptance Criteria

### AC1 — Emma's SKILL.md converted to v6.3+ format with zero XML elements

**Given** Emma's pre-migration SKILL.md at [`_bmad/bme/_vortex/agents/contextualization-expert/SKILL.md`](../../_bmad/bme/_vortex/agents/contextualization-expert/SKILL.md) (current state: v5 XML-in-markdown with `<agent>`, `<activation>`, `<menu>`, etc.)
**When** the BMB conversion tooling runs (`bmad-agent-builder` `build-process` "convert" mode) AND the fixup checklist (per ADR-002) is applied to the output
**Then** the file at the same path contains zero XML elements — verified by mechanical search:
```bash
grep -E '<(agent|activation|menu|item|step|persona|rules|menu-handlers|handler|r)\b' _bmad/bme/_vortex/agents/contextualization-expert/SKILL.md
# Expected: empty (exit 1)
```
**And** the file matches the v6.3+ outcome-based markdown shape per BMB `standard-fields.md`:
- `## Overview` section (1 paragraph describing Emma's purpose)
- `## Identity` section (curious-clarifying probing persona; same content as pre-migration `<persona>` `<identity>` block, no semantic loss)
- `## Communication Style` section (verbatim or near-verbatim from pre-migration `<communication_style>`)
- `## Principles` section (all pre-migration `<principles>` items preserved)
- `## On Activation` section (delegates to `bmad-init` per FR4 — does NOT encode hardcoded `<step n="2">` config-error block; the fail-loud user vocabulary is preserved per Category 2 of fixup checklist)
  - **Pre-conversion verification (Round 1 review patch E3):** confirm Convoke's `bmad-init` skill at `.claude/skills/bmad-init/` emits fail-loud error vocabulary equivalent to Emma's pre-migration `<step n="2">` block (same phrases: "Configuration Error", path-attempted, required-fields list, recovery-hint). If `bmad-init` emits a less-fail-loud generic error: **two resolutions, in order of preference:**
    - (a) **Retain a custom Activation block in Emma's converted SKILL.md** that triggers fail-loud explicitly before delegating to `bmad-init` for the rest of activation. Keeps fixup Category 2 satisfied via per-agent customization. **Preferred per scope-discipline** (does not introduce cross-cutting upstream change).
    - (b) **Extend `bmad-init` to emit the fail-loud vocabulary by default.** Cross-cutting change affecting all 7 agents (and any upstream BMAD agents). Escalate via `bmad-correct-course`; not a Story 2.1 in-scope action.
  - Capture the verification outcome in Dev Agent Record Debug Log: which path applies (a or b) and why.
- `## Capabilities` section (markdown table with `Code | Description | Skill` columns)

### AC2 — Frontmatter `name:` field uses BMB canonical naming (per ADR-001)

**Given** the converted SKILL.md frontmatter
**When** I read it
**Then** `name:` field equals exactly `bmad-bme-agent-emma` (BMB canonical: `bmad-{module-code}-agent-{first-name}`).
**And** the slash-command alias at `.claude/skills/bmad-agent-bme-contextualization-expert/SKILL.md` continues to use `name: bmad-agent-bme-contextualization-expert` (slash-command alias preserved per ADR-001 hybrid naming D1).

### AC3 — Capability menu codes preserved (operational equivalence per FR13)

**Given** Emma's pre-migration `<menu>` block lists 8 items: `MH` (Redisplay Menu Help), `CH` (Chat), `LP` (Create Lean Persona), `PV` (Define Product Vision), `CS` (Contextualize Scope), `VL` (Validate Context), `PM` (Party Mode), `DA` (Dismiss Agent)
**When** I extract codes from the converted `## Capabilities` table
**Then** the resulting set is identical (set equality, ordering not strict): `{MH, CH, LP, PV, CS, VL, PM, DA}`. Verified mechanically via [`extractV63MenuCodes`](../../scripts/migration/format-conversion/parity-harness.js) helper:
```bash
node -e "
  const fs = require('fs');
  const { extractV63MenuCodes } = require('./scripts/migration/format-conversion/parity-harness');
  const content = fs.readFileSync('_bmad/bme/_vortex/agents/contextualization-expert/SKILL.md', 'utf8');
  const codes = extractV63MenuCodes(content).sort();
  console.log(JSON.stringify(codes));
  // Expected: [\"CH\",\"CS\",\"DA\",\"LP\",\"MH\",\"PM\",\"PV\",\"VL\"]
"
```

### AC4 — Capability prompts authored per Pattern-C-friendly factoring (FR9-11)

**Given** the post-migration directory [`_bmad/bme/_vortex/agents/contextualization-expert/references/`](../../_bmad/bme/_vortex/agents/contextualization-expert/references/) (NEW per agent per architecture line 552)
**When** I list its contents
**Then** exactly four files are present (one per workflow-routed menu code; meta items MH/CH/PM/DA do not need prompts):
- `lean-persona.md` (LP — routes to `_bmad/bme/_vortex/workflows/lean-persona/workflow.md`)
- `product-vision.md` (PV — routes to `_bmad/bme/_vortex/workflows/product-vision/workflow.md`)
- `contextualize-scope.md` (CS — routes to `_bmad/bme/_vortex/workflows/contextualize-scope/workflow.md`)
- `validate-context.md` (VL — routes to `_bmad/bme/_vortex/workflows/lean-persona/validate.md`)

**And** each capability prompt file contains the four Pattern-C-friendly sections (per architecture § "Format Patterns" lines 377-395):
- `# {Capability Display Name}`
- `## Identity` (single sentence: who is this capability)
- `## How It Works` (steps, expected inputs, key behaviors — non-duplicating with workflow source)
- `## Output Expectations` (file paths, format, location)
- `## Activation` (load this file when the parent agent's capability menu routes here)

**Definitional clarity (Round 1 review patch E4) — what each capability prompt IS and IS NOT:**

The capability prompt is **short metadata + activation pointer (~20–50 lines total)**, NOT a re-author of the workflow's contents. The workflow source files (under `_bmad/bme/_vortex/workflows/{name}/`) remain the authoritative implementation; the capability prompt's role is to surface "what is this" + "how to invoke" + "what comes out" to the agent's routing layer. Specifically:

- **DO:** include a one-sentence identity, a short paragraph or bullet-list explaining the workflow's input/output contract, and a clear pointer to where the workflow source lives.
- **DO:** keep the prompt loadable as a standalone skill if Pattern C is later adopted (relocate-and-rename, not re-author per FR10/NFR16).
- **DO NOT:** copy `workflow.md` step-by-step instructions into the capability prompt.
- **DO NOT:** reference Emma-specific state, agent-internal variables, or paths that would break under relocation.
- **DO NOT:** duplicate the workflow's principles, examples, or data-shape definitions — those stay in the workflow source.

Operative target: **each capability prompt should be readable in under 30 seconds** by an operator deciding whether to invoke the capability. If a capability prompt grows beyond ~50 lines, the dev has likely duplicated workflow content — refactor.

### AC5 — Capability table routes use BMB `Load \`./references/{cap}.md\`` convention (FR11)

**Given** the converted `## Capabilities` table
**When** I inspect the `Skill` column for each routed code (LP, PV, CS, VL)
**Then** each entry uses the BMB load-route convention. Verified mechanically:
```bash
grep -E '^\| (LP|PV|CS|VL) \|' _bmad/bme/_vortex/agents/contextualization-expert/SKILL.md
# Each row's Skill column should reference Load `./references/{cap}.md` per BMB convention
```

**And** meta items (MH, CH, PM, DA) reference appropriate built-in skills or are documented as agent-internal commands (no `references/` route required for these).

### AC6 — Workflow source files unchanged (FR12)

**Given** the four workflow source files Emma's capabilities route to:
- `_bmad/bme/_vortex/workflows/lean-persona/workflow.md` (+ step files)
- `_bmad/bme/_vortex/workflows/product-vision/workflow.md` (+ step files)
- `_bmad/bme/_vortex/workflows/contextualize-scope/workflow.md` (+ step files)
- `_bmad/bme/_vortex/workflows/lean-persona/validate.md`

**When** I diff against `main`:
```bash
git diff main -- _bmad/bme/_vortex/workflows/lean-persona/ _bmad/bme/_vortex/workflows/product-vision/ _bmad/bme/_vortex/workflows/contextualize-scope/
# Expected: empty
```
**Then** the diff is empty (workflow source unchanged).

### AC7 — `module.yaml` `agents:` array contains Emma's entry (FR6, FR7)

**Given** the post-migration [`_bmad/bme/_vortex/module.yaml`](../../_bmad/bme/_vortex/module.yaml)
**When** I parse the `agents:` array (BMM-canonical schema per architecture § "Format Patterns" lines 399-403)
**Then** an entry for Emma is present with all required fields:
```yaml
- code: bmad-bme-agent-emma
  name: Emma
  title: Contextualization Expert
  icon: 🎯
  team: vortex
  description: TBD at PR review (one-paragraph; operator-approved during code review — example only, do not copy this placeholder verbatim)
```

**And** any pre-existing `agents:` entries (none expected for Emma at this point — this is the first agent added) are unaffected. Story 2.7 closes E2 with all 7 entries verified.

### AC8 — `module-help.csv` row added for Emma (FR8) — schema decision required

**Schema-collision flag (Round 1 review patch C1):** `module-help.csv` does NOT exist anywhere in the project today. Backlog row **I100** explicitly flags a divergence: Convoke's existing Team Factory module uses a Convoke-specific column schema (`module, phase, name, code, sequence, workflow-file, command, required, agent, options, description, output-location, outputs`) that **differs from BMM canonical** (`module, skill, display-name, menu-code, description, action, args, phase, after, before, required, output-location, outputs`). Per I100: "Convoke needs documented extension standard … before next module ships marketplace-eligible." I100 is in the backlog (not yet shipped). Story 2.1 is the first module that needs this file — the schema choice for Emma sets a precedent.

**Decision needed at PR-review time** (one of three resolutions):
- **(a) Use BMM canonical column ordering** (per architecture § "Format Patterns" line 406). Document the override in PR description; I100 surfaces later but the precedent is set toward BMM-conformance.
- **(b) Use Convoke's existing variant** (Team Factory precedent). Match what already exists in-tree; I100 closes by codifying the variant as the standard.
- **(c) Block on I100** — wait for the standard to ship before Story 2.1 lands. Impacts Sprint 1 commitment.

**Default for this story (until operator decides):** option (a) BMM canonical, per architecture as the most-conservative-marketplace-conformant choice. PR description must explicitly cite the I100 collision and the resolution chosen.

**Given** the post-migration [`_bmad/bme/_vortex/module-help.csv`](../../_bmad/bme/_vortex/module-help.csv) (NEW file per architecture line 545)
**When** I read it
**Then** the file uses the column ordering chosen per the decision above (default: BMM canonical):
```
module,skill,display-name,menu-code,description,action,args,phase,after,before,required,output-location,outputs
```
**And** one row for Emma is present with `module=bme`, `skill=bmad-bme-agent-emma`, `display-name=Emma — Contextualization Expert`, `menu-code=` (empty for agents — menu codes are per-capability, not per-agent), `description` populated (TBD at PR review per AC7).

**And** the file format is RFC 4180-compliant CSV (no embedded literal newlines in cells; quoted cells when content contains comma or quote).

### AC9 — Slash-command alias wrapper preserved (per ADR-001)

**Given** the existing slash-command wrapper at [`.claude/skills/bmad-agent-bme-contextualization-expert/SKILL.md`](../../.claude/skills/bmad-agent-bme-contextualization-expert/SKILL.md)
**When** I inspect its content
**Then** the wrapper file's frontmatter `name:` field remains `bmad-agent-bme-contextualization-expert` (existing slash-command alias preserved — no rename).
**And** the wrapper's body still loads the canonical SKILL.md from `_bmad/bme/_vortex/agents/contextualization-expert/SKILL.md` (the file path is stable; the file content has been converted but the wrapper need not change its load path).
**And** if any text in the wrapper documents the v5 format internals (rare), update those references to v6.3+ equivalent terminology.

### AC10 — Parity tests for Emma exist + pass (FR13-16)

**Given** the parity test file at [`tests/integration/vortex-parity.test.js`](../../tests/integration/vortex-parity.test.js) (NEW — first authored by this story; Story 3.2 productionizes it as a CI gate, but Story 2.1 creates the file shell + Emma's tests)
**When** I run `npm test -- tests/integration/vortex-parity.test.js` (or `node --test tests/integration/vortex-parity.test.js`)
**Then** the tests pass and assert:
- Emma's pre-migration menu codes (extracted from the v5 source — captured as a baseline fixture *before* this PR's conversion lands; stored at `tests/integration/fixtures/vortex-parity/contextualization-expert-baseline.json` or equivalent) equal the post-migration codes (extracted via `extractV63MenuCodes` against the converted file). Set equality, order not strict.
- Each routed capability code (LP, PV, CS, VL) resolves to an existing `references/{cap}.md` file under Emma's directory.
- Each capability prompt's "Activation" section references a workflow path under `_bmad/bme/_vortex/workflows/` that exists post-migration.

**And** every test invocation that touches a project tree path uses the `tmpDir` pattern from [`scripts/migration/format-conversion/fixtures/tmpDir-setup.js`](../../scripts/migration/format-conversion/fixtures/tmpDir-setup.js) — bare `runScript()` calls forbidden per `test-fixture-isolation` rule (NFR4).

**And** the test file uses `node:test` runner per project convention.

**Boundary clause (Round 1 review patch E2) — what Story 2.1 ships vs Story 3.2 productionizes:**
- **Story 2.1 owns:** create `tests/integration/vortex-parity.test.js`; add Emma's per-agent test cases (assertions per AC10 above); get them passing locally via `node --test tests/integration/vortex-parity.test.js`. Fixture baseline JSON for Emma's pre-migration codes.
- **Story 3.2 owns:** wire the file into CI (npm script entry + workflow YAML), add per-agent tests for the other 6 agents as their conversions land (Stories 2.2-2.7), harden test fixtures, add coverage reporting, hook into `code-review-convergence` rule discipline.
- **Out of scope here:** `npm run` wrapper script, CI YAML, per-agent fixture data for non-Emma agents.

### AC11 — Personality preservation post-migration scoring achieves "preserved" verdict (FR21-23, NFR2)

**Given** Story 1.2 baseline fixtures for Emma at [`tests/migration/personality-preservation/fixtures/contextualization-expert/`](../../tests/migration/personality-preservation/fixtures/contextualization-expert/) (already captured + scored 4 across all 7 dimensions on 4.0 baseline per Round 1 pre-test)
**When** the post-migration capture is performed (run the same fixed-prompt set + scenario seed against the converted Emma; capture the responses) AND the operator scores the 7 dimensions against the calibrated rubric using the personality harness in `mode: 'verify'`
**Then** every dimension scores **at least 2 (Questionable or higher)** — i.e., **NO dimension at score 1 (Degraded)**, per FR23 disconfirmation threshold.

**And** scoring evidence is recorded inline in the PR description (or a linked scoring sheet at `_bmad-output/implementation-artifacts/i97-2-1-emma-personality-scoring-{YYYY-MM-DD}.md`) with per-dimension citations from the post-migration capture.

**And** if any dimension scores 2 (Questionable), the dev applies the fixup checklist's "Fixup action if violated" path (Category 1 — re-run BMB conversion with `--preserve-persona` if available; OR manually patch the converted SKILL.md with missing content; OR if persona-drift surfaces a rubric ambiguity, escalate via `bmad-correct-course`).

**And** if any dimension scores 1 (Degraded), the PR is **NOT mergeable** per FR23 disconfirmation. The dev iterates fixups + rescore — bounded by **3 iterations max** (Round 1 review patch C3, analogous to `code-review-convergence` rule's bounded-rounds discipline). After 3 iterations without all-≥-2 convergence, escalate via `bmad-correct-course` rather than continuing iteration. The escalation becomes a Story 2.1 Failure Handling Pattern Mode 2 outcome and is captured in calibration data for Stories 2.2-2.7. Per-iteration record: rubric dimension, score before fixup, fixup applied, score after fixup, evidence citation. Recorded in the personality scoring artifact.

### AC12 — Covenant survival harness invocation succeeds (FR17-20 — scaffolding only this story)

**Given** the covenant survival harness at [`scripts/migration/format-conversion/covenant-survival-harness.js`](../../scripts/migration/format-conversion/covenant-survival-harness.js) and the baseline audit at [`_bmad-output/planning-artifacts/convoke-report-operator-covenant-audit-vortex-hc-cluster-2026-04-26.md`](../../_bmad-output/planning-artifacts/convoke-report-operator-covenant-audit-vortex-hc-cluster-2026-04-26.md) (A26)
**When** the harness is invoked for Emma WITHOUT a `perRightMatrix` (because the matrix is authored at Story 4.1, not yet available)
**Then** the harness returns `{ status: 'no-matrix-supplied', message: 'Per-Right matrix authored at Story 4.1; supply matrix to run survival check' }` per AC6 of Story 1.1.

**And** the harness invocation itself is wired into Emma's PR test suite (or directly executed during the conversion's verification phase) — the handshake works; full re-audit deferred to Story 4.2 per ADR-005.

**This is scaffolding-validation, not full Covenant survival.** Per the architecture's pipelining note (epic line 327): E4 per-Right matrix authoring may begin after 2-3 E2 conversions complete. Emma's PR ships before Story 4.1; full Covenant cell-level non-regression rule (NFR7) is verified at Story 4.2 across all 7 agents post-conversion.

### AC13 — Reference integrity check passes against the post-conversion tree (FR24-25, NFR11)

**Given** the reference integrity script at [`scripts/audit/reference-integrity.js`](../../scripts/audit/reference-integrity.js)
**When** I run `node scripts/audit/reference-integrity.js` against the post-conversion tree
**Then** the script exits 0 with `PASS — N references checked, 0 broken` (where N reflects the new refs introduced by Emma's `references/{cap}.md` files + any audit-report citation updates).

**And** if the broken-ref count is non-zero, the dev fixes the broken refs in this PR (atomic — refs introduced by Emma's conversion are Emma's responsibility per NFR12).

### AC14 — Audit report citations updated atomically (NFR12)

**Given** the existing audit reports at `_bmad-output/planning-artifacts/convoke-report-*-audit-*.md` that reference Emma's pre-migration files
**When** I grep for old citations that point at v5-format-specific anchors:
```bash
grep -rE '_bmad/bme/_vortex/agents/contextualization-expert/SKILL\.md#' _bmad-output/planning-artifacts/
# Look for line/section anchors that may have shifted post-conversion
```
**Then** any line-number anchors that no longer resolve (because the converted SKILL.md has different line structure) are updated within this same PR — NOT batched to a separate cleanup PR.

**And** if no audit reports cite Emma-specific line/section anchors (likely, since most audit citations are at the file or directory level), this AC is N/A and noted in the PR description.

### AC15 — `npm run lint` exits 0 with zero warnings on touched files (NFR5)

**Given** the `lint-passes-before-review` rule from [project-context.md](../../project-context.md)
**When** I run `npm run lint` after this story's implementation
**Then** the command exits 0 AND reports zero warnings on any `.js`/`.mjs`/`.cjs` files modified by this story (the new parity test file + any test fixture helpers, plus any modifications to existing tooling). The converted SKILL.md is not a JS file — exempt by construction.

**And** any pre-existing lint warnings/errors in unrelated files are out-of-scope per the touched-files-not-global rule (`lint-1.1` precedent).

### AC16 — Operator Covenant compliance (per `covenant-compliance-for-convoke-skills` rule)

**Given** Emma is a `_bmad/bme/` skill — per the `covenant-compliance-for-convoke-skills` rule (project-context.md), the [Operator Covenant](../planning-artifacts/convoke-covenant-operator.md) and [Compliance Checklist](../planning-artifacts/convoke-spec-covenant-compliance-checklist.md) MUST be self-checked before marking the story `review`
**When** I work through the OC-R0 enumeration precondition + OC-R1 through OC-R7 against Emma's converted SKILL.md + 4 capability prompts + slash-command wrapper update
**Then** every Right either PASSes or has a declared N/A variant with rationale documented in the PR description (or a linked compliance-check artifact at `_bmad-output/planning-artifacts/convoke-report-operator-covenant-self-check-emma-conversion-{YYYY-MM-DD}.md`).

**Specifically:**
- **OC-R3 (Right to rationale on errors):** the v5 fail-loud config-error block (Category 2 of fixup checklist) is preserved or replaced with `bmad-init`-delegated equivalent that surfaces the same vocabulary. Verified by triggering the config-not-found case in an isolated tmpDir and observing the user-facing error.
- **OC-R5 (Right to surface-what-matters):** the converted SKILL.md does NOT bury operationally-critical info (menu items, principles, communication style markers) under boilerplate.
- **OC-R7 (Right to pacing):** activation flow does not rush the operator past confirmation points encoded in the v5 version.

**And** if any Right is questionable (not clearly PASS or clearly N/A), the dev escalates via `bmad-correct-course` rather than self-resolving. Per the Round 1 reviewer cue from rubric § "Status": *operator-preference vs principle-violation distinction* — a leaner converted output is preserved if the principle is intact.

### AC17 — Failure Handling Pattern compliance (per Epic 2 header — 5 modes)

**Given** the Epic 2 Failure Handling Pattern documented at the epic header (Modes 1-5: BMB invalid output, fixup misses persona drift, parity-pass-personality-fail, CI gate fails post-merge, operator unavailable for scoring)
**When** Emma's PR encounters any failure mode
**Then** the dev follows the documented escalation/rollback path for that mode — does NOT improvise or merge against unresolved failure.

**And** the PR description documents which (if any) failure modes were encountered and how they were resolved (provides the calibration data for Story 2.2+).

### AC18 — DoD checklist (per `bmad-dev-story` checklist + per-agent PR checklist binding)

**Given** the project's standard story DoD AND the per-agent PR checklist (architecture § "Process Patterns" lines 442-456 — 12 items binding for merge)
**When** Emma's PR is marked `review`
**Then** ALL 12 items from the per-agent PR checklist are checked AND the standard DoD items are satisfied:

Per-agent PR checklist (12 items):
- [ ] Agent's `SKILL.md` converted to v6.3+ format (FR1-4)
- [ ] All capability routes in `## Capabilities` table resolve to existing `references/{cap}.md` files (FR11)
- [ ] Workflow source files (`workflows/{name}/workflow.md`) unchanged (FR12)
- [ ] `module.yaml` `agents:` array entry added/updated for this agent (FR6)
- [ ] `module-help.csv` row added/updated for this agent (FR8)
- [ ] Slash-command wrapper file at `.claude/skills/bmad-agent-bme-contextualization-expert/SKILL.md` updated to point at converted SKILL.md (D1 alias layer)
- [ ] Parity tests added for this agent (FR13-15)
- [ ] Covenant survival audit harness invocation succeeds (scaffolding-only this story; FR17-20)
- [ ] Personality preservation samples captured + operator-ranked (FR21-23) — no dimension at 1 (Degraded)
- [ ] Audit report citations updated atomically for this agent's references (NFR12)
- [ ] Reference integrity CI check passes (FR24-25, NFR11)
- [ ] `npm run lint` exits 0 with zero warnings on modified files (NFR5)
- [ ] Fixup checklist (per ADR-002) reviewed and any flagged items resolved

Plus story-specific:
- [ ] Operator Covenant self-check completed (OC-R0..R7 enumerated, all PASS or declared N/A with rationale)
- [ ] Failure Handling Pattern path documented in PR description (encountered modes + resolutions)
- [ ] Calibration data captured in Dev Agent Record Completion Notes (actual hours/days; surprises vs plan; recommendations for Story 2.2+)

## Tasks / Subtasks

> **Sequencing per Epic 2 § "Within-PR Sequencing" (Amelia #1 refinement):** Each per-agent PR follows this 11-activity sequence with natural commit points (squash-and-merge at end per ADR-004). Tasks below map to the 11 activities. Single dev session likely spans multiple working sessions; the story is sized to **2-3x** typical per-agent estimate (Bob #1).

- [ ] **Task 1 — Capture pre-migration baseline** (Activity 1) (AC10, AC11)
  - [ ] 1.1 Confirm Emma's baseline fixtures from Story 1.2 are intact at [`tests/migration/personality-preservation/fixtures/contextualization-expert/`](../../tests/migration/personality-preservation/fixtures/contextualization-expert/) — no re-capture needed for personality (rubric calibrated; reuse per epic line 461)
  - [ ] 1.2 Capture Emma's pre-migration menu codes via `extractV5MenuCodes` for parity baseline; store at `tests/integration/fixtures/vortex-parity/contextualization-expert-baseline.json` (NEW fixture file)
  - [ ] 1.3 Capture pre-migration v5 SKILL.md content snapshot (git blob hash + brief content summary) for the Dev Agent Record Debug Log
  - [ ] 1.4 **Natural commit point** — fixture-baselines (commit message: `[i97-emma] capture pre-migration baselines for parity + personality`)

- [ ] **Task 2 — Run BMB conversion tooling** (Activity 2) (AC1, AC2)
  - [ ] 2.1 Invoke `bmad-agent-builder` via slash-command (Round 1 review patch E1): `/bmad-agent-builder convert _bmad/bme/_vortex/agents/contextualization-expert/`. **The diagnostic spike at [`spike-marketplace-packaging-delta.md`](spike-marketplace-packaging-delta.md) (2026-04-28) ran this exact invocation against this exact path** — re-read its outcome before invoking; pre-existing observations from that run inform what to expect. The BMB skill's `--headless` / `-H` flag may be passed if the dev wants non-interactive execution; otherwise interactive mode is canonical.
  - [ ] 2.2 Determine BMB output location: BMB conventionally writes in-place at the source path (overwrites `SKILL.md`). **Verify this** — if BMB writes to a different working location, capture the actual path in Dev Agent Record Debug Log + decide whether to commit from working location or move to source path.
  - [ ] 2.3 If capability prompts need separate authoring (workflows-as-references factoring per Pattern A): consider `bmad-workflow-builder` `build-process` "convert" mode for each workflow, OR hand-author per AC4 Pattern-C-friendly format. Default per architecture § "Process Patterns": hand-author the capability prompts (BMB workflow-builder is canonical for full workflow conversion, which is out of I97 scope per FR12; here the prompt is metadata + activation pointer).
  - [ ] 2.4 Inspect BMB output: verify v6.3+ shape per BMB `standard-fields.md` reference. The architecture's § "Format Patterns" + the ADR-002 fixup checklist define the expected sections.
  - [ ] 2.5 If BMB tooling produces invalid v6.3+ markdown (Failure Handling Pattern Mode 1): invoke `bmad-correct-course` to determine whether the issue is a BMB tooling bug (file upstream issue) OR a fixup-checklist gap (amend ADR-002 checklist + escalate via project follow-up).
  - [ ] 2.6 **Natural commit point** — raw BMB output (commit message: `[i97-emma] BMB conversion raw output (pre-fixup)`)

- [ ] **Task 3 — Apply fixup checklist** (Activity 3) (AC1, AC4, AC16)
  - [ ] 3.1 **Category 1 — Persona preservation:** diff pre-migration `<persona>` against post-migration `## Identity`/`## Communication Style`/`## Principles`. Cross-reference the 8 reviewer cues from rubric § "Status". Patch any drift.
  - [ ] 3.2 **Category 2 — Hardcoded error-string preservation (OC-R3):** trigger config-not-found case; verify user-visible error vocabulary preserved.
  - [ ] 3.3 **Category 3 — Capability menu code preservation:** assert `{MH, CH, LP, PV, CS, VL, PM, DA}` lexical set equality between v5 and v6.3+
  - [ ] 3.4 **Category 4 — Workflow file path preservation per FR12:** `git diff main -- _bmad/bme/_vortex/workflows/` must be empty
  - [ ] 3.5 If Category 1 drift surfaces (Failure Mode 2): re-apply BMB with `--preserve-persona`; OR manually patch + escalate via `bmad-correct-course` if rubric ambiguity surfaces
  - [ ] 3.6 **Natural commit point** — fixup checklist applied (commit message: `[i97-emma] apply fixup checklist (4 categories, all PASS)`)

- [ ] **Task 4 — Author capability prompts** (Activity 4) (AC4, AC5)
  - [ ] 4.1 Create `_bmad/bme/_vortex/agents/contextualization-expert/references/lean-persona.md` per Pattern-C-friendly format (Identity / How It Works / Output Expectations / Activation)
  - [ ] 4.2 Create `references/product-vision.md` (same format)
  - [ ] 4.3 Create `references/contextualize-scope.md` (same format)
  - [ ] 4.4 Create `references/validate-context.md` (same format; routes to `lean-persona/validate.md`)
  - [ ] 4.5 Verify each prompt is **structurally promotable to a standalone workflow skill** (FR10/NFR16) — no Emma-specific path coupling that would break under relocation
  - [ ] 4.6 Update converted SKILL.md `## Capabilities` table to use BMB `Load \`./references/{cap}.md\`` route convention (FR11)
  - [ ] 4.7 **Natural commit point** — capability prompts authored (commit message: `[i97-emma] author 4 capability prompts (Pattern-C-friendly)`)

- [ ] **Task 5 — Update `module.yaml` + `module-help.csv`** (Activity 5) (AC7, AC8)
  - [ ] 5.1 Add Emma's entry to `_bmad/bme/_vortex/module.yaml` `agents:` array per BMM-canonical schema (architecture § "Format Patterns" lines 399-403)
  - [ ] 5.2 Create `_bmad/bme/_vortex/module-help.csv` if it doesn't exist; add Emma's row with BMM-canonical column ordering
  - [ ] 5.3 Verify CSV format is RFC 4180-compliant (no embedded literal newlines; quoted cells when needed)
  - [ ] 5.4 **Natural commit point** — manifests updated (commit message: `[i97-emma] add Emma to module.yaml + module-help.csv`)

- [ ] **Task 6 — Update slash-command alias wrapper** (Activity 6) (AC9)
  - [ ] 6.1 Read `.claude/skills/bmad-agent-bme-contextualization-expert/SKILL.md` — current pre-Story-2.1 body contains: `1. LOAD the FULL agent file ... 2. READ its entire contents ... 3. FOLLOW every step in the <activation> section precisely ... 4. DISPLAY the welcome/greeting ... 5. PRESENT the numbered menu ... 6. WAIT for user input`
  - [ ] 6.2 Verify wrapper still loads from `_bmad/bme/_vortex/agents/contextualization-expert/SKILL.md` (path stable; content converted)
  - [ ] 6.3 **Concrete rewrites required (Round 1 review patch C2):** the v5-format references inside the wrapper body MUST be rewritten — this is NOT a likely-no-op. Specifically:
    - Step 3 currently reads "FOLLOW every step in the `<activation>` section precisely". The converted v6.3+ SKILL.md has NO `<activation>` section — it has `## On Activation`. Rewrite Step 3 to: `FOLLOW the instructions in the "## On Activation" section`.
    - Steps 4-6 reference v5 control flow ("DISPLAY", "PRESENT", "WAIT") which BMB v6.3+ outcome-based markdown handles via persona-driven activation rather than imperative steps. Decide: (a) keep the imperative steps as a wrapper-level scaffold (v6.3+ body still needs an entry path), or (b) collapse Steps 1-6 into a single "Load `_bmad/bme/_vortex/agents/contextualization-expert/SKILL.md` and follow its `## On Activation` instructions" directive. Default: **(b)**, per BMB convention.
    - The wrapper's frontmatter `description: contextualization-expert agent` may benefit from a richer one-line description matching the converted SKILL.md's `## Overview` first sentence.
  - [ ] 6.4 Verify post-rewrite wrapper still successfully activates Emma when invoked via `/bmad-agent-bme-contextualization-expert`. Smoke test: open a fresh Claude session, invoke the slash-command, observe Emma's greeting + menu. If activation fails, the wrapper rewrite is wrong — iterate.
  - [ ] 6.5 **Natural commit point** — alias wrapper refreshed (commit message: `[i97-emma] refresh slash-command alias wrapper for v6.3+ activation`)

- [ ] **Task 7 — Author parity tests + fixture data** (Activity 7) (AC10)
  - [ ] 7.1 Create `tests/integration/vortex-parity.test.js` (NEW file — first authored by this story; Story 3.2 productionizes it as CI gate)
  - [ ] 7.2 Add Emma's parity test cases: menu-code-set equality, capability-prompt existence, workflow-path resolution
  - [ ] 7.3 Use `node:test` runner per project convention
  - [ ] 7.4 Use `setupTmpDir` + `setupIsolatedInstall` from Story 1.1 helpers per `test-fixture-isolation` rule (NFR4)
  - [ ] 7.5 Run `node --test tests/integration/vortex-parity.test.js` — all Emma tests pass
  - [ ] 7.6 **Natural commit point** — parity tests added (commit message: `[i97-emma] add parity tests + fixture baselines`)

- [ ] **Task 8 — Capture post-migration personality samples + operator scoring** (Activity 8) (AC11)
  - [ ] 8.1 Run the same fixed-prompt set from `baseline-fixed-prompt.json` against the converted Emma; capture verbatim responses
  - [ ] 8.2 Run the same unscripted scenario from `baseline-unscripted-scenario.md`; capture turn-by-turn transcript
  - [ ] 8.3 Operator scores 7 dimensions (D1-D7) against rubric — must score ≥ 2 on every dimension (no Degraded)
  - [ ] 8.4 If any dimension scores 1: apply fixup checklist Category 1 path; re-score; iterate (Failure Mode 2 / Mode 3)
  - [ ] 8.5 Record scoring evidence at `_bmad-output/planning-artifacts/convoke-report-personality-scoring-emma-conversion-{YYYY-MM-DD}.md` (or inline in PR description)
  - [ ] 8.6 **Natural commit point** — personality scoring complete (commit message: `[i97-emma] post-migration personality scoring (≥2 all dimensions)`)

- [ ] **Task 9 — Refresh audit report citations atomically** (Activity 9) (AC14)
  - [ ] 9.1 `grep -rE 'contextualization-expert/SKILL\.md#' _bmad-output/planning-artifacts/` to find any line/section anchor citations
  - [ ] 9.2 If citations exist: verify each anchor still resolves post-conversion; update any that don't
  - [ ] 9.3 If no citations exist: note "N/A — no Emma-specific line anchors found" in PR description
  - [ ] 9.4 **Natural commit point** — audit citations refreshed (commit message: `[i97-emma] refresh audit-report citations atomically (NFR12)`)

- [ ] **Task 10 — Run reference integrity check + lint** (Activity 10) (AC13, AC15)
  - [ ] 10.1 Run `node scripts/audit/reference-integrity.js` — exit 0 with zero broken refs
  - [ ] 10.2 If broken refs: fix in this PR (refs introduced by Emma's conversion are Emma's responsibility)
  - [ ] 10.3 Run `npm run lint` — exit 0 with zero warnings on any modified `.js`/`.mjs`/`.cjs` files
  - [ ] 10.4 If pre-existing warnings exist in unrelated files: out-of-scope per touched-files-not-global rule
  - [ ] 10.5 Run `node --test tests/integration/vortex-parity.test.js` and `npm test` — full regression no new failures

- [ ] **Task 11 — Operator Covenant self-check + Failure Handling documentation** (Activity 11 / DoD prep) (AC16, AC17)
  - [ ] 11.1 Work through OC-R0 enumeration precondition (record full 3-layer interaction surface for Emma + 4 capability prompts + slash-command wrapper)
  - [ ] 11.2 Self-check OC-R1 through OC-R7; each PASS or declared N/A with rationale
  - [ ] 11.3 If any Right is questionable: escalate via `bmad-correct-course` (not self-resolved)
  - [ ] 11.4 Record self-check artifact at `_bmad-output/planning-artifacts/convoke-report-operator-covenant-self-check-emma-conversion-{YYYY-MM-DD}.md` OR inline in PR description
  - [ ] 11.5 Document any encountered Failure Handling Pattern modes + resolutions in PR description
  - [ ] 11.6 Capture **calibration data** in Dev Agent Record Completion Notes: actual hours/days; surprises vs estimate; recommendations for Story 2.2+

- [ ] **Task 12 — Per-agent PR checklist + final DoD gate** (AC18)
  - [ ] 12.1 All 12 items from architecture § "Process Patterns" per-agent PR checklist marked complete
  - [ ] 12.2 All ACs (AC1–AC18) demonstrably satisfied
  - [ ] 12.3 Update sprint-status.yaml: `i97-2-1-convert-emma-contextualization-expert-proof-of-concept: in-progress → review`; `i97-epic-2: backlog → in-progress`

## Dev Notes

### Relevant architecture patterns and constraints

**Read in this order before implementing (load-bearing for Emma's conversion):**

1. **Epic 2 header** ([`convoke-epic-bmad-v63-source-format-adoption.md`](../planning-artifacts/convoke-epic-bmad-v63-source-format-adoption.md) § "Within-PR Sequencing" + § "Failure Handling Pattern") — the 11-activity sequence and 5-mode failure pattern that this story executes.

2. **Architecture § "Process Patterns"** ([`convoke-arch-bmad-v63-source-format-adoption.md`](../planning-artifacts/convoke-arch-bmad-v63-source-format-adoption.md) lines 438-468):
   - **Per-agent PR checklist** (12 items) — binding merge gate
   - **Fixup checklist execution flow** (5 steps post-BMB)

3. **Architecture § "Format Patterns"** (lines 375-407):
   - **Capability prompt template** (Pattern-C-friendly) — Identity / How It Works / Output Expectations / Activation
   - **`module.yaml` schema** (BMM-canonical)
   - **`module-help.csv` schema** (BMM-canonical column ordering)

4. **5 ADRs** — read each:
   - [ADR-001 — Naming Convention Reconciliation](../planning-artifacts/adr/i97/adr-001-naming-convention-reconciliation.md) — `bmad-bme-agent-emma` canonical + slash-command alias
   - [ADR-002 — Conversion Tooling Architecture](../planning-artifacts/adr/i97/adr-002-conversion-tooling-architecture.md) — BMB-canonical with fixup checklist
   - [ADR-003 — Verification Harness Architecture](../planning-artifacts/adr/i97/adr-003-verification-harness-architecture.md) — three harnesses (parity, covenant, personality)
   - [ADR-004 — Atomic-by-Agent Commit + Tooling Namespace](../planning-artifacts/adr/i97/adr-004-atomic-by-agent-commit-and-tooling-namespace.md) — `i97-emma-conversion` branch + squash-and-merge
   - [ADR-005 — Covenant Baseline-Validity Policy](../planning-artifacts/adr/i97/adr-005-covenant-baseline-validity-policy.md) — per-Right matrix DEFERRED to Story 4.1

5. **Story 1.1 — completed dev work, all 7 scaffold files**:
   - Harnesses: [`scripts/migration/format-conversion/{parity,covenant-survival,personality}-harness.js`](../../scripts/migration/format-conversion/)
   - Fixup checklist: [`scripts/migration/format-conversion/fixup-checklist.md`](../../scripts/migration/format-conversion/fixup-checklist.md)
   - Reference integrity: [`scripts/audit/reference-integrity.js`](../../scripts/audit/reference-integrity.js)
   - Fixture helpers: [`scripts/migration/format-conversion/fixtures/`](../../scripts/migration/format-conversion/fixtures/)

6. **Story 1.2 — completed pre-test fixtures**:
   - Emma's baselines at [`tests/migration/personality-preservation/fixtures/contextualization-expert/`](../../tests/migration/personality-preservation/fixtures/contextualization-expert/)
   - Calibrated rubric at [`convoke-spec-personality-preservation-rubric.md`](../planning-artifacts/convoke-spec-personality-preservation-rubric.md) (status: `calibrated`)

### Project-context.md rules — load-bearing for Emma's conversion

- **`covenant-compliance-for-convoke-skills`** (mandatory — Emma is `_bmad/bme/`): Read [Operator Covenant](../planning-artifacts/convoke-covenant-operator.md) before authoring; self-check against [Compliance Checklist](../planning-artifacts/convoke-spec-covenant-compliance-checklist.md); PASS or N/A every Right with rationale (AC16).
- **`namespace-decision-for-new-skills`**: Story header above documents the namespace decision; no further action unless dev surfaces a mixed-namespace concern.
- **`test-fixture-isolation`** (NFR4): all parity tests use `setupTmpDir` + `setupIsolatedInstall` (Story 1.1 helpers).
- **`mechanical-research-enumeration`**: when listing menu codes / workflow paths / cited refs, use `grep` / `extractV5MenuCodes` / `extractV63MenuCodes` — never eyeball.
- **`derive-counts-from-source`**: any test asserting count of Emma's routed capabilities must derive from `fs.readdirSync('_bmad/bme/_vortex/agents/contextualization-expert/references/').length` — not hardcode `4`. (Note: Emma has 8 menu items total — 4 are workflow-routed [LP/PV/CS/VL] and 4 are meta [MH/CH/PM/DA]; only routed capabilities have prompts.)
- **`lint-passes-before-review`** (NFR5): `npm run lint` exit 0 zero warnings before `review` (AC15).
- **`code-review-convergence`**: Round 1 mandatory; Round 2 only on HIGH; max Round 3.

### Reviewer cues (from rubric § "Status" — 8 cues)

These apply at AC11 personality scoring:
1. **Meta-pattern awareness** — Emma demonstrates this in baselines ("this is the fourth oracle question..."). Verify converted Emma retains it.
2. **Operator-preference vs principle-violation** — lean response style ≠ degraded principle adherence (Emma scenario T7 was specifically flagged for this in pre-test).
3-8. (Other cues are agent-specific; cues 1, 2, 5 [Wade's adaptive-rigor], 7 [Isla's progressive-discovery ladder] are most likely to apply to Emma based on her POC role across the consulting-shaped scenarios.)

Full list: rubric § "Status" of [`convoke-spec-personality-preservation-rubric.md`](../planning-artifacts/convoke-spec-personality-preservation-rubric.md).

### Source tree components to touch

**New files (4-6 expected):**
1. `_bmad/bme/_vortex/agents/contextualization-expert/references/lean-persona.md`
2. `_bmad/bme/_vortex/agents/contextualization-expert/references/product-vision.md`
3. `_bmad/bme/_vortex/agents/contextualization-expert/references/contextualize-scope.md`
4. `_bmad/bme/_vortex/agents/contextualization-expert/references/validate-context.md`
5. `_bmad/bme/_vortex/module-help.csv` (NEW file — first row Emma)
6. `tests/integration/vortex-parity.test.js` (NEW test file — Story 3.2 productionizes; this story creates + adds Emma's tests)
7. `tests/integration/fixtures/vortex-parity/contextualization-expert-baseline.json` (NEW fixture)
8. `_bmad-output/planning-artifacts/convoke-report-personality-scoring-emma-conversion-{YYYY-MM-DD}.md` (NEW scoring artifact)
9. (Optional) `_bmad-output/planning-artifacts/convoke-report-operator-covenant-self-check-emma-conversion-{YYYY-MM-DD}.md` (Operator Covenant self-check artifact)

**Files modified:**
10. `_bmad/bme/_vortex/agents/contextualization-expert/SKILL.md` — converted v5 → v6.3+
11. `_bmad/bme/_vortex/module.yaml` — add Emma's `agents:` entry
12. `.claude/skills/bmad-agent-bme-contextualization-expert/SKILL.md` — refresh wrapper if needed
13. `_bmad-output/planning-artifacts/convoke-report-*-audit-*.md` (any audit reports citing Emma's pre-migration anchors)
14. `_bmad-output/implementation-artifacts/sprint-status.yaml` — `i97-2-1` flips backlog → in-progress → review; `i97-epic-2` flips backlog → in-progress
15. This story file — task checkboxes, Dev Agent Record, File List, Change Log, Status

**Files NOT touched (defensive — verify):**
- `_bmad/bme/_vortex/workflows/{lean-persona,product-vision,contextualize-scope}/` — FR12 forbidden
- `_bmad/bme/_vortex/agents/{discovery-empathy-expert,research-convergence-specialist,hypothesis-engineer,lean-experiments-specialist,production-intelligence-specialist,learning-decision-expert}/` — atomic-by-agent (other agents are Stories 2.2-2.7)
- `.claude-plugin/marketplace.json` — touched at Story 2.7 (cross-agent finalization)
- `package.json` version field — touched at Story 5.1 (release)

### Files to read (for cross-reference, NOT to modify)

- [Pre-migration Emma SKILL.md](../../_bmad/bme/_vortex/agents/contextualization-expert/SKILL.md) — the conversion target
- [Story 1.1's harness scaffolds](../../scripts/migration/format-conversion/) — consumed by this story; do not modify
- [Calibrated rubric](../planning-artifacts/convoke-spec-personality-preservation-rubric.md) — consumed by AC11 scoring
- [Round 1 + Round 2 scoring sheets](../planning-artifacts/convoke-pretest-personality-rubric-scoring-sheet.md) — for the form factor of post-migration scoring sheet
- A sample v6.3+ agent for format reference: [`.claude/skills/bmad-agent-pm/SKILL.md`](../../.claude/skills/bmad-agent-pm/SKILL.md) (John PM)
- [`scripts/audit/audit-skill-dirs.js`](../../scripts/audit/audit-skill-dirs.js) — sample audit script structure (not a direct dependency)

### Testing standards summary

- **Test runner:** `node:test` (per project convention; Jest globals removed)
- **Fixture isolation:** mandatory per `test-fixture-isolation` rule. `tests/integration/vortex-parity.test.js` uses `setupTmpDir` + `setupIsolatedInstall`.
- **Coverage expectations:** parity tests for Emma exhaustive on the 4 routed capabilities + meta-item handling. Personality scoring is operator judgment, not automated.
- **DoD lint:** `npm run lint` exits 0 with zero warnings on all touched `.js`/`.mjs`/`.cjs` files.
- **Reference integrity:** `node scripts/audit/reference-integrity.js` exits 0 against post-conversion tree.

### Project Structure Notes

**Alignment with unified project structure:**
- Emma's directory is `_bmad/bme/_vortex/agents/contextualization-expert/` — role-name preserved per ADR-001 alias layer (slash-command compat); only the SKILL.md frontmatter `name:` field uses BMB canonical.
- New `references/` subdirectory under each agent's directory — mirrors architecture § "Complete Project Directory Structure" lines 549-562.
- Capability prompt files use kebab-case names matching the workflow they invoke (e.g., `lean-persona.md` invokes `workflows/lean-persona/workflow.md`).
- `module-help.csv` is a NEW file; format must match the BMM-canonical column ordering exactly (parity test in Story 3.2 will eventually verify column order).

**Detected conflicts or variances:**
- **`validate-context.md` capability prompt vs. existing `lean-persona/validate.md` workflow file.** The pre-migration menu maps `VL` (Validate Context) to `lean-persona/validate.md` — the workflow lives under `lean-persona/` directory, not as a separate `validate-context/` directory. The new capability prompt at `references/validate-context.md` invokes that workflow at `workflows/lean-persona/validate.md`. The capability *prompt* name (validate-context) and the *workflow* name (lean-persona/validate) intentionally differ — this is the Pattern-C-friendly indirection layer per FR10.
- **`module-help.csv` does not exist pre-migration.** This story creates it. Subsequent E2 stories add additional rows.

### References

- [`convoke-epic-bmad-v63-source-format-adoption.md` § Story 2.1](../planning-artifacts/convoke-epic-bmad-v63-source-format-adoption.md) — story source
- [`convoke-prd-bmad-v63-source-format-adoption.md`](../planning-artifacts/convoke-prd-bmad-v63-source-format-adoption.md) — primary FRs (FR1-25 mostly applicable; FR26-32 for E5/E6)
- [`convoke-arch-bmad-v63-source-format-adoption.md`](../planning-artifacts/convoke-arch-bmad-v63-source-format-adoption.md) § Process Patterns (lines 438-468) + § Format Patterns (lines 375-407) + § Decision D1/D2/D3/D4/D5
- [ADR-001](../planning-artifacts/adr/i97/adr-001-naming-convention-reconciliation.md), [ADR-002](../planning-artifacts/adr/i97/adr-002-conversion-tooling-architecture.md), [ADR-003](../planning-artifacts/adr/i97/adr-003-verification-harness-architecture.md), [ADR-004](../planning-artifacts/adr/i97/adr-004-atomic-by-agent-commit-and-tooling-namespace.md), [ADR-005](../planning-artifacts/adr/i97/adr-005-covenant-baseline-validity-policy.md)
- [Operator Covenant](../planning-artifacts/convoke-covenant-operator.md) + [Compliance Checklist](../planning-artifacts/convoke-spec-covenant-compliance-checklist.md) — load-bearing per `covenant-compliance-for-convoke-skills` rule
- [Personality rubric](../planning-artifacts/convoke-spec-personality-preservation-rubric.md) (status: calibrated) + Round 1/2 scoring sheets — consumed by AC11
- Story 1.1 deliverables: [harness suite](../../scripts/migration/format-conversion/) + [reference-integrity](../../scripts/audit/reference-integrity.js) + [load-test pattern](../../tests/lib/format-conversion-load.test.js)
- Story 1.2 deliverables: [Emma's baselines](../../tests/migration/personality-preservation/fixtures/contextualization-expert/) + [Liam's baselines](../../tests/migration/personality-preservation/fixtures/hypothesis-engineer/) (latter not used here but available as reference)
- [`project-context.md`](../../project-context.md) — `covenant-compliance-for-convoke-skills`, `test-fixture-isolation`, `mechanical-research-enumeration`, `derive-counts-from-source`, `lint-passes-before-review`, `code-review-convergence`, `namespace-decision-for-new-skills`
- [`memory/project_marketplace_structural_adoption.md`](../../.claude/projects/-Users-amalikamriou-BMAD-Enhanced/memory/project_marketplace_structural_adoption.md) — initiative-level state
- Predecessor story precedent: [`i97-1-1-migration-tooling-foundation-scaffolded.md`](i97-1-1-migration-tooling-foundation-scaffolded.md) — pattern for namespace decision + safety analysis + scope-discipline framing + Round 1/2 review process

## Dev Agent Record

### Agent Model Used

_To be filled by dev agent_

### Debug Log References

_To be filled by dev agent — capture pre-migration baselines, BMB output diffs, fixup actions, parity test runs, post-migration personality scoring, reference-integrity output, lint output_

### Completion Notes List

_To be filled by dev agent — **especially the calibration data** (actual hours/days, surprises vs plan, recommendations for Stories 2.2-2.7)_

### File List

_To be filled by dev agent — distinguishing new vs modified files; cite paths relative to repo root_

## Change Log

| Date | Change | By |
|------|--------|-----|
| 2026-05-02 | Story spec authored by Bob via bmad-create-story workflow. Status: ready-for-dev. **Sprint 1 commits THIS story only** (per epic Bob #1 refinement). Variance: may take 2-3x typical effort — calibration data is itself a deliverable. | Bob (SM) |
| 2026-05-02 | Pre-dev review by Bob: 10 spec fixes applied (3 critical + 4 enhancement + 3 optimization). Critical: AC8 schema-collision flag added (I100 backlog row); Task 6.3 wrapper rewrite concretized (NOT no-op); AC11 fixup-rescore loop bounded (3 iterations max → escalate). Enhancements: Task 2.1 BMB invocation concretized (slash-command form + spike reference); AC10 parity-test stub boundary clarified (Story 2.1 vs 3.2 ownership); AC1 bmad-init delegation verification path added (preferred-resolution-A retain custom Activation block); AC4 capability prompt definitional clarity (~20-50 lines, metadata + activation pointer, NOT workflow re-author). Optimizations: placeholder dates → `{YYYY-MM-DD}` template; `module.yaml` `description` example → "TBD at PR review"; `derive-counts-from-source` rule citation precise (8 menu items / 4 routed). Spec now internally consistent and dev-ready. | Bob (SM) — pre-dev review pass |
