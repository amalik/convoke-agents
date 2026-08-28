# Story i97-2.6: Convert Max (learning-decision-expert)

Status: ready-for-dev

**Epic:** [i97-epic-2 — Vortex Agent Conversions Complete](../planning-artifacts/convoke-epic-bmad-v63-source-format-adoption.md#epic-2-vortex-agent-conversions-complete) (atomic-by-agent commit pattern per ADR-004)
**Origin:** I97. **Sixth per-agent conversion.**
**Canonical template:** [Story 2.4 (Isla)](i97-2-4-convert-isla-discovery-empathy-expert.md) — the shared cycle is fully specified there. **This spec carries only Max's deltas.**
**Sequencing:** epic AR17 places 2.6 after 2.5 — Max consumes Noah's `signal-interpretation` (HC5) outputs, so converting Noah first keeps the downstream reference concrete. This is a *preference*, not a hard block: Max's conversion touches no file Noah's touches except `module.yaml`, `module-help.csv` and `vortex-parity.test.js`, all append-only. If run in parallel, expect append conflicts in those three and resolve by re-appending.
**Namespace decision (NFR9):** source edits under `_bmad/bme/_vortex/`, test edits under `tests/`.
**Estimated effort:** ~1–1.5 hr dev + ~30 min operator capture. Max has **4** routed capabilities — same count as Isla. Plus the Task 7b P0 port (~20–30 min), certain work.

---

## Verified facts (derived from source 2026-08-28 — not copied from the epic)

| Fact | Value |
|---|---|
| Pre-migration SKILL.md | `_bmad/bme/_vortex/agents/learning-decision-expert/SKILL.md` |
| Format / size / blob | v5 XML-in-markdown · 117 lines · `280bfd697aec9766d82e6dcbea7c4c6bdc2f6747` (clean at HEAD) |
| Canonical name | `bmad-bme-agent-max` |
| Title / icon / stream / phase | Learning & Decision Expert · 🧭 · Systematize · `systematize` |
| Menu codes (all) | `MH, CH, LC, PP, VN, VE, PM, DA` — **8** |
| Routed (4) | `LC` learning-card · `PP` pivot-patch-persevere · `VN` vortex-navigation · `VE` validate-learning |
| Meta (4) | `MH, CH, PM, DA` |
| v5 `<r>` rules | 8 |
| v5 `<principles>` | **7** |
| Baseline personality fixtures | present — **REUSE, do not re-capture** |

**Epic-text correction:** the epic lists Max's menu codes as `LC, PP, VN, VE` (4). That is the routed subset; source shows **8** codes including `MH/CH/PM/DA`. FR13 parity is asserted over all 8.

**Workflow source files (FR12 — must stay byte-identical):**

| Code | Workflow source | Lines | Output artifact |
|---|---|---|---|
| `LC` | `workflows/learning-card/workflow.md` | 51 | `{output_folder}/learning-card-{experiment-name}-{date}.md` |
| `PP` | `workflows/pivot-patch-persevere/workflow.md` | 51 | `{output_folder}/ppp-decision-{topic}-{date}.md` |
| `VN` | `workflows/vortex-navigation/workflow.md` | 54 | `{output_folder}/vortex-navigation-{date}.md` |
| `VE` | `workflows/learning-card/validate.md` | 134 | **none** — no `## Output` section (verified 2026-08-28) |

`PM` routes to core party-mode; meta item, not in `menuCodeToWorkflow`.

**Path-shape note (do not normalise):** Max's three artifacts sit **directly in `{output_folder}`**, not under `vortex-artifacts/` the way Noah's HC5 reports do. That is the source state; copy it. Fixing the inconsistency is out of scope for this story.

**`VE` indirection:** like Isla's `VE` and Wade's `VE`, Max's routes to a `validate.md` rather than a `workflow.md`. Unlike Wade's `mvp/validate.md` (a `Coming in v1.2.0` placeholder, verified at `:3`/`:22`), Max's `learning-card/validate.md` is **134 lines of real content** — closer to Isla's. Its `## Output Expectations` must describe an inline verdict, **not** invent a file artifact.

---

## Story

As the Convoke maintainer, I want Max's `SKILL.md` migrated from v5 XML-in-markdown to v6.3+ outcome-based markdown — preserving operational equivalence, personality, Operator Covenant compliance and the P0 test contract — with all atomic-by-agent dependents in the same PR, so that Max is marketplace-eligible and Epic 2 reaches 6/7.

## Acceptance Criteria

**AC1–AC18 are as specified in [Story 2.4](i97-2-4-convert-isla-discovery-empathy-expert.md#acceptance-criteria)**, with the Max substitutions above. Only genuine differences are restated.

### AC3 — 4 capability prompts (Max delta)

Files: `references/{learning-card,pivot-patch-persevere,vortex-navigation,validate-learning}.md`, each with the four exact sections.

**`VN` is cross-stream and is the one genuinely novel capability shape in Epic 2.** Vortex Navigation reasons about the framework *as a whole* — which stream to enter next — rather than producing a stream-local artifact. Its `## Identity` and `## How It Works` must convey that scope. It is also the capability most likely to tempt a re-author: keep it an activation pointer (~20–50 lines), with `workflows/vortex-navigation/workflow.md` remaining authoritative.

**CF #1 cross-agent hooks:** `LC` names **Wade** upstream (experiment results are the learning-card input) and **Noah** (HC5 production signal); `PP` names **Mila** for pivot-resynthesis when the decision is *pivot*, and **Liam** when it is *persevere with a revised hypothesis*; `VN` names whichever stream the recommendation points at — it is the natural home for the full 7-agent map. Max sits at stream 7 and closes the loop, so his escalation map points **backward into every other stream** — the inverse of Isla's forward-only map, and the strongest CF #1 observation available.

### AC5 — Workflow source files unchanged (FR12)

`git diff main -- _bmad/bme/_vortex/workflows/` returns empty. All four paths above must still exist.

### AC7 — `module-help.csv` row (Max delta)

`phase` = `systematize`. `outputs` derived from the table: `learning-card-*.md, ppp-decision-*.md, vortex-navigation-*.md`. **Do not add a `VE` artifact** — `learning-card/validate.md` produces none. **Check `output-location`** against Max's real paths, which are *not* under `vortex-artifacts/`; if the column cannot express that, record the discrepancy in the Dev Agent Record rather than silently writing a path that does not match source.

### AC9 / AC10 — Parity tests + baseline fixture (Max delta)

Fixture at `tests/integration/fixtures/vortex-parity/learning-decision-expert-baseline.json`: `agentFirstName` `Max`, `agentIcon` `🧭`, `preMigrationContentLines` 117, `preMigrationGitBlob` `280bfd697aec9766d82e6dcbea7c4c6bdc2f6747`, `preMigrationMenuCodes` the 8 above, `routedCapabilityCount` 4, `menuCodeToWorkflow` the 4 paths above.

Add a **6th** describe block. **Expected total: 54 tests (9 × 6)** if Stories 2.4 and 2.5 both landed; state the number you actually observed rather than asserting this one.

**CF #2 gate:** `extractV5MenuCodes` against Max's real pre-migration content; expect sorted `[CH, DA, LC, MH, PM, PP, VE, VN]`.

**Honest note:** Max's 8-code set matches Emma's and Isla's cardinality. Write "a 6th synthetic shape (8 codes, same size as Emma's and Isla's)".

### AC-P0 — P0 suite stays green: `tests/p0/p0-max.test.js`

**`p0-max.test.js` is a CERTAIN edit** — identical unported state to `p0-isla.test.js`. Mechanism, evidence and rationale: [Story 2.4 AC-P0](i97-2-4-convert-isla-discovery-empathy-expert.md#ac-p0--p0-suite-stays-green-testsp0p0-islatestjs). Max's values:

**Class A — preserve these literals (all three verified present in the v5 source 2026-08-28):**

| # | Assertion | Required literal | Must live in |
|---|---|---|---|
| `:33` | `def.persona.role.includes(…)` | `Validated Learning` | `## Identity` body |
| `:40` | `def.persona.identity.includes(…)` | `Systematize` | `## Identity` body |
| `:45-48` | `def.persona.communication_style.includes(…)` | `The evidence suggests` | `## Communication Style` body |
| `:53` | `def.menuItems.length === 8` | — | `## Capabilities` (8 rows) |

`VOICE_MARKERS['learning-decision-expert']` also expects `The evidence suggests` **or** `what we've learned` shared between registry and agent file, plus ≥2 of `evidence/decision/pivot/learning/data/action/experiment` in `## Principles`.

**Class B — port to the format-aware helpers (copy [`p0-mila.test.js:74-104`](../../tests/p0/p0-mila.test.js#L74)):**

| # | Today (inline v5 regex) | Port to | Threshold change |
|---|---|---|---|
| `:69` | `/<item\s[^>]*exec="…"/g`, `>= 5` | `extractExecPaths` + `resolveExecPath` | **`>= 5` → `>= 4`** |
| `:89` | `/<step n="2">…<step n="3">/` | `hasConfigErrorHandling` | — |
| `:105` | `/<r>/g`, `>= 5` | `countRules` | — |

**Why `>= 5` → `>= 4`:** v5 counts 5 `exec=` attributes (4 routed + `PM`). The v6.3 extractor matches only ``Load `./references/…` `` and `PM` routes to a skill name — a correct conversion yields **4**. (Max's numbers are the same as Isla's here; Noah's and Liam's are 4→3.)

**Principles:** Max has **7**, so there is slack against `countRules >= 5` — but render them as bullet lines matching `/^\s*[-*]\s/` regardless.

**⚠ Separator trap — Max is the only agent with this problem.** His v5 `<principles>` string uses `" - "` as **both** the item separator *and* the intra-item clause separator (measured 2026-08-28: **0 em-dashes, 13 hyphens** — 6 item separators + 7 clause separators). Noah and Liam use `—` for the clause and `-` for the item, so they split cleanly; Max does not. **A naive split on `" - "` yields 14 fragments, not 7 principles** — and the fragments are meaningless alone ("learn to read it before making decisions", "extract the learning"). That would still pass `countRules >= 5`, so **no test catches it** — it is a silent persona-fidelity loss. Use the correct 7-way pairing below verbatim:

1. Data tells a story — learn to read it before making decisions
2. Every experiment has a lesson, even failed ones — extract the learning
3. Decide and move — analysis paralysis kills innovation faster than wrong decisions
4. Pivot is not failure, it's intelligence — changing direction based on evidence is strength
5. Learning compounds — connect insights across experiments to see patterns
6. The Vortex never stops — every decision leads to the next cycle
7. Measure what matters — vanity metrics hide truth, actionable metrics reveal it

The three exact-string contracts are as stated in Story 2.4 AC-P0. **Do not modify `tests/p0/helpers.js`.**

### AC11 — Personality preservation (Max delta)

Baselines present — reuse. **Max-specific re-calibration trigger (epic AR17):** if scoring surfaces ambiguity around **D7 Output Format Consistency** (his decision-card structure), pause and re-calibrate per Story 1.2.

**Persona fingerprint:** decision-frame applied to learning; connects insight to action; **resists "interesting but useless" findings**; treats a pivot as intelligence rather than failure. **Likely CF #12 mismatch:** a `**CRITICAL Handling**` that has Max politely cataloguing findings. His captured behavior is to push for a decision — "decide and move" is principle 3. Read the baseline responses before writing that paragraph.

**CF #10 wording:** report n-counts as *scored* observations and name them. Check the scored set at the time you write; do not assume Isla or Noah have been scored.

## Tasks / Subtasks

Mirror [Story 2.4's Tasks 1–12](i97-2-4-convert-isla-discovery-empathy-expert.md#tasks--subtasks), substituting Max's values. Deltas:

- **Task 1.2** — expect blob `280bfd697aec9766d82e6dcbea7c4c6bdc2f6747`
- **Task 1.3** — CF #2 gate expects `[CH, DA, LC, MH, PM, PP, VE, VN]`
- **Task 1.5** — record the P0 baseline tally before touching anything
- **Task 4** — 4 capability prompts; `validate-learning.md` describes an inline verdict, no file; `vortex-navigation.md` conveys cross-stream scope without re-authoring the workflow
- **Task 7.4** — expect 54 parity tests if 2.4 + 2.5 landed; report what you observed
- **Task 7b.1a** — exec threshold `>= 5` → `>= 4`
- **Task 12.3** — flip `i97-2-6-convert-max-learning-decision-expert` and close the row in the same session as the code

## Dev Notes

**Read first:** [Story 2.4 (Isla)](i97-2-4-convert-isla-discovery-empathy-expert.md) in full — canonical spec and P0 evidence. Isla is also the closest structural match (4 routed capabilities, 8 codes, a real `validate.md` on `VE`), so her converted SKILL.md is the best template once it lands.

**Max's position:** stream 7 (Systematize) — the loop-closer. He consumes Wade's experiment results and Noah's HC5 signals, and routes back into Mila (pivot-resynthesis), Liam (revised hypothesis) or Isla (fresh discovery). His `VN` capability is the only one in the framework that reasons across all seven streams, which makes his capability prompts the natural place for the complete cross-agent map — and the strongest CF #1 test in Epic 2.

**Same-LLM-bias mitigation:** operator handoff at Task 8.1 is mandatory.

**Scope boundaries — out:** `tests/p0/helpers.js`; `refresh-installation.js`; the `refs:audit` wide-sweep condition; workflow source files; the `{output_folder}` vs `vortex-artifacts/` path inconsistency; Liam (Story 2.7).

### References

- [Source: `_bmad-output/planning-artifacts/convoke-epic-bmad-v63-source-format-adoption.md#story-26-convert-max-learning-decision-expert`]
- [Source: `_bmad/bme/_vortex/agents/learning-decision-expert/SKILL.md`] — 8 codes, 7 principles, 8 rules, 5 exec paths
- [Source: `tests/p0/p0-max.test.js:33,40,45-48,53,69,89,105`] — the AC-P0 contracts
- [Source: `tests/p0/p0-voice-consistency.test.js:19-31`] — `VOICE_MARKERS` for Max
- [Source: `scripts/update/lib/agent-registry.js:82-84`] — registry title/icon/stream
- [Source: `_bmad/bme/_vortex/workflows/learning-card/validate.md`] — 134 lines, no `## Output`

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List

**Expected new files (5):** 4 capability prompts + `tests/integration/fixtures/vortex-parity/learning-decision-expert-baseline.json`
**Expected modified files (5):** Max's `SKILL.md`, `module.yaml`, `module-help.csv`, `tests/integration/vortex-parity.test.js`, **`tests/p0/p0-max.test.js` (certain — Class B port)**
**Expected pre-created skeletons (2):** post-migration fixed-prompt + unscripted-scenario
**Expected new artifacts (1 + 1 operator-authored):** Covenant self-check; personality scoring report

## Change Log

| Date | Change | By |
|------|--------|-----|
| 2026-08-28 | Story spec authored via `bmad-create-story`. Status: ready-for-dev. Lean delta-spec against Story 2.4. All values re-derived from source 2026-08-28. **Carries the AC-P0 finding from 2.4's Round 1 review:** `p0-max.test.js` is in the identical unported state — Class A (3 literals, all verified present) plus Class B (3 inline v5 regexes), exec threshold **`>= 5` → `>= 4`**. Epic-text correction: epic lists `LC/PP/VN/VE` (routed subset); source shows 8 codes and FR13 parity covers all 8. Flagged three source facts the epic omits: Max's artifacts sit directly in `{output_folder}` rather than under `vortex-artifacts/` (unlike Noah's HC5 reports — do not normalise); `learning-card/validate.md` is 134 lines of real content with no `## Output`, so `VE` must not be given a file artifact; and `VN` is cross-stream, the only capability in the framework that reasons over all 7 streams, which makes Max's prompts the strongest available CF #1 observation. | Amelia (dev) |
| 2026-08-28 | **Round 1 self-review.** Measured the claims that had only been reasoned: CF #2 gate set `[CH,DA,LC,MH,PM,PP,VE,VN]` **matches** `extractV5MenuCodes` output; the `>=5 -> >=4` exec threshold rests on the rule "v6.3 exec count == routed count", **validated on all three converted agents**; 7 principles confirmed and all 7 verbatim; 8/8 line citations correct. **One finding added:** Max is the **only** agent whose v5 `<principles>` uses `" - "` as both the item separator and the intra-item clause separator (measured: 0 em-dashes, 13 hyphens = 6 item + 7 clause). Noah and Liam use `—` for the clause, so they split cleanly; Max does not. A naive split yields **14 fragments instead of 7 principles**, and because 14 >= 5 it still passes `countRules` — **no test catches it.** Silent persona-fidelity loss; warning added above the verbatim 7-way pairing. | Amelia (dev) |
