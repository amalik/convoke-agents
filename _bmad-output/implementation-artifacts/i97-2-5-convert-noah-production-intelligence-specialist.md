# Story i97-2.5: Convert Noah (production-intelligence-specialist)

Status: ready-for-dev

**Epic:** [i97-epic-2 — Vortex Agent Conversions Complete](../planning-artifacts/convoke-epic-bmad-v63-source-format-adoption.md#epic-2-vortex-agent-conversions-complete) (atomic-by-agent commit pattern per ADR-004)
**Origin:** I97. **Fifth per-agent conversion** after 2.1 Emma, 2.2 Wade, 2.3 Mila, 2.4 Isla.
**Canonical template:** [Story 2.4 (Isla)](i97-2-4-convert-isla-discovery-empathy-expert.md) — the shared cycle is fully specified there. **This spec carries only Noah's deltas.** Read 2.4's AC1–AC18 + Dev Notes first; every AC below either references it or restates a Noah-specific value.
**Namespace decision (NFR9):** source edits under `_bmad/bme/_vortex/`, test edits under `tests/`. No upstream-BMAD files touched.
**Estimated effort:** ~1 hr dev + ~30 min operator capture. Noah has **3** routed capabilities — the same count as Mila (~1 hr actual). Plus the Task 7b P0 port (~20–30 min), which is certain work.

---

## Verified facts (derived from source 2026-08-28 — not copied from the epic)

| Fact | Value |
|---|---|
| Pre-migration SKILL.md | `_bmad/bme/_vortex/agents/production-intelligence-specialist/SKILL.md` |
| Format / size / blob | v5 XML-in-markdown · 117 lines · `ce44f86898ff39c01e7f9d2d3f141b847f5b4341` (clean at HEAD) |
| Canonical name | `bmad-bme-agent-noah` |
| Title / icon / stream / phase | Production Intelligence Specialist · 📡 · Sensitize · `sensitize` |
| Menu codes (all) | `MH, CH, SI, BA, MO, PM, DA` — **7** |
| Routed (3) | `SI` signal-interpretation · `BA` behavior-analysis · `MO` production-monitoring |
| Meta (4) | `MH, CH, PM, DA` |
| v5 `<r>` rules | 9 |
| v5 `<principles>` | **5** |
| Baseline personality fixtures | present (`baseline-fixed-prompt.json`, `baseline-unscripted-scenario.md`) — **REUSE, do not re-capture** |

**Epic-text correction:** the epic lists Noah's menu codes as `SI, BA, MO` (3). That is the routed subset; source shows **7** codes including the `MH/CH/PM/DA` meta set. FR13 parity is asserted over all 7. Same correction Stories 2.3 and 2.4 made.

**Workflow source files (FR12 — must stay byte-identical):**

| Code | Workflow source | Lines | Output artifact |
|---|---|---|---|
| `SI` | `workflows/signal-interpretation/workflow.md` | 52 | `{output_folder}/vortex-artifacts/hc5-signal-report-{date}.md` |
| `BA` | `workflows/behavior-analysis/workflow.md` | 52 | `{output_folder}/vortex-artifacts/hc5-behavior-report-{date}.md` |
| `MO` | `workflows/production-monitoring/workflow.md` | 52 | `{output_folder}/vortex-artifacts/hc5-portfolio-report-{date}.md` |

`PM` routes to `_bmad/core/workflows/party-mode/workflow.md` — meta item, handled as the `bmad-party-mode` skill; **not** in the parity fixture's `menuCodeToWorkflow`. Noah has **no `validate.md` capability** — cleaner than Isla's `VE` and Wade's `VE`; his `## Output Expectations` are all real artifacts.

---

## Story

As the Convoke maintainer, I want Noah's `SKILL.md` migrated from v5 XML-in-markdown to v6.3+ outcome-based markdown — preserving operational equivalence, personality, Operator Covenant compliance and the P0 test contract — with all atomic-by-agent dependents in the same PR, so that Noah is marketplace-eligible and Epic 2 reaches 5/7.

## Acceptance Criteria

**AC1–AC18 are as specified in [Story 2.4](i97-2-4-convert-isla-discovery-empathy-expert.md#acceptance-criteria)**, with the Noah substitutions in the fact table above. Only the ACs whose content genuinely differs are restated here.

### AC3 — 3 capability prompts (Noah delta)

Files: `references/{signal-interpretation,behavior-analysis,production-monitoring}.md`, each with the four exact sections `## Identity`, `## How It Works`, `## Output Expectations`, `## Activation`.

**HC5 output contract — Noah-specific and load-bearing.** All three of Noah's workflows emit **HC5** artifacts under `{output_folder}/vortex-artifacts/`. Each `## Output Expectations` must name the real HC5 path from the table above. Do not write a generic "a markdown report" — the HC5 contract is what Max consumes downstream, and [`contracts/hc5-signal-report.md`](../../_bmad/bme/_vortex/contracts/hc5-signal-report.md) is its schema. **Note the path shape:** Noah's artifacts sit under `vortex-artifacts/` while Max's and Emma's sit directly in `{output_folder}` — copy Noah's actual paths, not a sibling agent's pattern.

**CF #1 cross-agent hooks:** `SI`/`BA` name **Max** (`bmad-agent-bme-learning-decision-expert`) downstream as the HC5 consumer for pivot/persevere decisions; `MO` names **Emma** when portfolio signals suggest a scope question. Noah sits at stream 6 — his map points forward to Max and, on disconfirmation, back to **Liam** whose hypothesis the signal tests.

### AC5 — Workflow source files unchanged (FR12)

`git diff main -- _bmad/bme/_vortex/workflows/` returns empty. The three paths above must still exist.

### AC7 — `module-help.csv` row (Noah delta)

`phase` = `sensitize`. `outputs` derived from the table above: `hc5-signal-report-*.md, hc5-behavior-report-*.md, hc5-portfolio-report-*.md`. **Check the `output-location` column against Noah's real paths.** Measured 2026-08-28: Noah's three workflows are among the **minority** that genuinely write under `vortex-artifacts/` (the others are Mila's). Emma's three (`lean-persona`, `product-vision`, `contextualize-scope`), Wade's `mvp` and Max's `learning-card` all write to **`{output_folder}` root** — yet every existing CSV row carries `output-location: vortex-artifacts`. So the column is already wrong for Emma and Wade. **Noah's row will be one of the few that is actually correct** — write `vortex-artifacts` because it is true for him, not because the neighbouring rows say it. Do **not** fix the neighbouring rows here; record the observation and leave it (pre-existing, out of scope).

### AC9 / AC10 — Parity tests + baseline fixture (Noah delta)

Fixture at `tests/integration/fixtures/vortex-parity/production-intelligence-specialist-baseline.json`, mirroring the Emma/Wade/Mila/Isla schema key-for-key: `agentFirstName` `Noah`, `agentIcon` `📡`, `preMigrationContentLines` 117, `preMigrationGitBlob` `ce44f86898ff39c01e7f9d2d3f141b847f5b4341`, `preMigrationMenuCodes` the 7 above, `routedCapabilityCount` 3, `menuCodeToWorkflow` the 3 paths above.

Add a **5th** describe block to `tests/integration/vortex-parity.test.js` with the same 9 cases. **Expected total: 45 tests (9 × 5)** — assuming Story 2.4 landed its block first; if 2.4 has not landed, expect 36 and say so rather than asserting a number you did not observe.

**CF #2 gate:** run `extractV5MenuCodes` against Noah's real pre-migration content; expect sorted `[BA, CH, DA, MH, MO, PM, SI]`.

**Honest note for the synthetic-fixture test:** Noah's 7-code set is the **same cardinality as Mila's 7**. Write "exercises a 5th synthetic shape (7 codes, same size as Mila's)" — do **not** claim a size not previously exercised.

### AC-P0 — P0 suite stays green: `tests/p0/p0-noah.test.js`

**`p0-noah.test.js` is a CERTAIN edit.** It is in the identical unported state as `p0-isla.test.js` was — see [Story 2.4 AC-P0](i97-2-4-convert-isla-discovery-empathy-expert.md#ac-p0--p0-suite-stays-green-testsp0p0-islatestjs) for the full mechanism, evidence and rationale. Noah's values:

**Class A — preserve these literals in the SKILL.md (all three verified present in the v5 source 2026-08-28):**

| # | Assertion | Required literal | Must live in |
|---|---|---|---|
| `:32` | `def.persona.role.includes(…)` | `Signal Interpretation` | `## Identity` body |
| `:39` | `def.persona.identity.includes(…)` | `Sensitize` | `## Identity` body |
| `:44-47` | `def.persona.communication_style.includes(…)` | `The signal indicates` | `## Communication Style` body |
| `:52` | `def.menuItems.length === 7` | — | `## Capabilities` (7 rows) |

`VOICE_MARKERS['production-intelligence-specialist']` also expects `The signal indicates` **or** `what we're seeing in context` shared between registry and agent file, plus ≥2 of `signal/pattern/observe/behavior/metric/anomaly/data` in `## Principles`.

**Class B — port these three to the format-aware helpers (copy [`p0-mila.test.js:74-104`](../../tests/p0/p0-mila.test.js#L74)):**

| # | Today (inline v5 regex) | Port to | Threshold change |
|---|---|---|---|
| `:68` | `/<item\s[^>]*exec="…"/g`, `>= 4` | `extractExecPaths` + `resolveExecPath` | **`>= 4` → `>= 3`** |
| `:88` | `/<step n="2">…<step n="3">/` | `hasConfigErrorHandling` | — |
| `:104` | `/<r>/g`, `>= 5` | `countRules` | — |

**Why `>= 4` → `>= 3`:** v5 counts 4 `exec=` attributes (3 routed + `PM`'s party-mode path). The v6.3 extractor matches only ``Load `./references/…` ``, and `PM` routes to a skill name, not a path — so a correct conversion yields **3**.

**⚠ Noah has exactly 5 principles — zero slack against `countRules >= 5`.** Every one of the 5 v5 principles must survive into `## Principles` as a **bullet line** matching `/^\s*[-*]\s/`. Dropping or merging even one fails the ported `:104`. The 5, verbatim:

1. Signal + context + trend — raw metrics mean nothing without interpretation frames
2. Behavioral patterns reveal intent that surveys miss
3. Production data is the most honest user feedback — it can't lie
4. Anomaly detection surfaces what dashboards hide
5. Observe and report, don't prescribe — strategic decisions belong downstream

The three exact-string contracts (backticked `Load ./references/…` route, `## Principles` as ≥5 bullets, bold-prefixed `**Load config via bmad-init`) are as stated in Story 2.4 AC-P0. **Do not modify `tests/p0/helpers.js`.**

### AC11 — Personality preservation (Noah delta)

Baselines present — reuse. **Noah-specific re-calibration trigger (epic AR17):** if scoring surfaces ambiguity around **D2 Communication Style** (his pragmatic evidence-driven tone vs the more inquisitive agents), pause and re-calibrate per Story 1.2; do not silently retune.

**Persona fingerprint:** pragmatic, evidence-from-production; separates signal from noise; respects what production data shows over what the team wishes it said; **observe-and-report discipline — refuses to prescribe strategy** (principle 5, and the most likely CF #12 mismatch: do not write a `**CRITICAL Handling**` that has Noah recommending decisions).

**CF #10 wording:** report n-counts as *scored* observations and name them. As of 2026-08-28 the scored set is Emma + Wade (n=2); Mila and Isla may or may not have been scored by the time Noah is — check before writing a number.

## Tasks / Subtasks

Mirror [Story 2.4's Tasks 1–12](i97-2-4-convert-isla-discovery-empathy-expert.md#tasks--subtasks) exactly, substituting Noah's values. Deltas:

- **Task 1.2** — expect blob `ce44f86898ff39c01e7f9d2d3f141b847f5b4341`; halt and reconcile if different
- **Task 1.3** — CF #2 gate expects `[BA, CH, DA, MH, MO, PM, SI]`
- **Task 1.5** — record the P0 baseline tally *before* touching anything (`npm run test:p0`)
- **Task 4** — 3 capability prompts; each `## Output Expectations` names its real HC5 path
- **Task 7.4** — expect 45 parity tests if 2.4 landed, 36 if not; state which you observed
- **Task 7b.1a** — exec threshold `>= 4` → `>= 3`
- **Task 8.2** — post-migration fixtures use Noah's prompt IDs; read `baseline-fixed-prompt.json` for the ID prefix rather than assuming one
- **Task 12.3** — flip `i97-2-5-convert-noah-production-intelligence-specialist` and close the row in the same session as the code

## Dev Notes

**Read first:** [Story 2.4 (Isla)](i97-2-4-convert-isla-discovery-empathy-expert.md) in full — it is the canonical spec for this cycle and carries the P0 evidence tables. Then [Story 2.3 (Mila)](i97-2-3-convert-mila-research-convergence-specialist.md) for the 3-capability shape, and [Mila's converted SKILL.md](../../_bmad/bme/_vortex/agents/research-convergence-specialist/SKILL.md) as the structural template (Noah matches her capability count).

**Noah's position:** stream 6 (Sensitize), downstream of Wade's experiments, upstream of Max's decisions. His HC5 reports are Max's input. That makes his cross-agent map forward-pointing like Isla's, but with a disconfirmation arm back to Liam — a shape neither Isla nor Mila exercised.

**Same-LLM-bias mitigation:** operator handoff at Task 8.1 is mandatory. Do not self-score.

**Scope boundaries — out:** `tests/p0/helpers.js`; `scripts/update/lib/refresh-installation.js`; the `refs:audit` wide-sweep condition; workflow source files; Max and Liam (Stories 2.6, 2.7).

### References

- [Source: `_bmad-output/planning-artifacts/convoke-epic-bmad-v63-source-format-adoption.md#story-25-convert-noah-production-intelligence-specialist`]
- [Source: `_bmad/bme/_vortex/agents/production-intelligence-specialist/SKILL.md`] — 7 codes, 5 principles, 9 rules, 4 exec paths
- [Source: `tests/p0/p0-noah.test.js:32,39,44-47,52,68,88,104`] — the AC-P0 contracts
- [Source: `tests/p0/p0-voice-consistency.test.js:19-31`] — `VOICE_MARKERS` for Noah
- [Source: `scripts/update/lib/agent-registry.js:71-73`] — registry title/icon/stream
- [Source: `_bmad/bme/_vortex/contracts/hc5-signal-report.md`] — HC5 schema Noah's workflows emit

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List

**Expected new files (4):** 3 capability prompts + `tests/integration/fixtures/vortex-parity/production-intelligence-specialist-baseline.json`
**Expected modified files (5):** Noah's `SKILL.md`, `module.yaml`, `module-help.csv`, `tests/integration/vortex-parity.test.js`, **`tests/p0/p0-noah.test.js` (certain — Class B port)**
**Expected pre-created skeletons (2):** post-migration fixed-prompt + unscripted-scenario
**Expected new artifacts (1 + 1 operator-authored):** Covenant self-check report; personality scoring report (`status: pending-operator-confirmation`)

## Change Log

| Date | Change | By |
|------|--------|-----|
| 2026-08-28 | Story spec authored via `bmad-create-story`. Status: ready-for-dev. Lean delta-spec against Story 2.4, which is the canonical template for the cycle. All values re-derived from source 2026-08-28. **Carries the AC-P0 finding from 2.4's Round 1 review:** `p0-noah.test.js` is in the identical unported state — Class A (3 literals, all verified present in the v5 source) plus Class B (3 inline v5 regexes needing the helper port), with Noah's exec threshold dropping **`>= 4` → `>= 3`**. **Flagged: Noah has exactly 5 principles, zero slack against `countRules >= 5`** — all five enumerated verbatim in AC-P0 so none is lost to compression. Epic-text correction: epic lists `SI/BA/MO` (routed subset); source shows 7 codes and FR13 parity covers all 7. HC5 output contract made explicit at AC3/AC7 — all three of Noah's workflows emit HC5 artifacts under `vortex-artifacts/`, a path shape that differs from Max's and Emma's. | Amelia (dev) |
| 2026-08-28 | **Round 1 self-review.** Measured the claims that had only been reasoned: CF #2 gate set `[BA,CH,DA,MH,MO,PM,SI]` **matches** `extractV5MenuCodes` output; the `>=4 -> >=3` exec threshold rests on the rule "v6.3 exec count == routed count", **validated on all three converted agents** (Emma 4/4, Wade 5/5, Mila 3/3); 5 principles confirmed and all 5 verbatim; 8/8 line citations correct. **One correction applied:** the `output-location` note claimed Noah's `vortex-artifacts/` path "matches the column value used by Emma/Wade/Mila" — true of the column but misleading about reality. Measured: Emma's three workflows, Wade's `mvp` and Max's `learning-card` all write to `{output_folder}` **root** while every CSV row says `vortex-artifacts`, so the column is already wrong for Emma and Wade. Noah's row will be one of the few that is correct. Reworded to say so, with the neighbouring-row defect flagged as pre-existing and out of scope. | Amelia (dev) |
