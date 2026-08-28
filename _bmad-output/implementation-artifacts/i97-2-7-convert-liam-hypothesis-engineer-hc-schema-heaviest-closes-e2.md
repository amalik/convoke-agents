# Story i97-2.7: Convert Liam (hypothesis-engineer) — Closes Epic 2

Status: ready-for-dev

**Epic:** [i97-epic-2 — Vortex Agent Conversions Complete](../planning-artifacts/convoke-epic-bmad-v63-source-format-adoption.md#epic-2-vortex-agent-conversions-complete) (atomic-by-agent commit pattern per ADR-004)
**Origin:** I97. **Seventh and final per-agent conversion — closes Epic 2 and finalizes cross-agent manifests.**
**Canonical template:** [Story 2.4 (Isla)](i97-2-4-convert-isla-discovery-empathy-expert.md) — the shared cycle is fully specified there. **This spec carries Liam's deltas plus the E2 closing work.**
**Sequencing:** hard-last. AC-E2 requires all six prior conversions landed on `main`.
**Filename note:** this file keeps the sprint-status key `i97-2-7-convert-liam-hypothesis-engineer-hc-schema-heaviest-closes-e2` verbatim so key and filename stay aligned, even though the finding below shows "HC-schema-heaviest" is not supported by source. Renaming the key is an operator decision, not a side effect of authoring this spec.
**Namespace decision (NFR9):** source edits under `_bmad/bme/_vortex/`, test edits under `tests/`, plus `.claude-plugin/marketplace.json` for the closing verification.
**Estimated effort:** ~1 hr conversion + ~30 min operator capture + ~30–45 min E2 closing verification. **This is materially lower than the epic's estimate — see the finding below before planning against it.**

---

## ⚠ Finding: the epic's 1.5× effort premise for this story is not supported by source

The epic prices Story 2.7 at **~1.5× Emma's baseline**, justified by: *"Liam owns hypothesis-contract routing logic (HC1: empathy artifacts, HC2: problem definition, HC3: hypothesis contract, HC4: experiment context, HC5: signal report). Conversion preserves the most complex schema-routing logic; fixup checklist application requires HC-aware review beyond the standard checklist items."* It also allows multi-PR sequencing on that basis.

**Measured 2026-08-28: `grep -coE 'HC[0-9]` returns 0 for Liam's SKILL.md — and 0 for all seven Vortex agent SKILL.md files.** No agent file enumerates HC schemas. The HC surface lives in three other places, none of which this story converts:

- `_bmad/bme/_vortex/contracts/hc{1..5}-*.md` — the schemas themselves (5 files, not touched)
- workflow **step** files and `workflow.md` `## Output` sections — e.g. `hypothesis-engineering/workflow.md` emits `HC3`, `experiment-design/workflow.md` emits enriched `HC3`, Noah's three emit `HC5` (**unchanged per FR12**)
- `README.md` and `compass-routing-reference.md` (not touched)

What Liam's SKILL.md *does* carry is the **4-field hypothesis contract** (belief, evidence needed, experiment, success criteria) — a different thing from the HC1–HC5 handoff chain, appearing in his `<identity>`, `<principles>` and one `<r>` rule. That is ordinary persona content, preserved by the standard Category 1 fixup, not a schema-routing project.

**Consequence.** By capability count Liam is a 3-capability agent — the same shape as Mila (~1 hr actual) and Noah. The genuinely 2.7-specific cost is **AC-E2 manifest finalization**, and one of its three checks is already satisfied (see AC-E2). The honest estimate is **≈ Mila + a manifest pass**, not 1.5× Emma.

**This is a finding, not a unilateral re-scope.** The epic's number stands until the operator changes it. If Liam's conversion does surface HC-aware fixup work that this analysis missed, the epic's multi-PR allowance still applies — invoke it rather than silently overrunning.

---

## Verified facts (derived from source 2026-08-28)

| Fact | Value |
|---|---|
| Pre-migration SKILL.md | `_bmad/bme/_vortex/agents/hypothesis-engineer/SKILL.md` |
| Format / size / blob | v5 XML-in-markdown · 117 lines · `46ce33f5859d45072dcb53ea2ebb64d9d04762df` (clean at HEAD) |
| Canonical name | `bmad-bme-agent-liam` |
| Title / icon / stream / phase | Hypothesis Engineer · 💡 · Hypothesize · `hypothesize` |
| Menu codes (all) | `MH, CH, HE, AM, ED, PM, DA` — **7** |
| Routed (3) | `HE` hypothesis-engineering · `AM` assumption-mapping · `ED` experiment-design |
| Meta (4) | `MH, CH, PM, DA` |
| v5 `<r>` rules | 9 |
| v5 `<principles>` | **5** |
| Baseline personality fixtures | present — **REUSE, do not re-capture** |

**Rubric note:** Liam's persistent-challenge fingerprint was already exercised at Story 1.2's dissimilar-personality calibration (Emma + Liam). Per the epic, his re-calibration risk is **lower** than the mid-batch agents — he is the one agent whose scoring dimensions were pre-tested.

**Workflow source files (FR12 — must stay byte-identical):**

| Code | Workflow source | Lines | Output artifact |
|---|---|---|---|
| `HE` | `workflows/hypothesis-engineering/workflow.md` | 52 | `{output_folder}/vortex-artifacts/hc3-hypothesis-contract-{date}.md` |
| `AM` | `workflows/assumption-mapping/workflow.md` | 49 | **none** — "Working Document… produced inline during Steps 3-4", `Template: None` |
| `ED` | `workflows/experiment-design/workflow.md` | 51 | `{output_folder}/vortex-artifacts/hc3-experiment-design-{date}.md` (enriched HC3) |

---

## Story

As the Convoke maintainer, I want Liam's `SKILL.md` migrated to v6.3+ outcome-based markdown **and** all seven agents verified present across `module.yaml`, `module-help.csv` and `marketplace.json`, so that Epic 2 closes with the Vortex module fully declared and marketplace-eligible.

## Acceptance Criteria

**AC1–AC18 are as specified in [Story 2.4](i97-2-4-convert-isla-discovery-empathy-expert.md#acceptance-criteria)**, with the Liam substitutions above. Genuine differences and the new AC-E2 follow.

### AC3 — 3 capability prompts (Liam delta)

Files: `references/{hypothesis-engineering,assumption-mapping,experiment-design}.md`, each with the four exact sections.

**HC3 output contract.** `hypothesis-engineering.md` and `experiment-design.md` must name their real HC3 paths from the table above, and should reference [`contracts/hc3-hypothesis-contract.md`](../../_bmad/bme/_vortex/contracts/hc3-hypothesis-contract.md) as the schema — it declares `Flow: Liam → Wade` and `source_agent: liam`, which is the concrete form of the "Liam owns HC3" idea. **`assumption-mapping.md` must NOT claim a file artifact** — its workflow explicitly produces a working document inline.

**Preserve the 4-field contract language.** Belief / evidence needed / experiment / success criteria appears in Liam's identity, principles and rules. It is his most distinctive domain vocabulary and the `falsifiable` voice-marker depends on the surrounding language surviving.

**CF #1 cross-agent hooks:** `HE` names **Mila** upstream (HC2 problem definition is its input) and **Wade** downstream (HC3 → experiment); `AM` names **Isla** for discovery on high-risk assumptions and **Wade** when the testing order is acceptable — the `assumption-mapping/workflow.md` `## Consumer` line already states exactly this, so mirror it rather than inventing; `ED` names **Wade** downstream. Liam sits mid-chain, so his map points **both directions** — the last distinct CF #1 shape in Epic 2.

### AC5 — Workflow source files unchanged (FR12)

`git diff main -- _bmad/bme/_vortex/workflows/` returns empty across **all** workflow directories — at E2 close this is the cumulative check for all seven agents, not just Liam's three.

### AC7 — `module-help.csv` row (Liam delta)

`phase` = `hypothesize`. `outputs`: `hc3-hypothesis-contract-*.md, hc3-experiment-design-*.md`. **No `AM` artifact.**

### AC9 / AC10 — Parity tests + baseline fixture (Liam delta)

Fixture at `tests/integration/fixtures/vortex-parity/hypothesis-engineer-baseline.json`: `agentFirstName` `Liam`, `agentIcon` `💡`, `preMigrationContentLines` 117, `preMigrationGitBlob` `46ce33f5859d45072dcb53ea2ebb64d9d04762df`, `preMigrationMenuCodes` the 7 above, `routedCapabilityCount` 3, `menuCodeToWorkflow` the 3 paths above.

Add the **7th** describe block. **Expected total: 63 tests (9 × 7)** if 2.4–2.6 all landed; report the number you observed.

**CF #2 gate:** `extractV5MenuCodes` expects sorted `[AM, CH, DA, ED, HE, MH, PM]`.

**Honest note:** Liam's 7-code set matches Mila's and Noah's cardinality. Write "a 7th synthetic shape (7 codes, same size as Mila's and Noah's)".

### AC-P0 — P0 suite stays green: `tests/p0/p0-liam.test.js`

**`p0-liam.test.js` is a CERTAIN edit** — identical unported state to `p0-isla.test.js`. Mechanism and evidence: [Story 2.4 AC-P0](i97-2-4-convert-isla-discovery-empathy-expert.md#ac-p0--p0-suite-stays-green-testsp0p0-islatestjs). Liam's values:

**Class A — preserve these literals (all three verified present in the v5 source 2026-08-28):**

| # | Assertion | Required literal | Must live in |
|---|---|---|---|
| `:39` | `def.persona.role.includes(…)` | `Hypothesis Engineering` | `## Identity` body |
| `:46` | `def.persona.identity.includes(…)` | `Hypothesize` | `## Identity` body |
| `:51-54` | `def.persona.communication_style.includes(…)` | `What if?` | `## Communication Style` body |
| `:59` | `def.menuItems.length === 7` | — | `## Capabilities` (7 rows) |

`VOICE_MARKERS['hypothesis-engineer']` also expects `What if?` **or** `safe bet` shared between registry and agent file, plus ≥2 of `hypothesis/assumption/brainwriting/falsifiable/belief/experiment` in `## Principles`.

**Class B — port to the format-aware helpers (copy [`p0-mila.test.js:74-104`](../../tests/p0/p0-mila.test.js#L74)):**

| # | Today (inline v5 regex) | Port to | Threshold change |
|---|---|---|---|
| `:75` | `/<item\s[^>]*exec="…"/g`, `>= 4` | `extractExecPaths` + `resolveExecPath` | **`>= 4` → `>= 3`** |
| `:95` | `/<step n="2">…<step n="3">/` | `hasConfigErrorHandling` | — |
| `:111` | `/<r>/g`, `>= 5` | `countRules` | — |

**⚠ Liam has exactly 5 principles — zero slack against `countRules >= 5`** (same as Noah). All five must survive as bullet lines matching `/^\s*[-*]\s/`. Verbatim:

1. Structured brainwriting produces better ideas than unstructured brainstorming
2. 4-field hypothesis contracts force clarity: belief, evidence needed, experiment, success criteria
3. Assumption mapping separates what we know from what we think we know
4. The riskiest assumption gets tested first, not the easiest one
5. Good hypotheses are falsifiable — if you can't prove it wrong, it's not a hypothesis

The three exact-string contracts are as stated in Story 2.4 AC-P0. **Do not modify `tests/p0/helpers.js`.**

**Note:** `p0-liam.test.js`'s second describe block uses a `LIAM_STEP_COUNTS` map for per-workflow step counts. That block reads workflow files only and is **unaffected** by conversion — same as Isla's.

### AC-E2 — Epic 2 closing verification (NEW — this story only)

**Given** all seven agent conversions have landed on `main`
**Then** verify each of the following and record the result in the Dev Agent Record:

1. **`_bmad/bme/_vortex/module.yaml`** — `agents:` array contains **7** entries, each with `code` / `name` / `title` / `icon` / `team` / `description`. **Currently 3** (emma, wade, mila) as of 2026-08-28. **Also update the `# INCOMPLETE BY DESIGN` comment above the array** — it was written to describe a partial list and explicitly names "Story 2.7 closes E2 and is where all seven get verified together". Once seven are present that comment is stale; this story is where it gets rewritten. (Corrected once already at `48c8109a` for saying something different-but-wrong — do not leave a third wrong version.)
2. **`_bmad/bme/_vortex/module-help.csv`** — 7 agent rows, canonical 13-column ordering. **Currently 3.**
3. **`.claude-plugin/marketplace.json`** — the `skills:` array. **Verified 2026-08-28: all 7 paths are ALREADY present** at `plugins[0].skills`, pointing at `./_bmad/bme/_vortex/agents/<role>` directory paths. Conversion changes `SKILL.md` *content*, not directory names, so **this check is a verification, not a change** — the epic's wording ("all 7 paths point at converted agent directories") is satisfied today. Confirm it is still true; do not manufacture an edit.
   **Flag while you are in the file:** `plugins[0].version` reads `4.0.0` while the package is at 4.0.1. Out of scope here — Epic 5 Story 5.2 owns marketplace verification at release — but record it so it is not discovered at ship time.
4. **Cumulative parity** — `node --test tests/integration/vortex-parity.test.js` green with 7 describe blocks.
5. **Cumulative P0** — `npm run test:p0` green with all 7 per-agent suites, all Class B ports landed.

**Do not mark AC-E2 satisfied on a count alone.** Verify each of the seven `module.yaml` entries resolves to a real converted agent directory, and that its `code` matches that agent's SKILL.md frontmatter `name:`. A row that exists but points at nothing is exactly the defect [`deferred-work.md`](deferred-work.md) records against the current 3-of-7 state.

### AC11 — Personality preservation (Liam delta)

Baselines present — reuse. Lower re-calibration risk than mid-batch agents (Story 1.2 pre-test).

**Persona fingerprint:** persistent challenge-posing; falsifiability-driven; treats every claim as a hypothesis until tested; actively curious about **disconfirmation** evidence. **Likely CF #12 mismatch:** a `**CRITICAL Handling**` that has Liam agreeably helping draft a hypothesis. His captured behavior is to challenge whether the proposed hypothesis is falsifiable at all — "if you can't prove it wrong, it's not a hypothesis". Read the baseline responses first.

**CF #10 wording:** by the time Liam is scored the observation set may be complete. State the actual *scored* count and name the agents; do not write "all 7" unless all 7 have been scored.

## Tasks / Subtasks

Mirror [Story 2.4's Tasks 1–12](i97-2-4-convert-isla-discovery-empathy-expert.md#tasks--subtasks), substituting Liam's values, then add Task 13. Deltas:

- **Task 1.2** — expect blob `46ce33f5859d45072dcb53ea2ebb64d9d04762df`
- **Task 1.3** — CF #2 gate expects `[AM, CH, DA, ED, HE, MH, PM]`
- **Task 4** — 3 capability prompts; `assumption-mapping.md` claims no file artifact and mirrors its workflow's `## Consumer` line
- **Task 7.4** — expect 63 parity tests if 2.4–2.6 landed; report what you observed
- **Task 7b.1a** — exec threshold `>= 4` → `>= 3`
- **Task 13 — Epic 2 closing verification (AC-E2)** — the five checks above, each with its command and observed result recorded in the Dev Agent Record; rewrite the stale `module.yaml` comment; flag the `marketplace.json` version drift
- **Task 12.3** — flip `i97-2-7-…` and **`i97-epic-2: in-progress → done`**; then `bmad-retrospective i97-epic-2`

## Dev Notes

**Read first:** [Story 2.4 (Isla)](i97-2-4-convert-isla-discovery-empathy-expert.md) in full. Then [Story 2.3 (Mila)](i97-2-3-convert-mila-research-convergence-specialist.md) for the 3-capability shape.

**On the HC question.** Do not go looking for HC schema-routing inside Liam's SKILL.md — it is not there, and time spent hunting for it is the main way this story overruns its real cost. The HC surface Liam genuinely owns is **HC3 as a workflow output**, which reaches the converted file only through the two capability prompts' `## Output Expectations`. Get those two paths right and the HC obligation is discharged.

**Liam's position:** stream 4 (Hypothesize) — mid-chain. Consumes Mila's HC2 problem definition, produces HC3 for Wade. His cross-agent map is the only bidirectional one authored in Epic 2 (Isla's is forward-only, Max's is backward-into-all).

**Same-LLM-bias mitigation:** operator handoff at Task 8.1 is mandatory — and it is the last one. If Mila's, Isla's, Noah's or Max's scoring is still outstanding when Liam's is ready, consider batching the remaining captures into one operator sitting.

**Scope boundaries — out:** `tests/p0/helpers.js`; `refresh-installation.js`; the `refs:audit` wide-sweep condition; workflow source files and `contracts/hc*.md`; the `marketplace.json` version drift (flag only); Epic 3 CI gate productionization.

### References

- [Source: `_bmad-output/planning-artifacts/convoke-epic-bmad-v63-source-format-adoption.md#story-27-convert-liam-hypothesis-engineer--hc-schema-heaviest-closes-e2`]
- [Source: `_bmad/bme/_vortex/agents/hypothesis-engineer/SKILL.md`] — 7 codes, 5 principles, 9 rules, 4 exec paths, **zero HC[0-9] matches**
- [Source: `tests/p0/p0-liam.test.js:39,46,51-54,59,75,95,111`] — the AC-P0 contracts
- [Source: `_bmad/bme/_vortex/contracts/hc3-hypothesis-contract.md:3,13,29-30`] — `Flow: Liam → Wade`, `source_agent: liam`
- [Source: `_bmad/bme/_vortex/workflows/assumption-mapping/workflow.md`] — `Template: None`, inline working document, `## Consumer` line
- [Source: `.claude-plugin/marketplace.json`] — `plugins[0].skills` already lists all 7 agent directories
- [Source: `scripts/update/lib/agent-registry.js:49-50`] — registry title/icon/stream

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List

**Expected new files (4):** 3 capability prompts + `tests/integration/fixtures/vortex-parity/hypothesis-engineer-baseline.json`
**Expected modified files (5, +1 comment-only):** Liam's `SKILL.md`, `module.yaml` (entry **+ stale comment rewrite**), `module-help.csv`, `tests/integration/vortex-parity.test.js`, **`tests/p0/p0-liam.test.js` (certain — Class B port)**
**Expected verified-not-modified (1):** `.claude-plugin/marketplace.json`
**Expected pre-created skeletons (2):** post-migration fixed-prompt + unscripted-scenario
**Expected new artifacts (1 + 1 operator-authored):** Covenant self-check; personality scoring report

## Change Log

| Date | Change | By |
|------|--------|-----|
| 2026-08-28 | Story spec authored via `bmad-create-story`. Status: ready-for-dev. Lean delta-spec against Story 2.4, plus the E2 closing work (new **AC-E2**, new Task 13). All values re-derived from source 2026-08-28. **Principal finding: the epic's 1.5× effort premise is not supported by source.** It rests on Liam "owning HC1–HC5 contract enumeration" in his agent file; `grep -coE 'HC[0-9]'` returns **0 for Liam and for all seven agent SKILL.md files**. HC lives in `contracts/hc*.md`, in workflow step files and `## Output` sections (unchanged per FR12), and in README/compass-routing — none of which this story converts. What Liam's file carries is the **4-field hypothesis contract**, ordinary persona content. By capability count he is a 3-capability agent like Mila. Recorded as a finding for the operator, not a unilateral re-scope; the epic's multi-PR allowance still stands if HC-aware fixup does surface. **Second finding: `marketplace.json` already lists all 7 agent directory paths**, so that AC-E2 check is a verification rather than a change (its `version` reads 4.0.0 vs package 4.0.1 — flagged, owned by Epic 5). Carries the AC-P0 finding from 2.4's Round 1 review: `p0-liam.test.js` is in the identical unported state, exec threshold **`>= 4` → `>= 3`**, and **Liam has exactly 5 principles — zero slack** against `countRules >= 5`, so all five are enumerated verbatim. Epic-text correction: epic lists `HE/AM/ED` (routed subset); source shows 7 codes and FR13 parity covers all 7. | Amelia (dev) |
