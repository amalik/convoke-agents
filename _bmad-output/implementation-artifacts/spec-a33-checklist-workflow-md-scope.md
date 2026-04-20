---
title: 'A33 — Checklist §2.6 Workflow.md-vs-Step-01 Scope Amendment'
type: 'feature'
created: '2026-04-20'
status: 'done'
baseline_commit: '85de1781'
context:
  - _bmad-output/planning-artifacts/convoke-spec-covenant-compliance-checklist.md
  - _bmad-output/planning-artifacts/convoke-report-operator-covenant-audit-vortex-2026-04-19.md
  - project-context.md
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Checklist §2.6 "Workflow-inherited concepts" is silent on whether concepts introduced in `workflow.md` count as pre-existing when reaching step-01. The A24 Vortex audit surfaced this as §9 ambiguity #5 — empathy-map step-01's pacing verdict flips between PASS (1 novel concept under broader reading) and FAIL (8 novel concepts under narrower reading) depending on interpretation. Both A24 reviewers independently applied the broader reading, but the rubric stays silent, leaving reviewer-disagreement risk on every future audit.

**Approach:** Adopt the broader reading as canonical via a two-paragraph amendment to §2.6 — workflow.md concepts count as pre-existing for all step files. Pair with an anti-escape-hatch clause stating that §2.4 worst-case aggregation still scores Layer 1 concept-density independently, so authors cannot hide OC-R7 violations via preamble dumping. Propagate the resolution to the A24 audit report (§9 ambiguity #5 closure) and ship-track via the backlog.

## Boundaries & Constraints

**Always:**
- Preserve existing §2.6 paragraphs verbatim; append new paragraphs only
- Match the Checklist's existing tone (declarative, testable, reference-type per NFR4 Diátaxis)
- Revisions table entry uses existing format; type = `rule-content-edit`; placed at end of table per chronological convention
- The 3-file ship is atomic — partial ship is failure
- Mark A33 shipped with date 2026-04-20
- §9 ambiguity #5 annotation explicitly confirms empathy-map PASS as canonical

**Ask First:**
- Any wording change to the two amendment paragraphs beyond typo/grammar fixes
- Whether "workflow.md" scope in the amendment explicitly includes the MANDATORY EXECUTION RULES section (vs. preamble only) — likely yes, flag for Round 1 review
- How to treat the edge case where workflow.md's own Layer 1 OC-R7 verdict is FAIL — does step files inheriting workflow.md concepts get tainted? — flag for Round 1 review

**Never:**
- Modify any code (spec-only edit)
- Touch upstream BMAD namespace (`_bmad/core/`, `_bmad/bmm/`, `_bmad/bmb/`, etc.) — Convoke `_bmad-output/planning-artifacts/` only
- Rewrite existing §2.6 content (append only)
- Touch the Epic file (`convoke-epic-operator-covenant.md`) — A33 is §2.6 glossary work, not Epic classification
- Commit before Round 1 adversarial review via `bmad-code-review`

</frozen-after-approval>

## Code Map

- `_bmad-output/planning-artifacts/convoke-spec-covenant-compliance-checklist.md` -- target of primary amendment (§2.6 + Revisions)
- `_bmad-output/planning-artifacts/convoke-report-operator-covenant-audit-vortex-2026-04-19.md` -- audit report where §9 ambiguity #5 originated; gets resolution annotation
- `_bmad-output/planning-artifacts/convoke-note-initiative-lifecycle-backlog.md` -- backlog paper trail (Fast Lane → §2.5 Completed + Change Log)

## Tasks & Acceptance

**Execution:**

- [x] `_bmad-output/planning-artifacts/convoke-spec-covenant-compliance-checklist.md` -- Append two new paragraphs to §2.6 "Workflow-inherited concepts" section (after the existing `step-t-02` example). Paragraph 1 headed **Workflow.md as "earlier step."** — canonicalizes the broader reading with rationale tying to §2.4 Layer 1. Paragraph 2 headed **Anti-escape-hatch clause.** — states that §2.4 worst-case aggregation still scores Layer 1 independently, so preamble dumping doesn't hide OC-R7 violations; clarifies the rule governs *re-introduction*, not total concept budget. Add new Revisions table row at end: `2026-04-20 | rule-content-edit | **A33 shipped** — §2.6 extended to cover workflow.md concepts as pre-existing for step files. Anti-escape-hatch clause added: §2.4 worst-case aggregation still scores Layer 1 concept-density independently. Resolves §9 ambiguity #5 from A24 audit (empathy-map reading-dependent PASS); broader reading codified from natural reviewer behavior during A24 reproducibility gate. | A33 (backlog)` -- Close the rubric silence that produced reviewer-disagreement risk while preventing preamble-dumping exploit.

- [x] `_bmad-output/planning-artifacts/convoke-report-operator-covenant-audit-vortex-2026-04-19.md` -- Add a boldface "**Resolved 2026-04-20 via A33 — empathy-map PASS confirmed canonical under broader reading.**" annotation to §9 ambiguity #5. Preserve the original ambiguity description for historical context. -- Close the trace between surfacing audit and resolving amendment.

- [x] `_bmad-output/planning-artifacts/convoke-note-initiative-lifecycle-backlog.md` -- Remove A33 row from Fast Lane §2.3. Add A33 row to §2.5 Completed with columns: ID=A33, Description=detailed ship note covering §2.6 amendment + anti-escape-hatch clause + §9 ambiguity #5 resolution + "broader reading canonicalized from natural reviewer behavior per A24 §7.1" + Winston consultation attribution, Shipped=2026-04-20, Score=4.8, Portfolio=convoke. Append Change Log entry dated 2026-04-20 summarizing the ship, naming A33 + §2.6 + anti-escape-hatch + §9 ambiguity #5 closure + Winston consultation, and updating "Ship count today" per the existing convention. -- Paper-trail the ship per backlog-format-spec.md.

**Acceptance Criteria:**

- Given the Checklist before A33, when reading §2.6, then it contains only the intro paragraph + the `step-t-02` example. **After A33**, §2.6 contains two additional paragraphs in order (Workflow.md as earlier step → Anti-escape-hatch clause), and the Revisions table has a new A33 row dated 2026-04-20.
- Given the A24 audit report before A33, when reading §9 ambiguity #5, then it reads as unresolved ("reading-dependent"). **After A33**, the same section carries a bold "Resolved 2026-04-20 via A33 — empathy-map PASS confirmed canonical" annotation while preserving the original ambiguity text.
- Given the backlog before A33, when searching §2.3 Fast Lane for A33, then A33 is present at score 4.8. **After A33**, A33 is absent from §2.3, present in §2.5 Completed with Shipped=2026-04-20, and a 2026-04-20 Change Log entry exists naming A33 + the §2.6 amendment + anti-escape-hatch clause + Winston consultation.
- Given a future reviewer auditing a Vortex workflow under A33, when a workflow.md introduces concept X and step-01 uses concept X, then X counts as pre-existing — no FAIL triggers for re-introduction.
- Given a workflow.md that dumps >3 novel concepts in its preamble, when OC-R7 is scored at Layer 1 per §2.4, then that Layer 1 FAILs and the skill-level verdict is FAIL (§2.4 worst-case aggregation) — A33 does not rescue such cases.

## Spec Change Log

### 2026-04-20 — Round 1 review (pragmatic path)

**Triggering findings:**
- **IG1** (Edge Case Hunter HIGH) — MANDATORY EXECUTION RULES scope within `workflow.md` conflicts with §"Operator-facing vs agent-facing text" (§171). Pre-flagged Ask-First in `<frozen>`.
- **IG2** (Edge Case Hunter HIGH) — inheritance from a `workflow.md` whose Layer 1 OC-R7 verdict is FAIL. Pre-flagged Ask-First in `<frozen>`.
- **BS1** (Blind Hunter H1) — anti-escape-hatch clause lacks grounding; "scored independently" doesn't mean "scored strictly."
- **BS2** (Blind Hunter M3) — "all step files" drops the parent §2.6 "within a single workflow" qualifier.
- **P1** (Blind Hunter M1 / Acceptance F8) — Change Log tense drift ("expected next before commit").
- **P2** (Blind Hunter L3) — rescore history lost from §2.5 Completed row.

**Operator decisions (pragmatic path):**
- **IG1 = B**: A33 applies only to operator-visible portions of `workflow.md`. Concepts in `MANDATORY EXECUTION RULES` / `YOUR ROLE:` blocks are neither counted at Layer 1 nor inherited.
- **IG2 = C**: Inheritance is unconditional with respect to Layer 1's own verdict. §2.4 worst-case aggregation captures composition.

**Amendments applied inline (pragmatic path — no revert):**
- Checklist §2.6 expanded from 2 → 4 paragraphs (Workflow.md-as-earlier-step + Scope-operator-visible + Inheritance-unconditional + Anti-escape-hatch).
- Checklist Revisions row rewritten to reflect 4-paragraph amendment.
- Backlog §2.5 Completed row includes rescore history + IG1/IG2 decisions + review summary.
- Backlog Change Log entry rewritten (past tense, 2 IG + 2 BS + 2 P + 10 defers accounted).

**Known-bad states avoided:**
- Silent conflict between A33 and §171 if MANDATORY EXECUTION RULES concepts were counted as inherited.
- Non-compositional cell-level taint if FAILing Layer 1 tainted step-01 cell verdicts.
- Ambiguous reading of "all step files" as potentially cross-workflow.
- Anti-escape-hatch clause implying a new Layer 1 budget beyond existing §2.6 rules.

**KEEP instructions:**
- Four-paragraph §2.6 structure is load-bearing; don't collapse back to two.
- Explicit cross-reference to §"Operator-facing vs agent-facing text" in Scope paragraph.
- "§2.4 worst-case aggregation already captures composition" phrasing in Inheritance paragraph — justifies why cell-level taint is unnecessary.
- "Within the same workflow" qualifier in paragraph 1 (BS2 fix).

**AC drift note (pragmatic-path residue):**
- Original Intent and Verification sections refer to "two paragraphs" — after Round 1 review, §2.6 ships with four paragraphs. The intent is preserved (§2.6 is amended to resolve the ambiguity), but the paragraph-count references in frozen Intent/Verification are now historical artifacts of the pre-review draft. AC1 verdict under strict reading is PARTIAL; under intent-preservation reading (Round 1 operator decisions supersede pre-review paragraph-count claims) is PASS. Pragmatic path accepts the latter.

## Design Notes

**Why Option A (broader reading) over Option B (narrower reading).** Four reasons from Winston's consultation: (1) matches operator cognitive model — workflow.md is read first, its concepts are context by step-01; (2) consistent with §2.4 Layer 1 classification — if workflow.md is operator-visible, it can introduce concepts; (3) matches natural reviewer behavior per A24 §7.1 reproducibility notes; (4) Option B creates a compositional artifact where workflow.md is Layer 1 but somehow incapable of concept-introduction.

**Why the anti-escape-hatch clause is load-bearing.** Without it, authors could dump 20 concepts in workflow.md preamble to make step-01 trivially PASS, producing a skill that violates OC-R7 structurally while scoring PASS on every step-file cell. §2.4 worst-case aggregation already prevents this (Layer 1 scored independently), but stating it inline in §2.6 pre-empts reader confusion about the rule's scope.

**Golden example (empathy-map).** workflow.md introduces "Empathy map" + 6 quadrants. step-01-define-user introduces JTBD (1 concept). Under A33: step-01 = 1 novel concept = PASS. Layer 1 evaluated independently — A24 audit didn't flag Layer 1 density for empathy-map, so workflow.md was clean enough. The rule works as intended: no hiding, no double-counting.

## Verification

**Commands:**
- `git diff _bmad-output/planning-artifacts/convoke-spec-covenant-compliance-checklist.md` -- expected: additions only (two paragraphs in §2.6 + one Revisions row), no deletions
- `git diff _bmad-output/planning-artifacts/convoke-report-operator-covenant-audit-vortex-2026-04-19.md` -- expected: single annotation added to §9 ambiguity #5, no other changes
- `git diff _bmad-output/planning-artifacts/convoke-note-initiative-lifecycle-backlog.md` -- expected: 1 row removed from §2.3, 1 row added to §2.5, 1 row added to Change Log

**Manual checks:**
- Read §2.6 end-to-end after edit — flow: intro → `step-t-02` example → new paragraph 1 (workflow.md rule) → new paragraph 2 (anti-escape-hatch). No orphan sentences, no broken markdown.
- Cross-reference the two new paragraphs against §2.4 vocabulary — "Layer 1" and "worst-case aggregation" must match §2.4's phrasing verbatim.
- Confirm Epic file (`convoke-epic-operator-covenant.md`) was NOT touched — A33 scope excludes it.

## Suggested Review Order

**The §2.6 rule amendment (load-bearing — read first)**

- Entry point: the four new paragraphs canonicalizing the broader reading + scope + inheritance + anti-escape-hatch.
  [`convoke-spec-covenant-compliance-checklist.md:120`](../planning-artifacts/convoke-spec-covenant-compliance-checklist.md#L120)

- Cross-reference target for the Scope paragraph — confirms §171 rule is consistent.
  [`convoke-spec-covenant-compliance-checklist.md:171`](../planning-artifacts/convoke-spec-covenant-compliance-checklist.md#L171)

- Revisions table row — 4-paragraph description + Winston rationale + Round 1 review summary.
  [`convoke-spec-covenant-compliance-checklist.md:296`](../planning-artifacts/convoke-spec-covenant-compliance-checklist.md#L296)

**Ambiguity resolution propagation**

- Audit report §9 ambiguity #5 — "Resolved 2026-04-20 via A33" annotation; empathy-map PASS confirmed canonical.
  [`convoke-report-operator-covenant-audit-vortex-2026-04-19.md:253`](../planning-artifacts/convoke-report-operator-covenant-audit-vortex-2026-04-19.md#L253)

**Backlog paper trail**

- §2.5 Completed row — rescore history preserved + IG1/IG2 decisions + review summary.
  [`convoke-note-initiative-lifecycle-backlog.md:453`](../planning-artifacts/convoke-note-initiative-lifecycle-backlog.md#L453)

- Change Log entry — past-tense ship record with Round 1 review findings accounted.
  [`convoke-note-initiative-lifecycle-backlog.md:678`](../planning-artifacts/convoke-note-initiative-lifecycle-backlog.md#L678)
