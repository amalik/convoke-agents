# A26 Pre-Execution Sample-Cell Scoring (3 R7 cells)

**Status:** DRAFT 2026-04-26 — sample-cell verdicts for 3-layer pre-execution adversarial review (PAD 2 Option A per [A26 spec](./oc-vortex-hc-schema-pattern-audit-a26.md)). **Post-3-layer-review patches applied 2026-04-26: 7 patches across §A41-2 scope tightening, Cell B arithmetic correction, mechanism-identity narrowing, §9 ambiguity intake, AC3/AC7/AC9 forward-references. Verdicts unchanged (3/3 FAIL R7 survive both readings); pattern claim narrowed to acknowledge ≥2 distinct sub-mechanisms.**

**Purpose:** Score 3 R7 cells covering boundary cases (§A41-14 dogfood opportunities + step-name heterogeneity) BEFORE Task 5 full 63-cell scoring, so Blind Hunter / Edge Case Hunter / Acceptance Auditor can attack methodology + verdicts on a small surface.

**Scope:** OC-R7 (Right to pacing) only. R1-R6 deferred to Task 5 main scoring. Cells chosen for category + naming heterogeneity:

| # | Workflow | Step file | §A41-14 category | Step name pattern |
|---|----------|-----------|------------------|-------------------|
| A | behavior-analysis | `steps/step-01-setup.md` | workflow-only (baseline) | canonical `step-01-setup` |
| B | lean-experiment | `steps/step-01-hypothesis.md` | agent-only template + incomplete-placeholder validate.md | non-canonical `step-01-hypothesis` |
| C | proof-of-value | `steps/step-01-value-hypothesis.md` | agent-only template + incomplete-placeholder validate.md | non-canonical `step-01-value-hypothesis` |

**AC7 §A41-14 full-cluster classification (pre-staged for Task 5 §2.4):** Task 5 final report §2.4 Layer 1 Classification sub-section will populate the full 9-workflow table per A26 spec Task 0 verified inventory ([A26 spec L114-115](./oc-vortex-hc-schema-pattern-audit-a26.md)) — 7 workflow-only (behavior-analysis, experiment-design, pattern-mapping, pivot-resynthesis, production-monitoring, research-convergence, signal-interpretation) + 2 with agent-only-template + incomplete-placeholder validate.md (lean-experiment, proof-of-value) + 0 standalone-workflows (cell count locked at 63 per V-pass C4). This dossier pre-stages 3 of 9; remaining 6 classified during Task 5 cell scoring.

## Methodology applied

