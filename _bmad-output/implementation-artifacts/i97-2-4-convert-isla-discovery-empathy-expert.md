# Story i97-2.4: Convert Isla (discovery-empathy-expert)

Status: ready-for-dev

**Epic:** [i97-epic-2 — Vortex Agent Conversions Complete](../planning-artifacts/convoke-epic-bmad-v63-source-format-adoption.md#epic-2-vortex-agent-conversions-complete) (atomic-by-agent commit pattern per ADR-004; one PR per agent)
**Origin:** I97 (BMAD v6.3+ Source Format Adoption / Convoke 4.0 packaging-contract). **Fourth per-agent conversion** after 2.1 (Emma POC), 2.2 (Wade), 2.3 (Mila).
**Branch convention (per ADR-004):** `i97-isla-conversion`. **Practice (per Stories 2.1–2.3):** work directly on `main` with one-file-per-commit cadence; ADR-004's branch-per-agent prescription is honored at the conceptual level (one PR per agent = one logical merge unit).
**Namespace decision (NFR9):** all source edits live under `_bmad/bme/_vortex/` (Convoke namespace). Test edits live under `tests/`. No upstream-BMAD files are touched. The `covenant-compliance-for-convoke-skills` rule applies.
**Estimated effort:** ~1–1.5 hr dev + ~30 min operator capture. Isla has 4 routed capabilities — between Mila's 3 (~1 hr actual) and Wade's 5 (~1.5–2 hr actual). **Plus** a one-off increment for Task 7b — a certain (not contingent) port of three P0 assertions, ~20–30 min, with no analogue in Stories 2.1–2.3.

---

## ⚠ Read this before Task 1 — two facts that differ from Stories 2.1–2.3

**(1) `tests/p0/p0-isla.test.js` will break on conversion in SEVEN places, and only four of them are fixable by writing the SKILL.md carefully.** Its `P0 Isla: Activation Sequence` block has 7 assertions bound to the v5 shape. Three read `def.persona.*` (fixable by preserving literal phrases); one counts menu rows (passes either way); **three use inline v5 XML regexes that no v6.3 file can ever satisfy** — those must be ported to the format-aware helpers, exactly as `p0-wade.test.js` and `p0-mila.test.js` already were. **`tests/p0/p0-isla.test.js` is therefore a certain edit in this story, not a contingency.** All seven were measured on 2026-08-28, not reasoned about — see AC-P0 for the evidence table. **This is the single highest-risk item in the story.**

**(2) Story 2.3 (Mila) is `in-progress`, not `done`, and has had no Round 1 code review.** Its dev work (Tasks 1–7, 9–11) is complete and on disk; it is HALTed at Task 8 pending operator personality scoring. Consequences for this story:
- **No new carry-forwards exist from 2.3.** Isla inherits the same **12** CF bindings (6 from Story 2.1 + 6 from Story 2.2 R1), unchanged. Do not invent a "13th from 2.3".
- **The 3rd-observation questions are still open.** CF #1 (cross-agent escalation), CF #3 (stage directions) and CF #7 (D6-outperforms-baseline) each stand at n=2 *scored* (Emma + Wade), not n=3. Mila's capture will be the 3rd scored observation whenever it happens; Isla's may land before or after it. **Per CF #10, write n-counts as scored observations, not as conversions shipped.** If Isla is scored before Mila, Isla is the 3rd scored observation — say so explicitly and name which agents the count covers.
- Dev work on 2.4 is **not** blocked by 2.3's HALT — the epic's AR17 lane (2.4 ‖ 2.5 ‖ 2.6 after 2.2/2.3) is a dev-sequencing constraint, and 2.3's dev is done.

**Staleness note:** this spec was authored 2026-08-28 against a repo state last touched by Story 2.3 on 2026-05-03 (~4 months). Every path, count, code, hash and command below was re-derived from source on 2026-08-28, not copied from the epic or from Story 2.3. Where the epic text and source disagree, source wins and the divergence is called out.

---

## Story

As the Convoke maintainer, I want Isla's `SKILL.md` migrated from v5/early-v6 XML-in-markdown to v6.3+ outcome-based markdown — preserving operational equivalence (menu codes, workflow paths, output filenames), personality (calibrated rubric), Operator Covenant compliance, **and the existing P0 test contract** — with all atomic-by-agent dependents (4 capability prompts, manifest entries, parity tests, audit-report citations) in the same PR, so that:

1. Isla is marketplace-eligible per the BMAD v6.3+ format submission gate;
2. Isla preserves her empathy-driven, evidence-respecting persona under the calibrated rubric (FR23);
3. Epic 2 reaches 4/7 with the per-agent cycle validated against **the first agent whose P0 suite still binds structural assertions to v5 XML** — Wade's and Mila's were ported to format-aware helpers before their conversions, and Emma's survived on phrase preservation alone, so no prior story had to do this port;
4. Stories 2.5–2.7 estimate against the composite Emma + Wade + Mila + Isla actuals.

## Context & Motivation

**Why Isla now.** Per epic AR17 sequencing: Emma (POC) → Wade ‖ Mila → **Isla ‖ Noah ‖ Max** → Liam (closes E2). Isla opens the mid-batch lane. Her persona fingerprint — empathy-driven probing, "what users say" vs "what users do" — is a fourth distinct signal class after Emma's curious-clarifying, Wade's action-bias refusal, and Mila's convergence-discipline.

**What is the same as Emma + Wade + Mila:**
- 11-activity Within-PR Sequence (epic § "Within-PR Sequencing")
- 4-category fixup checklist ([`scripts/migration/format-conversion/fixup-checklist.md`](../../scripts/migration/format-conversion/fixup-checklist.md), per ADR-002)
- Personality scoring against the calibrated rubric (FR21–23), operator-handoff mandatory
- Operator Covenant self-check (OC-R0..R7), with OC-R3 + OC-R5 inherited from Story 2.1
- 12 calibration carry-forward bindings

**What is different vs Mila (derived from source 2026-08-28):**

| | Mila (2.3) | Isla (2.4) |
|---|---|---|
| Routed capabilities | 3 | **4** |
| Total menu codes | 7 | **8** |
| `validate.md` indirection | none | **yes — `VE` → `empathy-map/validate.md`** (Emma/Wade-shaped, not Mila-shaped) |
| P0 suite shape | phrase-agnostic (`fileMentions`) | **v5-shaped `def.persona.*` — must be handled** |
| Pre-migration LOC | 117 | **117** |
| Stream / phase | synthesize | **empathize** |

**Divergence from the epic text (epic line 573 ff.), for the record:** the epic lists Isla's "Menu codes" as `EM, UI, UD, VE` and "Capability count: 4". Source shows **8** menu items — the four routed codes plus the four meta codes `MH / CH / PM / DA` that every Vortex agent carries. The epic is describing routed capabilities only. Parity (FR13) is asserted over **all 8**. This is the same shape as Mila's spec, which corrected `RC/PR/PA` (3) to the 7-code full set.

---

## Acceptance Criteria

**Pattern note:** ACs follow Story 2.1/2.2/2.3 structure. Where wording is identical, reference is by AC number. Where Isla-specific, the AC is restated. **AC-P0 is new to this story.**

### AC1 — Isla's SKILL.md converted to v6.3+ format with zero XML elements

**Given** Isla's pre-migration SKILL.md at [`_bmad/bme/_vortex/agents/discovery-empathy-expert/SKILL.md`](../../_bmad/bme/_vortex/agents/discovery-empathy-expert/SKILL.md) — current state verified 2026-08-28: v5 XML-in-markdown, 117 lines, fenced ` ```xml `, git blob `cda02c24882b971ef913ce2a6453099745c6aed2`, working tree clean
**When** the conversion is authored per the BMB-converted-Mila pattern AND the fixup checklist is applied
**Then** the post-migration SKILL.md contains zero v5 XML elements (regex `/<(agent|activation|menu|item|step|persona|rules|menu-handlers|handler|r)\b/` returns no matches)
**And** the `## On Activation` section delegates config loading to the `bmad-init` skill (Story 2.1 OC-R3 Option A precedent — pedagogy over punition; CF #5)
**And** the `**CRITICAL Handling**` block enumerates Isla's load-bearing principles (listen before you define / observe before you assume / feelings are data / talk to real people, not personas) **and describes the actual observed pattern in the baseline transcripts, not a softer aspiration** (CF #12).

### AC2 — Frontmatter `name:` equals `bmad-bme-agent-isla` (BMB canonical per ADR-001)

Pattern matches Story 2.1 AC2. `description:` must be a real one-line description (no `TBD` placeholder) — Emma/Wade/Mila precedent.

### AC3 — 4 capability prompts authored at `references/{cap}.md` per Pattern-C-friendly format

**Given** Isla has 4 routed capabilities: `EM` (empathy-map), `UI` (user-interview), `UD` (user-discovery), `VE` (validate-empathy)
**Then** all 4 files exist:
- `_bmad/bme/_vortex/agents/discovery-empathy-expert/references/empathy-map.md`
- `_bmad/bme/_vortex/agents/discovery-empathy-expert/references/user-interview.md`
- `_bmad/bme/_vortex/agents/discovery-empathy-expert/references/user-discovery.md`
- `_bmad/bme/_vortex/agents/discovery-empathy-expert/references/validate-empathy.md`

**And** each has the four Pattern-C-friendly sections: `## Identity`, `## How It Works`, `## Output Expectations`, `## Activation` (exact strings — the parity test does `includes()` on them)
**And** each is ~20–50 lines (activation pointer + scope summary; **not** a workflow re-author)
**And** each `## Activation` names the correct workflow source path (FR12 paths unchanged — see AC5 table)
**And** capability prompts surface cross-agent escalation hooks (**CF #1 binding**): `EM`/`UD` route downstream to **Mila** (`bmad-agent-bme-research-convergence-specialist`) for synthesis once ≥2 evidence layers exist; `UI` notes **Emma** upstream when WHO/WHY framing is missing; `VE` notes routing back to `UI`/`UD` when evidence depth fails. Isla is the *upstream* agent in the Vortex chain — her escalation map points forward, not backward, which is a different shape from Mila's and is the point of the 4th observation.

**Note on `validate-empathy.md`:** the `VE` route targets [`empathy-map/validate.md`](../../_bmad/bme/_vortex/workflows/empathy-map/validate.md), a 117-line review checklist with **no output artifact** (verified 2026-08-28 — no `## Output` section). Its `## Output Expectations` must say what it actually produces (an inline validation verdict against the 4 checks: Evidence / Specificity / Completeness / Actionability), not invent a file. Wade's analogous `VE → mvp/validate.md` was flagged at his OC-R4 self-check as a placeholder chain; **Isla's `validate.md` is real content**, so no placeholder flag is warranted here — but do not upgrade it into an artifact-producing capability either.

### AC4 — Menu code set preservation (FR13)

**Given** Isla's pre-migration menu codes, derived from source: `{MH, CH, EM, UI, UD, VE, PM, DA}` (8 codes; 4 routed + 4 meta)
**Then** the post-migration `## Capabilities` table contains the same 8 codes, one row each — lexical set equality.

### AC5 — Workflow source files unchanged (FR12)

`git diff main -- _bmad/bme/_vortex/workflows/` returns empty. Routed paths, all verified present 2026-08-28:

| Code | Workflow source | Lines |
|------|-----------------|-------|
| `EM` | `_bmad/bme/_vortex/workflows/empathy-map/workflow.md` | 45 |
| `UI` | `_bmad/bme/_vortex/workflows/user-interview/workflow.md` | 51 |
| `UD` | `_bmad/bme/_vortex/workflows/user-discovery/workflow.md` | 45 |
| `VE` | `_bmad/bme/_vortex/workflows/empathy-map/validate.md` | 117 |

(`PM` routes to `_bmad/core/workflows/party-mode/workflow.md` — core, not Vortex; handled as a meta item routing to the `bmad-party-mode` skill per Emma/Wade/Mila precedent, and **not** listed in the parity fixture's `menuCodeToWorkflow`.)

### AC6 — `module.yaml` `agents:` array entry added for Isla

Appended to [`_bmad/bme/_vortex/module.yaml`](../../_bmad/bme/_vortex/module.yaml) (currently 3 entries: emma, wade, mila). Fields per BMM canonical schema: `code: bmad-bme-agent-isla`, `name: Isla`, `title: Discovery & Empathy Expert`, `icon: "🔍"`, `team: vortex`, `description:` real one-liner. **Do not touch the `# INCOMPLETE BY DESIGN` comment above the array** — it was corrected at `48c8109a` and already says the right thing.

### AC7 — `module-help.csv` row added for Isla

Appended to [`_bmad/bme/_vortex/module-help.csv`](../../_bmad/bme/_vortex/module-help.csv) with BMM-canonical column ordering (13 columns, per the existing header). `phase` = `empathize`. `output-location` = `vortex-artifacts`. `outputs` = **derive from the workflow files** — verified 2026-08-28: `empathy-map-*.md, user-interview-*.md, user-discovery-*.md`. **Do not add a `validate-*.md` entry**: `empathy-map/validate.md` produces no artifact. (Emma's existing row lists `validation-plan-*.md` although `lean-persona/validate.md` likewise declares no output — that is a pre-existing inaccuracy in someone else's row; do not replicate it, and do not fix it in this story.)

### AC8 — Slash-command wrapper inherits; no per-agent change (Story 2.1 OC-R5 inheritance)

**Given** Story 2.1's format-agnostic template fix at [`scripts/update/lib/refresh-installation.js`](../../scripts/update/lib/refresh-installation.js)
**Then** verify [`.claude/skills/bmad-agent-bme-discovery-empathy-expert/SKILL.md`](../../.claude/skills/bmad-agent-bme-discovery-empathy-expert/SKILL.md) line 11 reads `3. FOLLOW the activation steps precisely` (full-line quote per Story 2.2 R1 Patch 4).
**Verified 2026-08-28:** Isla's wrapper is byte-identical to Emma's, Wade's and Mila's modulo the agent name/path. **No wrapper change required.** Mark OC-R5 PASS by inheritance (CF #6) — do not re-justify.

### AC9 — Parity tests added for Isla

**Given** [`tests/integration/vortex-parity.test.js`](../../tests/integration/vortex-parity.test.js) — 432 lines, 3 describe blocks (Emma / Wade / Mila), **27/27 passing, re-run 2026-08-28**
**Then** add an `ISLA_FIXTURE_PATH` constant and a 4th describe block with the same 9 test cases:
1. post-migration SKILL.md exists at canonical path
2. zero v5 XML elements
3. post-migration menu code set equals pre-migration baseline (8 codes)
4. frontmatter `name:` equals `bmad-bme-agent-isla`
5. `references/` has 4 capability prompts — **count read via `fs.readdirSync`, never hardcoded** (`derive-counts-from-source`)
6. each capability prompt has the 4 Pattern-C-friendly sections
7. workflow source files from `menuCodeToWorkflow` still exist
8. `runParityCheck` returns documented shape
9. `extractV5MenuCodes` regression test against an Isla-shaped synthetic v5 fixture

**Expected total after this story: 36 tests (9 × 4).**

**Honest note on test 9 (do not overclaim):** Emma's synthetic sample is 2 codes, Wade's 9, Mila's 7. **Isla's is 8 — a fourth distinct size.** But Isla's *real* pre-migration code set is also 8, the same cardinality as Emma's real 8-code set. In the describe-block comment, say what is true: "exercises the extractor against a 4th synthetic shape (8 codes)". Do **not** write "a code-set size not previously exercised" — Emma's live baseline is also 8.

**CF #2 gate (mandatory before declaring dev done):** run `extractV5MenuCodes` against Isla's *actual* pre-migration SKILL.md content (git blob `cda02c24882b971ef913ce2a6453099745c6aed2`) and verify the result is non-empty and equals `[CH, DA, EM, MH, PM, UD, UI, VE]` sorted. This catches R2-P4-class fence-stripping regressions.

### AC10 — Isla's pre-migration parity baseline fixture authored

Create `tests/integration/fixtures/vortex-parity/discovery-empathy-expert-baseline.json` mirroring the Emma/Wade/Mila schema exactly (same keys, same order). Values, all derived from source 2026-08-28:

```
agentRoleName            "discovery-empathy-expert"
agentFirstName           "Isla"
agentTitle               "Discovery & Empathy Expert"
agentIcon                "🔍"
preMigrationFormat       "v5-xml-in-markdown"
captured                 "<date> (Story 2.4 Task 1)"
sourcePath               "_bmad/bme/_vortex/agents/discovery-empathy-expert/SKILL.md"
preMigrationContentLines 117
preMigrationGitBlob      "cda02c24882b971ef913ce2a6453099745c6aed2"
preMigrationMenuCodes    ["MH","CH","EM","UI","UD","VE","PM","DA"]
preMigrationMenuCodesSorted ["CH","DA","EM","MH","PM","UD","UI","VE"]
routedCapabilityCount    4
routedCapabilityCodes    ["EM","UI","UD","VE"]
metaCapabilityCodes      ["MH","CH","PM","DA"]
workflowSourceFiles      [4 paths per AC5 table]
menuCodeToWorkflow       {EM,UI,UD,VE → the 4 paths per AC5 table}
```

Re-derive `preMigrationGitBlob` at Task 1 with `git rev-parse HEAD:_bmad/bme/_vortex/agents/discovery-empathy-expert/SKILL.md` and confirm it still matches the value above before writing the fixture. If it differs, the file changed since this spec was written — stop and reconcile.

### AC-P0 — P0 suite stays green: `tests/p0/p0-isla.test.js` (NEW — no analogue in Stories 2.1–2.3)

**Baseline measured 2026-08-28: `npm run test:p0` → 642 pass / 0 fail / 0 skip.** The same command must return 642 pass / 0 fail after conversion (more is fine if tests are added; never fewer, never any fail).

`p0-isla.test.js` has **two** describe blocks. The second (`P0 Isla: Workflow Execution Output`, lines 116–222) reads only workflow files — unchanged per FR12, **unaffected**. The first (`P0 Isla: Activation Sequence`, lines 21–112) has **7 assertions bound to the v5 shape**, in two distinct classes.

#### Class A — fixable in the SKILL.md (preserve the literal, do not paraphrase)

`parseV63Definition` ([`helpers.js:191-219`](../../tests/p0/helpers.js#L191)) maps `## Identity` → both `persona.role` and `persona.identity`, and `## Communication Style` → `persona.communication_style`. So these assertions keep running after conversion; they just read a different string.

| # | Assertion | Required literal | Must live in |
|---|---|---|---|
| `:32` | `def.persona.role.includes(…)` | `Qualitative Research Expert` | `## Identity` body |
| `:39` | `def.persona.identity.includes(…)` | `Empathize` | `## Identity` body |
| `:44-47` | `def.persona.communication_style.includes(…)` | `I noticed that` | `## Communication Style` body |
| `:52` | `def.menuItems.length === 8` | — | `## Capabilities` (8 rows) |

**Measured 2026-08-28** by replicating the exact mapping through the exported `extractMarkdownSection` against two candidate bodies: a natural paraphrase **fails `:32`, `:39` and `:44-47`**; a body preserving the three literals **passes all four**. `:52` passed in both (the table parse returns `[MH,CH,EM,UI,UD,VE,PM,DA]`). So Class A is real, and phrase preservation is sufficient for it.

**Preserve rather than rewrite.** All three literals are genuinely Isla's — her registry role, her stream, her signature phrase — so preserving them serves FR2 as well as the test. **Emma is the live precedent:** [`p0-emma.test.js:304,315`](../../tests/p0/p0-emma.test.js#L304) still assert `def.persona.role.includes('Product')` and `communication_style.includes('really solving')`, and both pass against her *converted* file because those phrases survived into the right sections.

#### Class B — NOT fixable in the SKILL.md; the test must be ported

These three use **inline v5 XML regexes written directly in `p0-isla.test.js`**, not the format-aware helpers. No v6.3 file can satisfy them at any content.

| # | Inline mechanism | vs Isla today (v5) | vs a real converted v6.3 file (Mila) |
|---|---|---|---|
| `:68` | `/<item\s[^>]*exec="([^"]+)"[^>]*>/g`, asserts `>= 5` | 5 paths → **PASS** | **0 paths → FAIL** |
| `:88` | `/<step n="2">([\s\S]*?)<step n="3">/`, asserts match | matched → **PASS** | **null → FAIL** |
| `:104` | `rawContent.match(/<r>/g)`, asserts `>= 5` | 8 → **PASS** | **0 → FAIL** |

**Measured 2026-08-28** by running all three verbatim against Mila's already-converted SKILL.md. They pass on Isla's v5 file today and fail on real v6.3 content — i.e. they are green now and break precisely on conversion.

**The fix is a mechanical port to helpers that already exist and are already exported** — `extractExecPaths(rawContent, def.format)`, `hasConfigErrorHandling(def, rawContent)`, `countRules(def, rawContent)`. Same measurement run confirms all three return correct values for both formats (Isla v5: 5 / true / 8; Mila v6.3: 3 / true / 5). Copy the shape from [`p0-mila.test.js:74-104`](../../tests/p0/p0-mila.test.js#L74), including its retitled test names:

- `'capability-prompt files referenced from menu surface exist on disk'` — use `extractExecPaths` + `resolveExecPath`, and **change the threshold from `>= 5` to `>= 4`**. v5 counted 5 `exec=` attributes (4 routed + `PM`'s party-mode path); the v6.3 extractor matches only ``Load `./references/…` ``, and `PM` routes to the skill name `bmad-party-mode`, which is not a path. Isla has **4** capability prompts, so `>= 5` would fail on a correct conversion.
- `'activation has config-error handling on step 2 (or v6.3 step-1 bmad-init delegation)'` — use `hasConfigErrorHandling`.
- `'principles/rules section has at least 5 entries'` — use `countRules`.

#### Three exact-string contracts the converted SKILL.md must satisfy for Class B to pass

Derived from the helper implementations 2026-08-28. Each is a literal-match requirement, not a stylistic preference:

1. **Capabilities routes** — `extractExecPaths` ([`helpers.js:352-363`](../../tests/p0/helpers.js#L352)) scans the `## Capabilities` section for ``/Load `(\.\/references\/[^`]+)`/g``. The Skill column must read exactly ``Load `./references/<file>.md` `` — **with backticks**. Any other phrasing yields 0 paths.
2. **Principles bullets** — `countRules` ([`helpers.js:384-395`](../../tests/p0/helpers.js#L384)) counts lines in `## Principles` matching `/^\s*[-*]\s/`, and asserts `>= 5`. Isla's 7 v5 principles must be rendered as **bullet lines**, not a prose paragraph.
3. **bmad-init delegation marker** — `hasErrorHandling` ([`helpers.js:232-248`](../../tests/p0/helpers.js#L232)) requires step 1 of `## On Activation` to match `/\*\*[^*]*Load config via `?bmad-init/i` — a **bold-prefixed** "Load config via bmad-init". Mila's `1. **Load config via bmad-init skill** — …` is the canonical shape.

Also required (unchanged from the rest of the story, restated here because they are P0-enforced): H1 `# Isla`; `## On Activation` with **≥3** top-level numbered items (`MIN_NUMERIC_ACTIVATION_STEPS['v6.3'] = 3`, [`helpers.js:314`](../../tests/p0/helpers.js#L314)); and non-empty `## Identity`, `## Communication Style`, `## Principles` sections (`p0-activation.test.js` asserts all three are present for every agent).

**Do not modify [`tests/p0/helpers.js`](../../tests/p0/helpers.js).** It is shared by all 7 agents, was hardened at story `i97-bug-1`, and already supports everything this story needs — the port consumes existing exports, it does not extend them. Changing the discriminator to suit one agent is how the R1 fence-stripping regression documented at [`helpers.js:291-298`](../../tests/p0/helpers.js#L291) happened.

**Precedent note for Stories 2.5–2.7:** `p0-noah`, `p0-max` and `p0-liam` are in the same state as `p0-isla` — Class A literals plus Class B inline regexes. Whatever shape this story lands, those three inherit it.

### AC11 — Personality preservation: no dimension at 1 (FR23 disconfirmation gate)

**Given** Isla's baseline fixtures — **verified present 2026-08-28. REUSE, do NOT re-capture.** First committed 2026-05-01 (`dce11310`); note that the fixture itself carries **no `capture_date` field** — the date is only recoverable from git. That is precisely the gap CF #11 exists to close, so the *post-migration* fixture you author at Task 8.2 must carry `capture_date` and `capture_session_id` in-file:
- [`tests/migration/personality-preservation/fixtures/discovery-empathy-expert/baseline-fixed-prompt.json`](../../tests/migration/personality-preservation/fixtures/discovery-empathy-expert/baseline-fixed-prompt.json) — 7 prompts `IS-FP1`..`IS-FP7`, covering dimensions D1/D2/D5/D7
- [`tests/migration/personality-preservation/fixtures/discovery-empathy-expert/baseline-unscripted-scenario.md`](../../tests/migration/personality-preservation/fixtures/discovery-empathy-expert/baseline-unscripted-scenario.md)

**When** post-migration capture runs (**operator handoff** — fresh `/bmad-agent-bme-discovery-empathy-expert` session)
**Then** all 7 dimensions score ≥ 2.

**Threshold-tier semantics (CF #9):** the rubric's gate table is canonical — ≥3 all dims = auto-PASS; any dim = 2 = ship-with-note (operator judgment); any dim = 1 = BLOCK per FR23. AC11 enforces only the BLOCK threshold; report against the tiered table.

**Isla's expected persona signals** (from the baseline fixture's own `expected_persona_signals.should_appear`, verified 2026-08-28):
- distinguishing "what users say" from "what users do"
- probing for emotions and felt experience ("What did the user say they felt during that?")
- Says / Thinks / Does / Feels framing
- pushing for direct user contact over assumption
- celebrating messy / raw findings
- warm-but-probing tone, "I noticed that…" patterns

`should_NOT_appear`: synthesizing personas from imagination instead of research; skipping user emotions to extract "requirements".

**Carry-forward bindings to apply during scoring:**
- **CF #1 (cross-agent escalation — D5/D7):** Emma regressed, Wade preserved, Mila pending. Score whether Isla's converted file preserves a forward routing map (to Mila / Emma). Report the tally as *scored* observations and name them.
- **CF #3 (stage directions / emoji — D2):** Emma had them across all 7 responses, Wade had zero, Mila pending. Track per-response.
- **CF #4:** do not penalize lean compression as automatic D7 drift.
- **CF #7 (D6-outperforms-baseline):** Emma + Wade both outperformed; Mila pending. Track.
- **CF #10 (wording):** no `FALSIFIED` until n≥4 *scored*. Use "not replicated in X scored observations (Emma, Wade[, Mila])".
- **CF #11:** fill `capture_date` and `capture_session_id` **at capture time**. Never leave `TBD-fill-when-captured`. If captured in the implementation session, write `same-session-as-implementation (per same-LLM caveat documented in scoring report)`.
- **CF #12:** the `**CRITICAL Handling**` paragraph must match the captured behavior in `baseline-fixed-prompt.json`, not a softer aspiration. Isla's likely pattern: *refuses to accept a persona built from team assumptions; redirects to talking to real users first.* Read the 7 baseline responses before writing that paragraph.

**Isla-specific re-calibration trigger (epic AR17 #7):** if scoring surfaces ambiguity around **D4 Conversational Signals** (her empathy-probing patterns), pause and re-calibrate per Story 1.2 — do **not** silently retune the rubric mid-story; open a backlog row per the rubric's anti-silent-retune rule.

**Fixup-rescore loop:** max 3 iterations; escalate via `bmad-correct-course` after 3 without all-≥-2.

### AC12 — Audit report citations refreshed atomically (NFR12)

Run `grep -rE 'discovery-empathy-expert/SKILL\.md#' _bmad-output/planning-artifacts/`. Refresh any `#anchor` citations found, **or** record "N/A — no Isla-specific line anchors found" in the Dev Agent Record per Story 2.1/2.2/2.3 precedent. Path-only references (no `#`) need no refresh.

**Scope guard:** **123 files** mention `discovery-empathy-expert` repo-wide (derived 2026-08-28 over `*.md,*.csv,*.yaml,*.js,*.json`, excluding `node_modules`) — mostly backups, archives, docs and tests. NFR12 covers **line-anchored citations in audit/planning artifacts only**. Do not sweep `_bmad-output/.backups/`, `_bmad-output/_archive/`, or `docs/` — those are DATED records, and repairing them destroys evidence (project-context `LIVE pointer vs DATED record`).

### AC13 — Reference integrity passes

`node scripts/audit/reference-integrity.js` exits 0 with zero broken refs. **Baseline verified 2026-08-28: `PASS — 79 references checked, 0 broken`.**

**Do not use `npm run refs:audit` as this AC's gate.** That variant sweeps `_bmad-output,_bmad/bme,docs` plus root markdown and currently reports `FAIL — 2736 references checked, 657 broken` — a large pre-existing condition tracked separately in the initiative backlog. It is not this story's to fix, and it will never go green here. Gate on the bare invocation; note the wide-sweep number only as context if a reviewer asks.

### AC14 — `npm run lint` exits 0 with zero warnings on touched files (NFR5)

### AC15 — Fixup checklist (ADR-002) reviewed; all 4 categories PASS

Categories per [`fixup-checklist.md`](../../scripts/migration/format-conversion/fixup-checklist.md): (1) Persona preservation, (2) Hardcoded error-string preservation / OC-R3, (3) Capability menu code preservation, (4) Workflow file path preservation per FR12.

**Isla-specific Category 1 scrutiny (epic AR17 #7):** the v5 `<persona>` block carries **7 principles**, and the v5 `<rules>` block repeats **4 of them**. Both must be reconciled into one `## Principles` section without dropping any of the 7. Enumerate all 7 in the Dev Agent Record and check them off individually — Mila's Task 3.1 did this for her 5 and it is what makes Category 1 auditable.

The 7 v5 principles (verbatim from source):
1. Listen before you define — deep understanding precedes problem framing
2. Observe before you assume — real user behavior trumps team hypotheses
3. Feelings are data — emotional responses reveal unmet needs
4. The messier the research, the richer the insights — embrace ambiguity
5. Talk to real people, not personas — personas come from research, not imagination
6. Empathy is a practice, not a phase — keep returning to users throughout the journey
7. Capture says, thinks, does, AND feels — the full picture matters

### AC16 — Operator Covenant self-check (OC-R0..R7) all PASS

Report at `_bmad-output/planning-artifacts/convoke-report-operator-covenant-self-check-isla-conversion-<YYYY-MM-DD>.md`, following [Mila's](../planning-artifacts/convoke-report-operator-covenant-self-check-mila-conversion-2026-05-03.md) structure.
**CF #5:** OC-R3 PASS by inheriting Story 2.1's Option A (bmad-init walkthrough) — document the inheritance, do not re-justify.
**CF #6:** OC-R5 PASS by inheriting Story 2.1's template fix — document.
**OC-R0** enumerates the 3-layer interaction surface: wrapper → canonical SKILL.md → 4 capability prompts.
**OC-R4 note:** Isla's `VE → empathy-map/validate.md` is real 117-line content, not a Wade-style "Coming in v1.2.0" placeholder — record that distinction rather than copying Wade's flag or Mila's "no chains at all".

### AC17 — Failure Handling Pattern path documented

Epic 2 Modes 1–5. Most relevant here: **Mode 2** (fixup misses persona drift — trigger: any dim at 1), **Mode 3** (parity green but personality fails), **Mode 5** (operator unavailable). **Mode 4** is the AR17 #7 D4 re-calibration trigger. Record which modes were encountered and which were not.

### AC18 — DoD checklist (per-agent PR checklist + carry-forward bindings)

Closure semantics: **"13/13 ACs satisfied + 12/12 CF bindings explicitly addressed in the Dev Agent Record."** (13 = AC1–AC12 + AC-P0; AC13–AC18 are process gates, counted as the checklist itself per Story 2.2 R1 Patch 5 reconciliation.)

**The 12 carry-forward bindings — unchanged from Story 2.3, since 2.3 has had no Round 1 review:**

*From Story 2.1 (6):* (1) cross-agent escalation regression watch — score in D5/D7; (2) run `extractV5MenuCodes` against the real pre-migration content during dev; (3) track stage directions / emoji per response; (4) don't penalize lean compression as automatic D7 drift; (5) `bmad-init` walkthrough IS the OC-R3 implementation — inherit; (6) wrapper template is format-agnostic — inherit, no scope expansion into `refresh-installation.js`.

*From Story 2.2 R1 (6):* (7) D6-outperforms-baseline tracking; (8) scoring report frontmatter starts `status: pending-operator-confirmation` with an explicit `status_transition` field; (9) AC11 three-tier semantics — rubric gate table is canonical; (10) "not replicated in N observations" wording, no `FALSIFIED` until n≥4; (11) capture metadata filled at capture time; (12) persona description matches captured behavior.

---

## Tasks / Subtasks

> **Sequencing:** the same 11-activity Within-PR Sequence as Stories 2.1–2.3, with **Task 7b inserted** for the P0 regression that is unique to this agent.

- [ ] **Task 1 — Capture pre-migration baseline** (Activity 1) (AC10)
  - [ ] 1.1 Verify personality baseline fixtures intact (2 files at `tests/migration/personality-preservation/fixtures/discovery-empathy-expert/`) — **do not re-capture**
  - [ ] 1.2 Re-derive the git blob: `git rev-parse HEAD:_bmad/bme/_vortex/agents/discovery-empathy-expert/SKILL.md` — expect `cda02c24882b971ef913ce2a6453099745c6aed2`; if it differs, halt and reconcile with this spec
  - [ ] 1.3 **CF #2 explicit gate:** run `extractV5MenuCodes` against the real pre-migration content; expect the sorted 8-code set `[CH, DA, EM, MH, PM, UD, UI, VE]`. Record the actual output in the Debug Log
  - [ ] 1.4 Create `tests/integration/fixtures/vortex-parity/discovery-empathy-expert-baseline.json` per AC10
  - [ ] 1.5 **Record the P0 baseline before touching anything:** `npm run test:p0` → expect `642 pass / 0 fail`. Paste the tally into the Debug Log — this is the number AC-P0 is measured against
  - [ ] 1.6 Natural commit point

- [ ] **Task 2 — Author the v6.3+ conversion** (Activity 2) (AC1, AC2)
  - [ ] 2.1 Author per the BMB-converted-Mila pattern ([Mila's SKILL.md](../../_bmad/bme/_vortex/agents/research-convergence-specialist/SKILL.md) is the closest structural template; Emma's is the closest *phrase-preservation* template)
  - [ ] 2.2 Section order: frontmatter → `# Isla` → `## Overview` → `## Identity` → `## Communication Style` → `## Principles` → embodiment paragraph → `## Capabilities` → `## On Activation` → `**CRITICAL Handling**`
  - [ ] 2.3 **While writing, satisfy the AC-P0 table** — the three literal phrases go in as you author, not as a later patch
  - [ ] 2.4 If Failure Mode 1 (invalid v6.3 output) hits, escalate via `bmad-correct-course`; do not merge a partial conversion
  - [ ] 2.5 Natural commit point

- [ ] **Task 3 — Apply fixup checklist** (Activity 3) (AC1, AC4, AC15)
  - [ ] 3.1 Category 1 (Persona): all **7** v5 principles preserved — check off individually in the DAR. Communication style keeps "I noticed that…" and "What if we asked them WHY they do that?". **CF #12:** read the 7 `IS-FP*` baseline responses before writing `**CRITICAL Handling**`
  - [ ] 3.2 Category 2 (OC-R3): `## On Activation` step 1 delegates to `bmad-init`; no per-agent fail-loud override (Story 2.1 Option A)
  - [ ] 3.3 Category 3 (Menu codes): verify the 8-code set is present in the `## Capabilities` table
  - [ ] 3.4 Category 4 (FR12): `git diff main -- _bmad/bme/_vortex/workflows/` → 0 lines
  - [ ] 3.5 Natural commit point

- [ ] **Task 4 — Author 4 capability prompts** (Activity 4) (AC3)
  - [ ] 4.1 `references/empathy-map.md` — 4 sections; CF #1 hook → Mila downstream
  - [ ] 4.2 `references/user-interview.md` — 4 sections; CF #1 hook → Emma upstream
  - [ ] 4.3 `references/user-discovery.md` — 4 sections; CF #1 hook → Mila downstream
  - [ ] 4.4 `references/validate-empathy.md` — 4 sections; `## Output Expectations` describes an inline verdict against the 4 validation checks, **not** a file artifact (per AC3 note)
  - [ ] 4.5 `## Capabilities` routes use the ``Load `./references/{cap}.md` `` convention for EM/UI/UD/VE (FR11)
  - [ ] 4.6 Natural commit point

- [ ] **Task 5 — Update `module.yaml` + `module-help.csv`** (Activity 5) (AC6, AC7)
  - [ ] 5.1 Append Isla's `agents:` entry — real description, no `TBD`
  - [ ] 5.2 Append Isla's CSV row — phase `empathize`, outputs derived from the 3 workflow `## Output` sections (no validate artifact)
  - [ ] 5.3 Natural commit point

- [ ] **Task 6 — Wrapper inheritance verification** (Activity 6) (AC8)
  - [ ] 6.1 Confirm wrapper line 11 reads `3. FOLLOW the activation steps precisely` — no edit expected
  - [ ] 6.2 No commit (wrapper is an auto-regen artifact)

- [ ] **Task 7 — Author parity tests for Isla** (Activity 7) (AC9)
  - [ ] 7.1 Add `ISLA_FIXTURE_PATH` + the 4th describe block, 9 cases mirroring Mila's
  - [ ] 7.2 Capability count read via `fs.readdirSync` (`derive-counts-from-source`)
  - [ ] 7.3 Describe-block comment states the synthetic-shape claim honestly per AC9
  - [ ] 7.4 `node --test tests/integration/vortex-parity.test.js` → expect **36/36** (9 × 4); zero regressions in Emma/Wade/Mila blocks
  - [ ] 7.5 Natural commit point

- [ ] **Task 7b — P0 port + regression close-out** (AC-P0) — **new in this story; `p0-isla.test.js` is a certain edit**
  - [ ] 7b.1 **Class B port** — in `tests/p0/p0-isla.test.js`, replace the three inline v5 regexes with the format-aware helpers, copying the shape and test titles from [`p0-mila.test.js:74-104`](../../tests/p0/p0-mila.test.js#L74):
    - [ ] 7b.1a `:68` → `extractExecPaths(rawContent, def.format)` + `resolveExecPath`; **threshold `>= 5` → `>= 4`** (see AC-P0 Class B for why)
    - [ ] 7b.1b `:88` → `hasConfigErrorHandling(def, rawContent)`; retitle to `'…(or v6.3 step-1 bmad-init delegation)'`
    - [ ] 7b.1c `:104` → `countRules(def, rawContent)`; retitle to `'principles/rules section has at least 5 entries'`
    - [ ] 7b.1d Add the three helper names to the existing `require('./helpers')` destructure at the top of the file
  - [ ] 7b.2 **Class A check** — confirm the converted SKILL.md carries `Qualitative Research Expert` and `Empathize` in `## Identity`, and `I noticed that` in `## Communication Style`. Fix the **SKILL.md**, not the assertion. Only convert a Class A assertion to `fileMentions` if the literal genuinely cannot sit naturally in its section — and if you do, record which one and why, because that weakens the assertion
  - [ ] 7b.3 `npm run test:p0` → compare against the Task 1.5 tally. Expect **642 pass / 0 fail**
  - [ ] 7b.4 Re-run `p0-voice-consistency.test.js` and `p0-activation.test.js` explicitly — both iterate all 7 agents and both read `def.persona.*`
  - [ ] 7b.5 Do **not** edit `tests/p0/helpers.js` — the port consumes existing exports
  - [ ] 7b.6 Natural commit point

- [ ] **Task 8 — Capture post-migration samples + operator scoring** (Activity 8) (AC11) — **HALT: operator handoff expected**
  - [ ] 8.1 Operator handoff: fresh session, `/bmad-agent-bme-discovery-empathy-expert`, run the 7 `IS-FP*` prompts + the unscripted scenario
  - [ ] 8.2 Pre-create `post-migration-fixed-prompt.json` (7 prompts `IS-FP1`..`IS-FP7`) and `post-migration-unscripted-scenario.md` in the fixtures dir; **CF #11:** fill `capture_date` now, flag `capture_session_id` for capture time
  - [ ] 8.3 Operator scores 7 dimensions; explicit checks: CF #1 (D5/D7), CF #3 (D2), CF #7 (D6), CF #12 (D2)
  - [ ] 8.4 If any dim = 1: 3-iteration fixup-rescore loop, then `bmad-correct-course`
  - [ ] 8.5 Record at `_bmad-output/planning-artifacts/convoke-report-personality-rubric-scoring-isla-conversion-<YYYY-MM-DD>.md`, frontmatter `status: pending-operator-confirmation` + `status_transition` field (CF #8)
  - [ ] 8.6 **CF #10 wording:** state n-counts as *scored* observations and name the agents. If Mila is still unscored, Isla is the 3rd scored observation — write that, not "4th"
  - [ ] 8.7 Natural commit point

- [ ] **Task 9 — Refresh audit report citations atomically** (Activity 9) (AC12)
  - [ ] 9.1 `grep -rE 'discovery-empathy-expert/SKILL\.md#' _bmad-output/planning-artifacts/` — refresh anchors found, or record N/A
  - [ ] 9.2 Respect the AC12 scope guard (no backups / archives / docs sweep)

- [ ] **Task 10 — Validation suite** (Activity 10) (AC13, AC14)
  - [ ] 10.1 `node scripts/audit/reference-integrity.js` → exit 0, 0 broken (baseline 79 refs)
  - [ ] 10.2 `npm run lint` → exit 0, zero warnings
  - [ ] 10.3 Full regression: `npm test`, `npm run test:integration`, `npm run test:p0` — record each tally; zero new failures

- [ ] **Task 11 — Operator Covenant self-check + Failure Handling documentation** (Activity 11) (AC16, AC17)
  - [ ] 11.1 OC-R0 enumeration (3-layer surface)
  - [ ] 11.2 OC-R1..R7 self-check; R3 + R5 documented as inheritance (CF #5, #6)
  - [ ] 11.3 Write the self-check report
  - [ ] 11.4 Record which Failure Handling modes were / were not encountered
  - [ ] 11.5 Capture calibration data in Completion Notes

- [ ] **Task 12 — Per-agent PR checklist + final DoD gate** (AC18)
  - [ ] 12.1 13/13 ACs demonstrably satisfied
  - [ ] 12.2 12/12 CF bindings explicitly addressed in the DAR
  - [ ] 12.3 Update `sprint-status.yaml`: `i97-2-4-convert-isla-discovery-empathy-expert: ready-for-dev → in-progress → review → done`. **Close the row in the same session you ship the code** (project-context `commit-preparation`; the repo has a documented history of `fix(X)` commits leaving row X open)

---

## Dev Notes

### Read in this order before implementing

1. **Story 2.3 spec (full)** — [`i97-2-3-convert-mila-research-convergence-specialist.md`](i97-2-3-convert-mila-research-convergence-specialist.md) — the most recent application; its Tasks 1–11 are the proven cycle. **It has no Review Findings section — Story 2.3 has not been reviewed.** Do not look for carry-forwards that do not exist.
2. **Story 2.2 spec** — [`i97-2-2-convert-wade-lean-experiments-specialist.md`](i97-2-2-convert-wade-lean-experiments-specialist.md) — its **Review Findings (Round 1)** section is where CFs #7–#12 come from. Read it.
3. **Story 2.1 spec** — [`i97-2-1-convert-emma-contextualization-expert-proof-of-concept.md`](i97-2-1-convert-emma-contextualization-expert-proof-of-concept.md) — POC pattern, original CFs #1–#6.
4. **Mila's converted SKILL.md** — [`research-convergence-specialist/SKILL.md`](../../_bmad/bme/_vortex/agents/research-convergence-specialist/SKILL.md) — closest structural template.
5. **Emma's converted SKILL.md** — [`contextualization-expert/SKILL.md`](../../_bmad/bme/_vortex/agents/contextualization-expert/SKILL.md) — closest *phrase-preservation* template; shows how a P0-asserted literal survives conversion.
6. **A capability-prompt exemplar** — [`research-convergence.md`](../../_bmad/bme/_vortex/agents/research-convergence-specialist/references/research-convergence.md) — 4 sections, ~21 lines, cross-agent hooks in prose.
7. **Personality rubric** — [`convoke-spec-personality-preservation-rubric.md`](../planning-artifacts/convoke-spec-personality-preservation-rubric.md) — Isla's fingerprint at § "Per-Agent Personality Fingerprints"; D4 examples cite Isla directly.
8. **Fixup checklist** — [`fixup-checklist.md`](../../scripts/migration/format-conversion/fixup-checklist.md) — the 4 categories.
9. **Mila's Covenant self-check** — [`convoke-report-operator-covenant-self-check-mila-conversion-2026-05-03.md`](../planning-artifacts/convoke-report-operator-covenant-self-check-mila-conversion-2026-05-03.md) — most recent; inheritance wording to copy.
10. **`deferred-work.md`** — two accepted defers already cover shapes this story will reproduce (see below). Do not re-file them; do not "fix" them here either.

### The p0-isla constraint (read this twice)

This is the one place where Story 2.4 is genuinely harder than 2.1–2.3, and it is invisible from the epic.

`tests/p0/helpers.js::loadAgentDefinition` dispatches on format: `/<agent\s+/` present → `parseV5Definition`, absent → `parseV63Definition`. Both return a `persona` object, so a v5-shaped assertion **still compiles and runs** against a v6.3 file — it just reads a different string. That makes Class A failures confusing rather than obvious: `:32` fails with a message about "persona role" while the real cause is that `## Identity` paraphrased the role instead of naming it.

Class B is the opposite problem and the more expensive one. `:68`, `:88` and `:104` never went through the format-aware refactor — they carry **inline v5 XML regexes in the test file itself**. Nothing in the SKILL.md can satisfy `/<step n="2">/` once the XML is gone. Measured against Mila's converted file they return 0 paths, `null`, and 0 rules respectively. These are not "might break" — they break deterministically.

**Why no earlier story hit this:** `p0-wade.test.js` and `p0-mila.test.js` were ported to the helpers at story `i97-bug-1`, *before* those agents were converted. `p0-emma.test.js` was partly ported — its identity/stream/phrase trio uses `fileMentions` ([`:45,52,58`](../../tests/p0/p0-emma.test.js#L45)) while its registry cross-validation pair still uses `def.persona.*` ([`:304,315`](../../tests/p0/p0-emma.test.js#L304)) and survived on phrase preservation. `p0-isla.test.js` got neither treatment. So this story does the port that `i97-bug-1` did for the first three, and **`p0-noah` / `p0-max` / `p0-liam` are in the same unported state** — Stories 2.5–2.7 inherit whatever shape lands here.

Practical consequence for planning: `tests/p0/p0-isla.test.js` is a **certain** modified file, and Task 7b is real work, not a contingency branch. Budget it.

### Isla-specific persona notes (verbatim from pre-migration source)

> **Role:** Qualitative Research Expert + Empathy Mapping Specialist
> **Identity:** Helps teams deeply understand their users through structured discovery and empathy work. Expert in qualitative research methods, user interviews, ethnographic observation, and empathy mapping. Guides teams to uncover real user frustrations, aspirations, and experiences before defining problems or building solutions. Specializes in the "Empathize" stream — discovering WHO users truly are and WHAT they truly feel.
> **Communication style:** Warm and probing — asks follow-up questions others wouldn't think of. Speaks in user stories and observations. Says things like "I noticed that..." and "What if we asked them WHY they do that?" Celebrates messy, raw findings over polished assumptions. Makes teams comfortable sitting with ambiguity before rushing to clarity.

**Persona fingerprint for rubric scoring:**
- **Empathy-probing** — asks what the user *felt*, not just what they did
- **Say/do gap** — explicitly separates reported behavior from observed behavior
- **Says/Thinks/Does/Feels** — the empathy-map quadrants are her native frame
- **Anti-imagination** — refuses personas synthesized from team assumptions; sends people to talk to real users
- **Ambiguity tolerance** — celebrates messy findings; resists premature clarity

### Positional note: Isla is upstream

Isla sits at stream 2 (Empathize) — she *feeds* Mila (Synthesize), who feeds Liam (Hypothesize). Mila's converted `research-convergence.md` already routes **to** Isla for upstream discovery when evidence is thin. Isla's capability prompts should complete that loop in the forward direction (to Mila once ≥2 evidence layers exist). This makes CF #1's cross-agent map testable in the opposite direction from every prior observation — a genuinely new datum, not a repeat.

### Accepted pre-existing defers this story will reproduce (do NOT re-file, do NOT fix here)

- **Personality fixture JSON is not strictly `JSON.parse`-able** — multi-line `response` strings carry unescaped newlines/quotes. Convention inherited from Emma's Story 2.1 baseline. Isla's baseline has the same shape. Nothing parses these today. Already in [`deferred-work.md`](deferred-work.md).
- **`test-fixture-isolation` (NFR4) is not honored by the parity describe-blocks** — they read the live `_bmad/…` tree with no `cwd: tmpDir` boundary. Story 2.1 introduced the pattern; AC9 defers hardening to **Story 3.2**, which should hoist live-tree access into one shared boundary fixture consumed by all 7 blocks. Isla's block will have the same shape by design. Already in `deferred-work.md`.

### Scope boundaries — explicitly out

- `tests/p0/helpers.js` (shared, hardened at `i97-bug-1`)
- `scripts/update/lib/refresh-installation.js` (CF #6 — no scope expansion)
- The `refs:audit` wide-sweep 657-broken condition (backlog-tracked, not this story)
- Emma's inaccurate `validation-plan-*.md` entry in `module-help.csv`
- Workflow source files under `_bmad/bme/_vortex/workflows/` (FR12 — must stay byte-identical)
- Any of Noah / Max / Liam (Stories 2.5–2.7)

### Same-LLM-bias mitigation

The dev agent will likely be the same LLM that authored this spec. **Do not self-score personality.** Operator handoff at Task 8.1 is mandatory; CF #8 keeps the scoring report at `status: pending-operator-confirmation` until the operator confirms at PR review.

### References

- [Source: `_bmad-output/planning-artifacts/convoke-epic-bmad-v63-source-format-adoption.md#story-24-convert-isla-discovery-empathy-expert`] — story definition, per-agent specifics
- [Source: `_bmad-output/planning-artifacts/convoke-epic-bmad-v63-source-format-adoption.md#within-pr-sequencing-applies-to-all-e2-stories`] — 11-activity sequence
- [Source: `_bmad-output/planning-artifacts/convoke-epic-bmad-v63-source-format-adoption.md#failure-handling-pattern-applies-to-all-e2-stories`] — Modes 1–5
- [Source: `_bmad-output/planning-artifacts/adr/i97/adr-001-naming-convention-reconciliation.md`] — hybrid naming (`bmad-bme-agent-isla` canonical + `bmad-agent-bme-discovery-empathy-expert` alias)
- [Source: `_bmad-output/planning-artifacts/adr/i97/adr-002-conversion-tooling-architecture.md`] — fixup checklist
- [Source: `_bmad-output/planning-artifacts/adr/i97/adr-004-atomic-by-agent-commit-and-tooling-namespace.md`] — atomic-by-agent commit
- [Source: `_bmad/bme/_vortex/agents/discovery-empathy-expert/SKILL.md`] — pre-migration source, all 8 codes + 4 workflow paths + 7 principles
- [Source: `tests/p0/p0-isla.test.js:32,39,44-47,52`] — the AC-P0 literal-phrase constraints
- [Source: `tests/p0/helpers.js:179-233,276-314`] — `parseV63Definition` field mapping + `MIN_NUMERIC_ACTIVATION_STEPS`
- [Source: `tests/p0/p0-voice-consistency.test.js:19-31,85-125`] — `VOICE_MARKERS` + cross-validation
- [Source: `scripts/update/lib/agent-registry.js:27-35`] — registry persona used by voice cross-validation
- [Source: `tests/integration/vortex-parity.test.js:310-432`] — Mila describe block, the template for Isla's
- [Source: `tests/integration/fixtures/vortex-parity/research-convergence-specialist-baseline.json`] — fixture schema
- [Source: `project-context.md`] — `derive-counts-from-source`, `test-fixture-isolation`, `documentation-claims-must-be-derived`, `verification-must-be-falsifiable`, `commit-preparation`

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List

**Expected new files (5):**
- `_bmad/bme/_vortex/agents/discovery-empathy-expert/references/empathy-map.md`
- `_bmad/bme/_vortex/agents/discovery-empathy-expert/references/user-interview.md`
- `_bmad/bme/_vortex/agents/discovery-empathy-expert/references/user-discovery.md`
- `_bmad/bme/_vortex/agents/discovery-empathy-expert/references/validate-empathy.md`
- `tests/integration/fixtures/vortex-parity/discovery-empathy-expert-baseline.json`

**Expected modified files (5):**
- `_bmad/bme/_vortex/agents/discovery-empathy-expert/SKILL.md` (v5 XML → v6.3+ markdown)
- `_bmad/bme/_vortex/module.yaml` (Isla `agents:` entry appended)
- `_bmad/bme/_vortex/module-help.csv` (Isla row appended, phase `empathize`)
- `tests/integration/vortex-parity.test.js` (Isla describe block + `ISLA_FIXTURE_PATH`)
- `tests/p0/p0-isla.test.js` — **certain**: Class B port of `:68` / `:88` / `:104` to the format-aware helpers (AC-P0, Task 7b.1). Class A assertions should need no edit if the SKILL.md preserves the three literals

**Expected pre-created skeletons (Task 8.2, 2):**
- `tests/migration/personality-preservation/fixtures/discovery-empathy-expert/post-migration-fixed-prompt.json`
- `tests/migration/personality-preservation/fixtures/discovery-empathy-expert/post-migration-unscripted-scenario.md`

**Expected new artifacts (1 + 1 operator-authored):**
- `_bmad-output/planning-artifacts/convoke-report-operator-covenant-self-check-isla-conversion-<YYYY-MM-DD>.md`
- `_bmad-output/planning-artifacts/convoke-report-personality-rubric-scoring-isla-conversion-<YYYY-MM-DD>.md` (Task 8.5, `status: pending-operator-confirmation`)

## Change Log

| Date | Change | By |
|------|--------|-----|
| 2026-08-28 | Story spec authored via `bmad-create-story`. Status: ready-for-dev. Follows the Story 2.3 lean pattern with Isla-specific deltas, all re-derived from source on 2026-08-28 rather than copied from the epic (~4-month gap since Story 2.3). **Two findings the epic does not carry:** (a) `tests/p0/p0-isla.test.js` still uses v5-shaped `def.persona.*` assertions and will break on conversion unless three literal phrases are preserved — new **AC-P0** and **Task 7b** added, with the P0 baseline pinned at 642 pass / 0 fail; (b) Story 2.3 is `in-progress` with no Round 1 review, so the CF set stays at 12 and the 3rd-observation questions (CF #1/#3/#7) are still open — n-counts must be reported as *scored* observations. Also corrected: the epic's "4 capabilities / EM,UI,UD,VE" is the routed subset; parity is asserted over all **8** codes. Estimate: ~1–1.5 hr dev + ~30 min operator capture, plus a one-off increment for Task 7b. | Amelia (dev) |
| 2026-08-28 | **Round 1 self-review — 2 blocking findings, both measured, both patched.** **(a) AC-P0 was incomplete and its remedy was wrong.** The original AC named 4 at-risk assertions in `p0-isla.test.js` and proposed phrase preservation as the fix. There are **7**, in two classes. Class A (`:32`/`:39`/`:44-47`/`:52`) is phrase-fixable — verified by replicating `parseV63Definition`'s mapping through the exported `extractMarkdownSection`: a paraphrase fails three, a preserving body passes all four. **Class B (`:68`/`:88`/`:104`) is not fixable at any content** — those carry inline v5 XML regexes in the test file, and run verbatim against Mila's converted SKILL.md they return 0 paths / null / 0 rules. So `tests/p0/p0-isla.test.js` moves from a conditional edit to a **certain** one, and Task 7b from a contingency to real work. Added the port instructions (copy `p0-mila.test.js:74-104`), the **`>= 5` → `>= 4`** exec-path threshold change (v6.3 `extractExecPaths` matches only ``Load `./references/…` ``, and `PM` routes to a skill name, not a path), and three exact-string contracts the SKILL.md must meet for the ported assertions to pass (backticked `Load` route, `## Principles` as ≥5 bullet lines, bold-prefixed `**Load config via bmad-init`). **(b) "first agent whose P0 suite is still v5-shaped" was false** — `p0-emma.test.js:304,315` still assert `def.persona.*` and pass against Emma's *converted* file, which makes Emma a live precedent for the Class A remedy rather than a counterexample. Reframed to the accurate claim: first agent whose suite binds *structural* assertions to v5 XML. Also verified at source (previously taken on Story 2.3's word): Wade's `mvp/validate.md` really is a `Coming in v1.2.0` placeholder (`:3`, `:22`). Confirmed unaffected: `p0-isla`'s second describe block reads only workflow files. Noted that `p0-noah`/`p0-max`/`p0-liam` are in the same unported state, so 2.5–2.7 inherit this shape. | Amelia (dev) |