- **Rubric:** OC-R7 Right to pacing — ≤3 novel concepts per interaction round (per [Covenant §6.7](../planning-artifacts/convoke-covenant-operator.md), [Compliance Checklist §2.6 Novel-Concept Glossary](../planning-artifacts/convoke-spec-covenant-compliance-checklist.md)).
- **§A41-2 hybrid counting (scope-tightened post-pre-exec):** multi-field contract enumerations (HC1/HC2/HC3 schema fields, GC contract sub-fields per stated examples) count as **1 compound concept if ≤3 visible sub-fields**, **N concepts if ≥4 visible sub-fields**. **Pre-exec review patch (Edge Case Hunter C1+C2 + Blind Hunter H2 convergent):** §A41-2 is restricted to its stated domain. Markdown tables (e.g., Cell A's Behavior observation table), category checklists (e.g., Cell C's Riskiest Value Assumption 5-checkbox), sentence-template placeholders (e.g., Cell C's "We believe that..." template), and cross-workflow named references (e.g., Cell A's "Wade's lean-experiment / proof-of-concept / proof-of-value / mvp") are **NOT counted via §A41-2** — they fall under §2.6 general novel-concept counting (each visibly-enumerated structure as 1 compound concept charitably, or N concepts strictly under §2.6's "novel concept" rubric). §A41-2 scope-clarification logged as §9 ambiguity #1 for forward-only methodology amendment.
- **§A41-3 vacuous-PASS:** none of the 3 cells are vacuous — all 3 step-01 surfaces have an operator-decision branch where R7 can fire (operator is asked to provide HC artifact + complete validation/canvas/checklist).
- **§A41-5 reading-dependent:** verdicts below commit to the strict reading for the headline; charitable readings noted as alternative + logged in §9 Rubric Ambiguities Surfaced.
- **Evidence-note format:** ≤2 sentences, `file:line` citations, names-not-numbers (per A26 AC2 + A24 §4.1 precedent).
- **Concept budget exclusions:** Covenant glossary terms (operator, default, override, scope, etc. per [Covenant §3](../planning-artifacts/convoke-covenant-operator.md)) excluded; HC-schema names + Convoke-internal validation enumerations counted as novel.

## Pre-staged AC3 disclaimer (for Task 5 final report Executive Summary §1)

Per A26 spec AC3 (C2 R1 patch), Task 5 final report's Executive Summary §1 must contain this verbatim wording:

> This audit is **pattern-verification scope** (per A29 §Selection Discipline) — homogeneous picks (all 9 HC-consumer Vortex workflows at step-01) selected to verify class-wide R7 risk per A24 §6.2 unsourced speculation. Findings apply to the HC-consumer cluster only, NOT to all Vortex workflows. Independent verification requiring non-HC-consumer picks is deferred to future audit (cluster-boundary documentation expected if pattern refuted).

Per A26 spec AC3 M1 R1: HC-schema-at-step-01 is an **anti-pattern** when it causes R7 FAIL; A26 verifies whether the **structural pattern** of HC-receipt-at-step-01 systematically produces this anti-pattern across the cluster. AC3 M3 R1: terminology consistency = "HC-cluster × Right row" throughout, NOT "Vortex × Right row".

## Sample Cell A — behavior-analysis step-01-setup × Right to pacing — FAIL

**Evidence note (≤2 sentences):**
`_bmad/bme/_vortex/workflows/behavior-analysis/steps/step-01-setup.md:35-52` §3 Input Validation enumerates HC4 frontmatter (7 visible sub-fields → 7 concepts per §A41-2 hybrid) plus HC4 body sections (8 visible sub-sections → 8 concepts per §A41-2), plus :60-65 Behavior observation table (1 compound per §2.6 — outside §A41-2 stated scope) and :21-22 cross-workflow Wade references (1 compound per §2.6) and :9-23 step-prose ("experiment context", "baseline", "behavioral pattern", "Vortex pattern" = 4 concepts). Total novel concept count = **20 strict / 7 charitable** (HC4 grouped as 1 compound + table 1 + workflow refs 1 + 4 step-prose) — both readings exceed 3-concept budget.

**Concept enumeration (post-§A41-2 scope tightening):**
- HC4 frontmatter sub-fields per §A41-2 hybrid (7 ≥ 4 → 7 concepts): `contract: HC4`, `type: artifact`, `source_agent`, `source_workflow`, `target_agents: [noah]`, `input_artifacts`, `created`
- HC4 body sub-sections per §A41-2 hybrid (8 ≥ 4 → 8 concepts): Experiment Summary, Hypothesis Tested, Experiment Method, Pre-Defined Success Criteria, Additional Results, Confirmed/Rejected Hypotheses, Strategic Context, Production Readiness
- Behavior observation table (`:60-65`, 4 visible rows) per §2.6 (NOT §A41-2 — markdown table outside contract-schema scope): 1 compound concept (charitable) / 4 separate concepts (strict)
- Cross-workflow named references (`:21-22`, "Wade's lean-experiment / proof-of-concept / proof-of-value / mvp") per §2.6 (NOT §A41-2 — prose list of workflow names): 1 compound concept (Vortex graph reference) / 4 separate concepts (strict)
- Step-prose concepts (3): experiment context (`:9, :17`), baseline (`:9-13`), behavioral pattern (`:9, :13`)
- Vortex pattern (`:23`): 1

**Verdict:** **FAIL** — strict 20+ / charitable 7; both ≥3.

## Sample Cell B — lean-experiment step-01-hypothesis × Right to pacing — FAIL

**Evidence note (≤2 sentences):**
`_bmad/bme/_vortex/workflows/lean-experiment/steps/step-01-hypothesis.md:34-44` references HC3 Hypothesis Contract by name + Assumption Risk Map at :21-22 then introduces Hypothesis Statement Check (4 visible criteria per §2.6 — independent operator-readiness checklist, NOT HC3 sub-fields, so outside §A41-2 stated scope; counted as 4 strict / 1 compound charitable) and Falsifiability Check (3 visible criteria per §2.6 — 3 strict / 1 compound charitable), atop step-prose "hypothesis"/"falsifiable bet"/"riskiest assumption" at :9-11. Total **12 strict / 8 charitable** (Cell B arithmetic corrected from "9" per Blind Hunter C1 finding) — both exceed 3-concept budget.

**Concept enumeration (post-§A41-2 scope tightening + Cell B arithmetic correction):**
- Step-prose concepts (3): hypothesis (`:9, :11`), falsifiable bet (`:9`), riskiest assumption (`:11, :22`)
- HC3 contract reference (named, not enumerated → 1 compound): HC3 Hypothesis Contract (`:21`)
- HC3 Assumption Risk Map separate-named compound (`:22`): 1
- Hypothesis Statement Check sub-items per §2.6 (NOT §A41-2 — independent validation criteria, not HC3 sub-fields): 4 visible — expected outcome, specific behavior change, rationale grounded in evidence, riskiest assumption (already step-prose-counted; **net 3 unique strict** / 1 compound charitable)
- Falsifiability Check sub-items per §2.6 (NOT §A41-2): 3 visible (3 strict / 1 compound charitable)
- Vortex pattern (`:23`): 1

**Strict total:** 3 + 1 + 1 + 3 + 3 + 1 = **12**
**Charitable total:** 3 + 1 + 1 + 1 + 1 + 1 = **8**

**Verdict:** **FAIL** — strict 12 / charitable 8; both ≥3.

## Sample Cell C — proof-of-value step-01-value-hypothesis × Right to pacing — FAIL

**Evidence note (≤2 sentences):**
`_bmad/bme/_vortex/workflows/proof-of-value/steps/step-01-value-hypothesis.md:37-45` Value Hypothesis Canvas (7 visible Convoke-internal worksheet fields per §2.6 — NOT an HC contract, so outside §A41-2 stated scope; counted as 7 strict / 1 compound charitable) plus :51 Value Hypothesis Statement template (5 inline `[bracketed]` placeholders in one sentence per §2.6 — 1 compound for sentence-template construct charitably / 5 separate strict; per §A41-5 reading-dependent, logged §9 #4) plus :57-61 Riskiest Value Assumption (5 visible categories per §2.6 — 5 strict / 1 compound charitable), atop HC4 + HC3 references at :21-22 and 3 step-prose concepts at :9-25. Total **19 strict / 9 charitable** — both exceed 3-concept budget by wide margin.

**Concept enumeration (post-§A41-2 scope tightening):**
- Step-prose concepts (3): value hypothesis (`:9, :13`), technical feasibility (`:19-21`), business value (`:9-13`)
- HC4 + HC3 contract references (2 named at `:21-22`): HC4 Experiment Context, HC3 Hypothesis Contract
- Value Hypothesis Canvas sub-fields per §2.6 (NOT §A41-2 — Convoke-internal worksheet, not contract schema): 7 visible — Target Customer Segment, Problem Being Solved, Proposed Value, Value Magnitude, Current Alternatives, Switching Cost, Willingness-to-Pay Signal (7 strict / 1 compound charitable)
- Value Hypothesis Statement template (`:51`, 5 inline placeholders in one sentence) per §2.6 — sentence-template construct: 1 compound charitable / 5 separate strict; per §A41-5 reading-dependent, headline commits to charitable (1 compound) and logs §9 #4
- Riskiest Value Assumption sub-categories per §2.6 (NOT §A41-2 — Convoke-internal category enumeration): 5 visible — Demand, Willingness-to-pay, Switching cost, Value magnitude, Competitive (5 strict / 1 compound charitable)
- Vortex pattern (`:21-25`): 1

**Strict total:** 3 + 2 + 7 + 5 + 5 + 1 = **23** (with template strict reading +5: 28; charitable template = 1)
**Charitable total:** 3 + 2 + 1 + 1 + 1 + 1 = **9**

**Verdict:** **FAIL** — strict 19+ / charitable 9; both ≥3.

## Pattern observation (sample N=3) — mechanism-identity narrowed post-pre-exec

All 3 sample HC-consumer step-01 surfaces fail R7. **Mechanism analysis (revised post-Edge Case Hunter H2):**

- **Cells A & C share HC-schema-enumeration + Convoke-internal-form-enumeration mechanism.** Cell A enumerates HC4 sub-fields directly in step-01 §3 (7 frontmatter + 8 body) + Convoke-internal Behavior observation table. Cell C references HC4+HC3 by name + enumerates Convoke-internal Value Hypothesis Canvas (7 fields) + Riskiest Value Assumption (5 categories). Same shape as A24's `assumption-mapping` (HC3 + 4-field hypothesis contract + Assumption Risk Map + Recommended Testing Order + Flagged Concerns) and `hypothesis-engineering` (HC2 + Converged Problem Statement + JTBD compound + Pains + Gains + Evidence Summary + Assumptions-with-risk).
- **Cell B has structurally distinct mechanism.** HC3 contract is *referenced by name only* (not enumerated). R7 budget is exceeded via *independent operator-readiness validation criteria* (Hypothesis Statement Check + Falsifiability Check) that are NOT HC3 sub-fields but Convoke-internal cognitive-load gates verifying input quality. The mechanism is "validate operator-supplied artifact against multi-criterion readiness checklist", not "enumerate received-artifact's sub-fields".
- **Pattern claim — narrowed.** Within-sample 3/3 R7 FAIL is robust under both readings. **Mechanism-identity is partial, not universal.** Pattern observation: HC-cluster step-01 surfaces exceed R7 budget via at least 2 distinct mechanisms — (i) HC-schema enumeration + Convoke-internal-form enumeration (Cells A/C, A24 precedent), (ii) HC-reference + independent operator-readiness checklists (Cell B). This affects Task 5 §6 retrofit recommendation: a single shared `step-01-receive-contract` template would close mechanism (i) but not mechanism (ii); per-workflow patches still needed for (ii)-shape failures. Refinement of A24 §6.2 speculation: "Vortex-wide HC-schema-at-step-01 anti-pattern via single mechanism" → "HC-cluster step-01 surfaces fail R7 via ≥2 distinct sub-mechanisms; shared retrofit feasible for one sub-mechanism only."

**Caveats (selection bias acknowledged per A29):**
- Sample is 3 of 9 candidates; Task 5 generalization to the full HC-cluster is the load-bearing test of the (narrowed) pattern.
- Sample cells were chosen for §A41-14 boundary-case coverage, NOT randomly — selection bias toward cells likely to fail (HC-consumers were the *defining trait* of the cluster; selecting HC-consumers cannot falsify the hypothesis "HC-consumers fail R7"). Acceptance Auditor + Edge Case Hunter explicitly tasked with falsifying mitigates auditor (Claude) confirmation bias; mechanism-identity narrowing in this revision is a *partial falsification* — pattern claim is now narrower than A24 §6.2's original speculation.
- §A41-2 scope-stretching observed in pre-exec review and patched in this revision; verdicts survive conservative re-counts.

**AC9 framing safeguard (anti-extrapolation):** Sample 3/3 R7 FAIL rate is NOT to be reported as cluster fail rate in Task 5 §5 row table. Per A26 spec AC9 M4 R1, the side-by-side comparison table reports A24 v3 Vortex (N_total=4) and A26 v5 HC-cluster (N_effective from full 9-workflow audit) **separately**, NOT summed, NOT extrapolated, **version-pinned per §A41-13**. If Task 5 produces N_effective < 9 (vacuous-PASS subtractions per §A41-3), the AC4 R7-specific scope-expansion to step-02 fires until ≥1 R7-relevant operator-decision branch surfaces.

## §9 Rubric Ambiguities Surfaced (per Compliance Checklist §A41-5 v4+ requirement)

This section is mandatory in v4+/v5+ Covenant audit reports. Pre-exec review surfaced 5 ambiguities; logged here for forward-only methodology amendment per §A41-13 version-pinning.

**§9.1 — §A41-2 stated-scope vs broader-application ambiguity** *(pre-exec convergent finding: BH H2 + EC C1+C2)*. §A41-2's stated examples are HC1/HC2/HC3 schema fields + GC contract fields. Pre-exec reviewers flagged dossier's original application of §A41-2 to (a) markdown tables (Cell A Behavior observation table), (b) category checklists (Cell C Riskiest Value Assumption), (c) sentence templates (Cell C Value Hypothesis Statement), (d) cross-workflow named references (Cell A Wade's workflows) as scope-overreach. **Resolution applied this revision:** §A41-2 restricted to stated domain; non-contract enumerations counted via §2.6 (1 compound charitable / N strict). **Forward propagation:** Task 5 cell scoring applies the tightened scope; Compliance Checklist §A41-2 amendment proposed for next methodology-revision spec to make this restriction explicit (currently implicit by example-list).

**§9.2 — Cross-workflow named-reference counting** *(pre-exec finding: BH H2 + EC C1)*. When step-01 lists multiple named upstream workflows (Cell A `:21-22`: "Wade's lean-experiment / proof-of-concept / proof-of-value / mvp"), per-§2.6 counting unclear: 0 (already-known-Vortex-graph), 1 (compound named-references), or N (each name a distinct novel concept for an operator unfamiliar with Vortex). **Resolution applied this revision:** 1 compound charitable / 4 separate strict; verdict-insensitive (Cell A FAILs at either count). **Forward propagation:** §2.6 amendment proposed to formalize "named cross-workflow references count as 1 compound when stated as a graph-position reference, N concepts when each workflow is described in detail".

**§9.3 — "Vortex pattern" as meta-frame vs novel concept** *(pre-exec finding: BH L6 + EC M4)*. All 3 cells include "Vortex pattern" mention (Cell A `:23`, Cell B `:23`, Cell C `:21-25`). Counted: 1 per cell. Open question: does "Vortex pattern" introduced *for* the operator (audit-context framing) count once globally for the audit, once per cell, or never (audit-context metadata, not workflow-introduced concept)? **Resolution applied this revision:** count once per cell as light meta-frame; verdict-insensitive (cells exceed budget either way). **Forward propagation:** §2.6 amendment proposed to formalize meta-frame vs workflow-novel distinction.

**§9.4 — Sentence-template inline placeholder counting** *(pre-exec finding: EC H1)*. Cell C `:51` Value Hypothesis Statement template has 5 inline `[bracketed]` placeholders in one sentence ("We believe that [target] will [behavior] for [value] because [rationale] instead of [alternative]"). Are 5 placeholders in one sentence template structurally equivalent to 5 sub-fields in a schema (5 concepts per §A41-2 ≥4 strict reading), or is the sentence template 1 cognitive-load construct (1 compound charitable)? **Resolution applied this revision:** §A41-5 reading-dependent — headline commits to charitable (1 compound), logs strict (5 separate) as alternative. **Forward propagation:** §A41-2 (or §2.6) amendment proposed to formalize sentence-template-vs-schema distinction; default likely "single sentence template = 1 compound regardless of placeholder count".

**§9.5 — Step-prose framing concepts and Vortex shared vocabulary** *(pre-exec finding: EC patch #4)*. Step-prose concepts counted novel ("experiment context", "baseline", "behavioral pattern", "value hypothesis", "technical feasibility", "business value", "hypothesis", "falsifiable bet", "riskiest assumption") may already be Vortex-shared vocabulary documented elsewhere in `_bmad/bme/_vortex/`. EC's partial-walk found workflow.md inheritance test PASSes (no systematic re-introduction in step-01 from workflow.md). Full Vortex-vocabulary glossary check (grep against `_bmad/bme/_vortex/contracts/`, `_bmad/bme/_vortex/agents/`, Covenant glossary, etc.) was deferred. **Resolution applied this revision:** counted as novel for sample-cell verdicts; verdict-insensitive (cells exceed budget by margin large enough that 1-2 step-prose concepts being pre-existing wouldn't flip verdicts). **Forward propagation:** Task 5 spot-check — for each step-prose concept counted novel, grep `_bmad/bme/_vortex/` to verify the term isn't pervasively-introduced upstream of step-01; document any pre-existing concepts in Task 5 §Notes per AC6.

## Patches applied (post-3-layer-review summary)

| # | Severity | Source | Description |
|---|----------|--------|-------------|
| 1 | CRITICAL | BH H2 + EC C1+C2 convergent | §A41-2 scope tightened to stated domain (HC/GC contract schemas); markdown tables/checklists/sentence-templates/cross-workflow-refs counted via §2.6 instead. Cells A & C re-counted: A 22→20 strict / 7-8→7 charitable; C 17+→19 strict / 8+→9 charitable. Verdicts unchanged (FAIL on all 3). |
| 2 | CRITICAL | BH C1 | Cell B arithmetic corrected: "strict 9" → strict 12 (after de-dup of "riskiest assumption" between step-prose and Hypothesis Statement Check). Charitable 6 → 8. Verdict unchanged (FAIL). |
| 3 | CRITICAL | EC H2 | Mechanism-identity claim narrowed: "all 3 fail by SAME mechanism" → "Cells A & C share HC-schema/Convoke-form enumeration mechanism; Cell B has structurally distinct mechanism (HC-reference + independent operator-readiness checklists). Pattern is partial, not universal." Affects Task 5 §6 retrofit recommendation. |
| 4 | CRITICAL | BH H3 + AA MED #5 convergent | §9 Rubric Ambiguities Surfaced section added per Compliance Checklist §A41-5 v4+ structural requirement. 5 ambiguities logged with resolutions + forward-propagation paths. |
| 5 | CRITICAL | AA CRITICAL #1 | AC3 verbatim disclaimer pre-staged for Task 5 final report Executive Summary §1. M1 R1 anti-pattern terminology + M3 R1 "HC-cluster × Right row" terminology forward-pinned. |
| 6 | HIGH | AA HIGH #3 | AC7 9-workflow §A41-14 classification pre-staged via forward-reference to A26 spec Task 0 inventory; remaining 6 workflows classified during Task 5. |
| 7 | HIGH | AA MED #4 | AC9 framing safeguard added under §"Pattern observation"; explicit non-extrapolation rule + version-pinning + AC4 R7-specific scope-expansion fallback. |

**Convergence:** Pre-exec 3-layer review converged. All 3 layers (Blind Hunter / Edge Case Hunter / Acceptance Auditor) returned APPROVE-WITH-PATCHES with overlapping findings; no contradictory recommendations. R2 pre-exec review NOT triggered per code-review-convergence rule (no new HIGH-severity contradictions introduced by patches). Verdicts (3/3 FAIL R7) stand under both strict and charitable readings post-patch. Mechanism-identity claim narrowed per partial falsification (Cell B distinct from Cells A/C).

## Next step (paused for operator review)

This dossier is patched and ready. Two paths from here:

1. **Proceed to Task 5 (full 63-cell scoring)** under tightened §A41-2 scope + narrowed mechanism claim. Task 5 covers 9 workflows × 7 rights = 63 cells; can be parallelized across 3-4 Explore Agents (~6 hours human-equivalent → ~30-45 min wall-clock). Outputs feed Task 5 final report assembly (§1 Executive Summary with AC3 disclaimer; §2.4 §A41-14 Layer 1 table; §5 row table with side-by-side A24/A26 framing; §6 pattern-verification synthesis with narrowed mechanism claim; §7.1 A10 reproducibility pass; §8 COI; §9 Rubric Ambiguities — items 1-5 above carry forward).

2. **Hold for operator review** of the patched §A41-2 scope-tightening (load-bearing for the 63-cell scoring). The methodology change here propagates to every cell; operator inspection before fan-out is the conservative path.

Operator chose Option 2 — paused here for review.
