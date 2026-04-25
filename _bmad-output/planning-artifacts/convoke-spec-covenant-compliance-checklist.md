---
initiative: convoke
artifact_type: spec
status: draft
created: '2026-04-18'
schema_version: 1
---

# Convoke Operator Covenant — Compliance Checklist

**Purpose:** the operational tool for auditing a Convoke skill against the Operator Covenant. One binary question per right; answers strictly enumerated; glossary + scope rules + parser grammar defined inline so the Checklist stands on its own.

**Consumers:**
- **Manual reviewer audits** — walk a skill's full interaction surface and answer each rule.
- **Covenant self-compliance gate** (Story 1.4) — applied to the Covenant draft before closing, using the doc-applicability mapping in [§Applying to a document](#applying-to-a-document-story-14-self-compliance-gate) below.
- **Future Loom validation gate** (Story 2.2, deferred) — parses this table programmatically via the cell grammar in [§Compliance Status conventions](#compliance-status-conventions).

**Rule IDs are stable.** Each rule is pinned to both a canonical name and a stable slug (see [§Canonical right names with slugs](#canonical-right-names-with-slugs)). Display names may change; slugs do not. Rule IDs are tied to slugs, not names.

---

## The Checklist

<!-- checklist-rules-start -->

| Rule ID | Question (answer per skill per the grammar below) | Compliance Status |
|---------|---------------------------------------------------|-------------------|
| OC-R0 | Has the auditor enumerated the full 3-layer interaction surface (workflow.md + all step files + all invoked scripts/CLIs) before answering any OC-R1...OC-R7? The enumeration must be recorded in evidence notes. **Layer 3 entries MUST carry an `(internal)` or `(external)` qualifier** — e.g., `Surface: workflow.md + 5 step files + scripts/foo.js (internal) + git (external)`. `(internal)` means the script is authored inside this repository; `(external)` means an externally-owned CLI (git, npm, docker, ...). The qualifier is a precondition for OC-R6's `N/A — external-declared (<tool>)` value — see §Compliance Status conventions. This is a mandatory precondition — cells answered against an incompletely-enumerated surface are invalid. | |
| OC-R1 | At every branch where the skill encounters unresolvable state, does it propose a default value the operator can accept or override? (`skip` / `abort` are exits, not fallback values — they count as FAIL.) | |
| OC-R2 | For every scan, filter, or selection operation, does the skill display the full scope (total scanned + matched + excluded) before or alongside the filtered result? | |
| OC-R3 | At 100% of operator decision points, does the skill include at least one sentence of rationale explicitly naming at least one of: consequence, trade-off, or downstream effect? (Any single missing instance = FAIL.) | |
| OC-R4 | For every exclusion, does the skill both (a) report a count of excluded items and (b) provide a reason per exclusion class? (Silent exclusion, or exclusion reported without a reason, = FAIL.) | |
| OC-R5 | At every operator decision point, does the skill use an explicit halt-and-wait marker? Accepted markers (one must appear near the prompt): (i) literal `HALT` or `HALT and wait for user input`, (ii) `ALWAYS halt and wait for user input` in a MANDATORY EXECUTION RULES block, (iii) `HALT for input.` / `Wait for user input.` / `WAIT for operator input` as a standalone line immediately after a menu. A bare `> question?` blockquote, or a menu with no literal halt statement on a following line, = FAIL. | |
| OC-R6 | For every operator-visible error emitted by the skill or any underlying script it invokes, does it include a concrete next action (remediation step, recovery command, or pointer to a resolving workflow)? (`Retry` / `restart` count only when paired with what to change before retrying.) | |
| OC-R7 | For every interaction round, does the skill introduce ≤ 3 novel concepts per the [Novel-Concept Glossary](#novel-concept-glossary) below? An "interaction round" = one operator-input boundary; a step file presenting N questions before pausing is one round. | |

<!-- checklist-rules-end -->

---

## Compliance Status conventions

### Allowed values

Fill each Compliance Status cell with one of **six** enumerated values (strict; no free-form variants accepted):

| Value | Meaning |
|-------|---------|
| `PASS` | Evidence from the skill's interaction surface satisfies the rule's question with an affirmative answer. |
| `FAIL` | Evidence from the skill's interaction surface violates the rule — even once. |
| `N/A — vacuous (<reason>)` | The rule's question has no applicable surface in this skill by design. Example: `N/A — vacuous (skill is pure automation, no operator prompts)`. Vacuous ≠ PASS by default — only grant `N/A — vacuous` if the surface genuinely doesn't exist; otherwise answer PASS or FAIL. |
| `N/A — out-of-scope (<reason>)` | The entire skill is declared out-of-scope for this audit (e.g., headless automation, non-operator-facing build tool). Typically applied at skill level once; all 7 rules then get the same `out-of-scope` answer. |
| `N/A — external-declared (<tool>)` | **Applicable to OC-R6 only.** The skill's Layer 3 surface is stderr from an externally-owned CLI (git, npm, docker, etc.) whose error messages the skill does not rewrite. Worst-case aggregation excludes Layer 3 for this cell. **Required evidence-note format** (use this exact template so reviewers can validate preconditions without prose archaeology): `Layers: L1 PASS (<evidence ref>), L2 PASS (<evidence ref>), L3 external-declared (<tool>)` as a bulleted line in the evidence note for the OC-R6 cell. The `<evidence ref>` slots MUST be concrete — e.g., line refs into operator-facing content, or a one-phrase rationale — not bare "PASS" declarations. **The `Layers:` bullet AUGMENTS the existing evidence-note convention** (§§8.x prose verdict lines or §§3.x calibration-table per-layer columns); it does not replace them. It is only required when the OC-R6 cell uses `external-declared`. Preconditions (ALL must hold): (a) the external tool is named in the `<tool>` slot AND repeated in the evidence-note template; (b) Layer 3 output is enumerated in the OC-R0 evidence note with an `(external)` or `(internal)` qualifier per entry (see OC-R0 row above); (c) Layers 1 and 2 each independently verify PASS on OC-R6 (the skill's own error-emitting paths all include next actions) with concrete evidence refs in the template. If L1 or L2 would FAIL, the cell is FAIL regardless of declaration. **Disambiguation vs `out-of-scope`:** use `external-declared` when the skill has operator-facing content in L1+L2 and only L3 is non-owned; use `out-of-scope` only when the entire skill is non-operator-facing (headless automation, build tool). **Tiebreaker when both apply:** if a skill is entirely headless AND wraps an external CLI, `out-of-scope` takes precedence and sets all 7 cells; do NOT use `external-declared` on OC-R6 in that case — it would be redundant. **Parser enforcement** is specified in the [Parser grammar section](#parser-grammar-for-story-22-loom-gate). Example: `N/A — external-declared (git)`. |
| `DEPRECATED (<covenant-revision>)` | The rule was removed from the Covenant in the cited revision. The row is retained for rule-ID stability. Audits after the revision treat the cell as a non-finding (neither PASS nor FAIL). Example: `DEPRECATED (2026-07-01)`. |

### Parser grammar (for Story 2.2 Loom gate)

The Loom validator parses each Compliance Status cell against this regex:

```
^(PASS|FAIL|DEPRECATED \(.+\)|N/A — (vacuous|out-of-scope|external-declared) \(.+\))$
```

**Two-step validation requirement (OC-R6-scoped values).** The regex is deliberately rule-agnostic — it does not encode which rules accept which values. A conforming Loom parser (Story 2.2) MUST perform a two-step validation:

1. **Regex check** (above) — accepts the Compliance Status cell's syntactic form.
2. **Rule-ID scope check** — rejects `N/A — external-declared (<tool>)` on any rule other than OC-R6; rejects values the regex happens to match but that are out of scope for their cell.

Do not "fix" the regex by folding rule-ID into the alternation (e.g., per-rule grammars). The separation is intentional so that (a) the grammar stays small and grep-able, (b) rule-specific value scoping lives in code where it can carry human-readable error messages, and (c) future values restricted to specific rules can extend this pattern without a combinatorial blowup.

Normalization rules:
- Em-dash (`—`, U+2014) is canonical **as the separator between a leading-token (`N/A` or equivalent) and the qualifier**. Parsers MUST accept `--` (double hyphen-minus) and `-` (single hyphen) as equivalents in that separator position only, coercing to em-dash before regex validation. Hyphens WITHIN the reason text (inside the parentheses) are NOT coerced — e.g., `N/A — out-of-scope (build-tool wrapper)` preserves the hyphens in "build-tool". Implementations anchor the coercion on the pattern `^(N/A) (—|--|-) (vacuous|out-of-scope|external-declared) \(`.
- Pipe characters (`|`) in cell content MUST be escaped as `&#124;` to preserve table structure.
- Blank cells = FAIL (incomplete audit); parsers MUST emit a warning and treat as FAIL.
- Leading/trailing whitespace is stripped before validation.
- **No trailing punctuation.** Do NOT append a period, semicolon, or other punctuation after the closing `)` — `N/A — vacuous (reason).` fails the regex because `.` falls outside the capture group. If a closing-sentence feel is desired, end the reason text with a period inside the parens: `N/A — vacuous (no operator surface.)`.

### No partial credit

Strict binary + three N/A variants (one of which — `external-declared` — is OC-R6-only). No severity, no weighting, no "borderline". Nuance belongs in evidence notes alongside the Checklist, not in the Compliance Status cell.

---

## Canonical right names (with slugs)

Rule IDs map to both canonical names AND stable slugs. The slug is the invariant identifier; display names may change across Covenant revisions without breaking cross-references.

| Rule ID | Slug (stable, invariant) | Right (canonical name, may evolve) |
|---------|-------------------------|------------------------------------|
| OC-R1 | `right-to-default` | Right to a default |
| OC-R2 | `right-to-full-universe` | Right to the full universe |
| OC-R3 | `right-to-rationale` | Right to rationale |
| OC-R4 | `right-to-completeness` | Right to completeness |
| OC-R5 | `right-to-pause` | Right to pause |
| OC-R6 | `right-to-next-action` | Right to next action |
| OC-R7 | `right-to-pacing` | Right to pacing |

**Mapping rules:**
- The Covenant (`convoke-covenant-operator.md`, Story 1.4 output) MUST pin each right to a slug via frontmatter or section metadata. Slugs are the reference-invariant.
- If a right is renamed (display name change), the slug is preserved and the Checklist rule ID is preserved. The name-column of this table is updated via a `rule-content-edit` revision (see [§Revisions](#revisions)).
- If a right is added, the Checklist adds a new row with the next rule ID (OC-R8, OC-R9, ...) — appended, not inserted. Reviewer ordering follows Checklist order, not Covenant narrative order.
- If a right is removed, the rule's row is retained with Compliance Status `DEPRECATED (<covenant-revision>)` across all future audits (note: no em-dash separator for DEPRECATED, to distinguish it from the N/A family). Rule IDs are never reused.

---

## Novel-Concept Glossary

*(Inlined from Covenant audit report §2.6 so OC-R7 is answerable without external lookup. If the audit report's glossary is extended in a future revision, this section is updated in lockstep via a `rule-content-edit` revision.)*

### Pre-existing concepts (do NOT count as novel)

Assumed known from general computing literacy:

> menu, option, prompt, ask, reply, input, continue, exit, abort, accept, reject, yes, no, skip, retry, help, back, filter, sort, scan, list, search, file, folder, path, rename, move, copy, delete, done, cancel, confirm, review, submit

### Workflow-inherited concepts

Within a single workflow, a concept introduced in earlier steps is pre-existing for later steps. Example: if step-t-02 introduces "finding" and "intake", those are pre-existing when reaching step-t-03.

**Workflow.md as "earlier step."** Concepts introduced in `workflow.md` — the top-level orchestration file per §2.4 Layer 1 — count as pre-existing for all step files within the same workflow. Rationale: workflow.md is operator-visible (Layer 1) and precedes any step file in the operator's reading order. Its concept-introductions load the shared vocabulary that step files build on.

**Scope: operator-visible only.** Per §"Operator-facing vs agent-facing text" below, OC-R7 counts only text the operator reads. The same scope applies here — concepts appearing exclusively in `MANDATORY EXECUTION RULES`, `YOUR ROLE:`, or similar agent-facing blocks are neither counted at Layer 1 *nor* inherited by step files. Inheritance applies to operator-visible concept-introductions in workflow.md only.

**Inheritance is unconditional with respect to Layer 1's own verdict.** Even when workflow.md's own Layer 1 OC-R7 verdict is non-PASS (FAIL, or an `N/A` variant such as `N/A — vacuous`), its operator-visible concepts remain pre-existing for step-file cells. The concepts being inherited are — by definition — the same operator-visible set that ¶2 admits to Layer 1 scoring in the first place; cell-level inheritance uses that same set unconditionally. §2.4 worst-case aggregation composes the skill verdict from the Layer 1 and per-step cells, so a FAILing Layer 1 FAILs the whole skill regardless of step-cell outcomes — no additional cell-level taint is needed to prevent escape. Cell-level scoring stays compositionally simple.

**Anti-escape-hatch clause.** This rule does not let authors hide novel concepts via preamble dumping. Workflow.md's own operator-visible content must still pass OC-R7 at Layer 1 under the existing §2.6 concept-count rules — no new threshold is introduced. The amendment's *only* effect is to exempt re-introduction in step-01; the Layer 1 concept budget itself is untouched.

### What counts as novel

- **Domain-specific terms** (e.g., Lane, Portfolio attachment, RICE, JTBD, Stack Profile, Covenant, calibration case)
- **Distinct decision mechanisms** (e.g., `specify <initiative>` vs `merge #N` — each is a mechanism)
- **Named actions with new consequences** (e.g., "qualifying gate" before it's been explained, "Publication Gate" on first mention)
- **Mental-model framings** introduced by the skill (e.g., "hire vs buy", "gravity of decisions")

### What "interaction round" means

- One operator-input boundary = one round.
- A step file presenting N questions before pausing for input is **one round** (not N rounds).
- A workflow that auto-advances through N internal stages with no operator input between them is **one round** (the round ends at the next input boundary).

---

## Applying this Checklist to a skill

### Three-layer audit scope

The "operator-visible interaction surface" is the union of **three layers**. All must be enumerated before any rule is answered:

1. **Layer 1 — `workflow.md`** — top-level orchestration, MANDATORY EXECUTION RULES, initialization.
2. **Layer 2 — `steps/**.md`** — all step files, their prompts, menus, HALT patterns, decision points.
3. **Layer 3 — underlying scripts/CLIs the skill invokes** — stdout/stderr behavior, error messages, interactive prompts the operator sees when the skill shells out.

### Worst-case aggregation

The **skill-level verdict** for each rule is the **worst case across all 3 layers**. Example: if `workflow.md` is clean but `step-02-resolve.md` violates OC-R5, the cell is FAIL. Per-layer verdicts may be recorded in evidence notes for granularity; the Compliance Status cell reflects worst-case.

**OC-R6 external-declared carve-out:** when a skill wraps an externally-owned CLI (git, npm, docker, ...) whose stderr the skill does not rewrite, Layer 3 error text is structurally outside the skill's authorship — the skill cannot add next-action clauses to errors it doesn't emit. In this specific case, the auditor MAY record the OC-R6 cell as `N/A — external-declared (<tool>)`, and worst-case aggregation for that cell excludes Layer 3. The carve-out is narrow:

1. **OC-R6 only.** No other rule uses this value. (OC-R1/R2/R4/R5/R7 are about the skill's own prompts and decisions, not inherited error text; OC-R3 rationale is also skill-authored.)
2. **Evidence note MUST record**: (a) the external tool name matching the `<tool>` slot, (b) Layer 3 enumeration in the OC-R0 evidence note, (c) per-layer verdicts showing L1 PASS and L2 PASS on OC-R6 (the skill's own error paths all include next actions). If L1 or L2 would FAIL, the cell is FAIL — the declaration does not mask skill-authored OC-R6 violations.
3. **The skill is still encouraged to annotate common external errors.** A wrapper that catches known git/npm errors and emits next-action hints improves operator experience beyond the carve-out's minimum bar, and should record this in evidence notes for future audit calibration.

### Pre-audit enumeration (OC-R0 precondition)

**Before answering any rule**, the auditor MUST:

1. Locate all Layer 1, 2, 3 files for the skill.
2. Record the enumeration in the evidence note (e.g., `Surface: workflow.md + 5 step files + scripts/foo.js`).
3. If any layer is inaccessible or ambiguous, halt the audit and resolve scope before proceeding.

**Cells answered against an incompletely-enumerated surface are invalid** — the audit is not considered complete.

### Operator-facing vs agent-facing text

For OC-R7 specifically: concept count is measured against text the **operator reads**, not internal `MANDATORY EXECUTION RULES` or `YOUR ROLE:` blocks addressed to the AI agent. When in doubt, ask: "would an operator see this sentence?" — if no, it's agent-scaffolding and doesn't count.

---

## Applying to a document (Story 1.4 self-compliance gate)

The Checklist was designed for skills. When Story 1.4 applies it to the Covenant **document** draft, the rules map to document-structural questions as follows:

| Rule ID | Document-form question |
|---------|------------------------|
| OC-R1 | Does every right's "Why it exists" section include a good-example illustration operators can recognize as the default pattern? |
| OC-R2 | Does the Covenant list all rights (full universe) before narrating any one in detail? (Table-of-contents or enumeration above the per-right sections.) |
| OC-R3 | Does every right include rationale linking it to the axiom and explaining why it matters? |
| OC-R4 | Are all rights included in the Covenant? (Every OC-R# from this Checklist has a corresponding Covenant section.) |
| OC-R5 | N/A — vacuous (a document has no decision points) |
| OC-R6 | Does every anti-pattern in the Covenant include a "what it should have been" remediation? |
| OC-R7 | Does each right's section introduce ≤ 3 novel concepts in the Covenant's **cumulative** vocabulary? Concepts introduced earlier in the Covenant (preamble, axiom explanation, JTBD statement, prior right sections) are pre-existing for later sections. Paige's 4-part format (statement / why / good example / anti-pattern) is rhetorical structure — good-example and anti-pattern illustrations that demonstrate an already-introduced concept do NOT count as novel concepts. **BUT any new domain noun, mechanism, or mental-model framing introduced INSIDE an illustration still counts toward the section's budget** — the carve-out applies only to the rhetorical move (calling something a "good example" or "anti-pattern"), not to fresh concepts inside those illustrations. The ≤3 cap applies per section, not per part. |

**Story 1.4 closure rule:** the Covenant draft passes this mapping (all 7 rules = PASS or documented N/A) before the story moves to review.

**Covenant preamble authoring contract (added 2026-04-18, A12 follow-up):** for the OC-R7 doc-mapping to work at the first per-right section (Right to a default), the Covenant's preamble (axiom explanation + JTBD statement) MUST introduce the following core foundational vocabulary up-front so subsequent sections can treat them as pre-existing:

> `default`, `fallback`, `override`, `unresolvable state`, `exclusion`, `decision point`, `interaction round`, `concept budget`, `scope`

Without this preamble pre-introduction, Section 1 will exceed the ≤3 budget in its statement alone (the statement necessarily introduces `default`, `fallback`, `override`, `unresolvable state` — 4 concepts). Paige: author the preamble with this contract in mind; the Checklist assumes it holds. If the preamble does not introduce these terms, the doc-mapping OC-R7 rule predictably fails on Section 1.

---

## Selection Discipline

Covenant audits make selection decisions at three layers: **which skills** enter the matrix (§Skill Selection), **which steps** within each skill get audited (§Step Selection), and **which cells** (skill × rule) get the blind-reviewer gate (§Cell Selection). Each layer has its own failure mode and its own discipline.

### Skill Selection (multi-skill audits)

**Applies to:** audits covering two or more skills. Single-skill audits exempt.

Before beginning, the auditor MUST:

1. **Declare the structural dimensions** relevant to the audit scope — the axes along which the audit will claim generality. Examples (not exhaustive, audit-scope dependent): invocation pattern (HC-contract-at-step-01 vs direct-input vs interactive-elicit); template+validate scaffolding presence/absence; layer composition (L1 only / L1+L2 / L1+L2+L3); operator-facing vs headless; module archetype (discovery / decision-support / authoring / audit / research); conditional-surface branching.

2. **Classify each picked skill** against the declared dimensions, inline with the pick rationale in the audit report's scope section.

3. **Declare the audit's selection intent** — choose one explicitly, upfront:
   - **Independent verification** (default): the pick set MUST include ≥ 1 variation on the primary declared dimension. Findings generalize across that dimension.
   - **Pattern verification**: the pick set MAY be structurally-homogeneous. Findings report **pattern replication**, not class-level generality. The audit report's Executive Summary MUST carry a prominent disclaimer: "pattern-verification audit — not independent N datapoints."

4. **Mixed audits are allowed:** pick set includes both variations (independent) and twins (pattern verification within one cluster). The report MUST label which cells contribute to which claim.

The discipline is declarative, not prescriptive on dimensions — the axes are audit-scope dependent. Consumer-facing clarity comes from the pre-registered intent, not a universal taxonomy.

### Step Selection (multi-step skills)

**Applies to:** audits of skills whose workflow has two or more steps.

Each picked skill's audit MUST cover **≥ 2 steps** OR explicitly scope to a single step (typically step-01) with documented rationale in the report. Rationale examples: "the audit is explicitly scope-matched to a prior single-step audit for cross-audit comparability"; "later steps lack operator-facing surface (headless execution)." Avoid self-justifying claims like "step-01 is the highest-concept-density step" — such claims presuppose evidence that only a multi-step audit could establish.

Single-step scoping is legitimate but must be declared — a silent single-step audit is a methodology gap. Future audits with the same skill should cover different steps unless the rationale above still holds.

### Cell Selection (reproducibility gate)

**Applies to:** Convoke Covenant audits that span two or more skills — e.g., the v1 baseline audit of 8 skills (2026-04-18). Single-skill audits and the Story 1.4 self-compliance gate on the Covenant document are exempt — the gate exists to validate rubric consistency across a population, not per-document.

**Gate requirement.** The auditor MUST run a blind dual-reviewer reproducibility check covering **≥ 3 cells**, and the cell selection MUST span the verdict distribution:

1. **≥ 1 expected-PASS** cell (auditor's own pre-gate verdict is PASS).
2. **≥ 1 expected-FAIL** cell (auditor's own pre-gate verdict is FAIL).
3. **≥ 1 borderline** cell. **Hardness test:** among eligible borderline cells (auditor's own verdict uncertain), the auditor MUST pick the cell where the opposite verdict would most materially change the audit's headline findings. Borderlines whose resolution does not bear on final reporting are ineligible — their inclusion is gate-padding and does not satisfy the requirement.

**Audit sequence** (resolves the circularity between "headline findings" and "borderline selection"):

1. Auditor completes the audit with **provisional verdicts** for every cell.
2. Auditor drafts **provisional headline findings** from those verdicts (no publication yet).
3. Auditor selects the gate's 3+ cells, using provisional headlines to satisfy the borderline hardness test.
4. Blind reviewers run the gate.
5. Based on gate outcomes (incl. any DISPUTED exclusions per failure-mode path (b)), the auditor finalizes verdicts and writes **final headline findings** for publication.

Cells beyond the minimum three are encouraged. **Gate size is fixed at cell-selection time (step 3).** Adding cells after blind reviewers have begun is FORBIDDEN — it prevents post-hoc N-inflation to escape a binary-rule failure at N=3 or 4. LLM reviewers are acceptable; the gate validates rubric clarity for LLM judgment, not cross-human agreement. Reviewers must be blind to each other's verdicts before submitting.

**Threshold.** The threshold measures **reviewer agreement** (rubric reproducibility), not auditor calibration:

- **N = 3 or 4 cells:** zero disagreements required (100% agreement). ≥80% is mathematically unreachable below 100% at N=3 (2/3 = 67%) and N=4 (3/4 = 75%), so the spec states the binary outcome explicitly.
- **N ≥ 5 cells:** ≥ 80% verdict agreement across the gate (tolerates one disagreement per five cells).

Concept-category overlap for OC-R7 is measured separately; verdict-agreement is primary.

**Failure mode.** If the gate fails its threshold (i.e., disagreements exceed the tolerance above), the audit report MUST document each disagreeing cell and take one of **four paths**:

- **(a) Revise the rubric** to resolve the ambiguity, then re-run the gate on a fresh cell selection.
- **(b) Declare the disagreeing cells' verdicts `DISPUTED`** in evidence notes and exclude them from headline findings (other cells remain usable). **When path (b) excludes cells, the threshold MUST be re-applied to the post-exclusion count.** Example: original N = 5 with one DISPUTED exclusion yields effective N = 4, which per the threshold above requires 100% agreement on the remaining 4. If the remaining cells don't clear the recomputed threshold, escalate to (a), (c), or (d).
- **(c) If EVERY cell in the gate disagrees** (regardless of gate size — the intent is "no reviewer signal at all"), the rubric is considered methodology-invalid for this audit generation; publication is unavailable until path (a) produces a passing gate. Path (b) is not a valid exit when the entire gate fails — declaring all cells DISPUTED would empty the gate's signal.
- **(d) Shrink audit scope.** When the ambiguity lies in the *skill surface* (e.g., a skill is genuinely neither operator-facing nor headless) rather than in the rubric, revising the rubric cannot fix it. The audit MAY remove the ambiguous skill(s) from the matrix entirely — with explicit rationale in the report's scope section — and re-run the gate on the remaining cells. The removed skills are logged for a future audit with clarified scope.

**Three-way disagreement.** If the two reviewers disagree with *each other* (not just with the auditor), reviewer-agreement for that cell is 0% — both disagreement directions count. A three-way disagreement (auditor prediction differs, reviewers also differ from each other) is simultaneously a threshold failure AND a misprediction; both are logged.

**Pre-gate verdict expectation discipline.** The expected-PASS / expected-FAIL / borderline labels are the auditor's *pre-gate* prediction, recorded before the blind reviewers run. Misprediction (auditor expected PASS, reviewers agreed FAIL) is a **separate calibration signal** and does NOT count against the reviewer-agreement threshold above — the threshold measures rubric reproducibility across reviewers only. Mispredicted cells MUST be flagged in the audit report regardless of reviewer agreement, as rubric-application learning opportunities for the auditor.

**"Headline findings" defined.** For gate-failure scope purposes, "headline findings" means the sections of the audit report that a consumer would read as the audit's binding conclusions: the Executive Summary and the Audit Matrix section with its subsections (skill × rule verdict table, Bottleneck Analysis, Headline Finding prose summary). In the v1 audit template this is §1 plus §7 and its subsections (§7.1 Bottleneck Analysis, §7.2 Headline Finding). Per-skill evidence notes and calibration appendices are NOT headline findings — a DISPUTED cell excluded from headlines may still carry its evidence note for audit-trail completeness. **Section numbers are illustrative:** future audit templates may re-structure sections; what binds is the role ("Executive Summary" / "Audit Matrix + subsections"), not the number.

**v1 baseline note.** The v1 audit (2026-04-18, §2.5 of `convoke-report-operator-covenant-audit-2026-04-18.md`) ran a 1-cell gate. That audit's own "Honest limitations" section identified the single-cell sample as a methodology weakness and recommended ≥3 cells for future audits. This section formalizes that recommendation. v2+ audits MUST satisfy this gate before headline findings are published.

---

## A41-Clarifications (Selection Discipline + COI Mitigation, post-A41+A42 ship)

*(Heading renamed per R1 review BH-H1 — original `## Selection Discipline §A41-Clarifications` made this section appear to be a subsection of `## Selection Discipline` above, but it's structurally a sibling H2 section. New title makes the scope explicit: clarifications to Selection Discipline rules + new COI Mitigation Tier Taxonomy.)*

*(Added 2026-04-25 via A41+A42 bundle ship. Resolves 5 HIGH + 4 MEDIUM findings from A40 R2 + 7 from A39 R2/R3. Forward-only application: v4+ audits use these clarifications; pre-v4 audits stay locked under G4 mitigation gate per their original methodology version. See [oc-publication-gate-rigor-a41-a42.md](../implementation-artifacts/oc-publication-gate-rigor-a41-a42.md) for full A41+A42 spec + 13 Pre-Author Decisions.)*

### Version-pinning algorithm (anchors all forward-only rules)

A41 introduces multiple forward-only rules (primary: §A41-1, §A41-4, §A41-6, §A41-8, §A41-13 — i.e., R1 enumerated-options strict, OC-R5 strictness convergence, A10 cell selection borderline, A28 v2 step selection, cell-mechanism naming stability). All use the same v3-vs-v4 cutover semantics:
- **Version anchor:** the methodology revision number maintained in this Checklist's §Revisions section. "v3" = pre-A41 era (oc-1-1, A24, A39); "v4" = post-A41 era.
- **Per-audit pin:** an audit's `created` date in frontmatter pins which methodology revision applies. Audit `created: 2026-04-25` runs under whichever revision is current at that date.
- **"v4+" shorthand throughout:** means "audits with `created` ≥ A41 ship date".
- **Mid-execution version bumps:** audits straddling a version bump (e.g., started under v3, A41 ships mid-audit) stay locked at the version current when execution started — version doesn't change mid-execution.

### §A41-1 — R1 application to enumerated-options menus (clarifies OC-R1)

OC-R1 fires on ALL operator-decision branches in audited step including enumerated-options menus that lack default-suggestions. The Loom add-team R1 PASS pattern ("Default suggestion: based on context, suggest the most likely value with reasoning") is the compliance pattern; absence of such a suggestion in any operator-decision branch = FAIL.

- **Example FAIL:** Coach R1 in A39 §4.4 — `step-01-load-context.md:65-75` Review Mode menu lacks default-suggestion → FAIL.
- **Example PASS:** Loom add-team R1 in oc-1-1 §8.5 — pattern menu has explicit default-suggestion → PASS.
- **Operationally divisive history:** A39 §7.1 Cell 1 demonstrated 3 distinct reviewer readings of this rubric application; this clarification commits to the strict-per-Loom interpretation.

### §A41-2 — Multi-field contract enumeration counting (clarifies §2.6 Novel-Concept Glossary)

Multi-field contract enumerations (e.g., HC1/HC2/HC3 schema fields, GC1/GC2/GC3 contract fields) count as **1 compound concept if ≤3 visible sub-fields**; count as **N concepts if ≥4 visible sub-fields**. Hybrid rule resolves charitable-vs-strict ambiguity deterministically — reading is fixed by structure-count, not by reviewer preference.

- **Example "N concepts":** A39 §4.2 Atlas R7 — GC1 Stack Profile has 7 sub-fields per `step-01-load-profile.md:24` (primary_language, primary_framework, container_orchestration, ci_cd_platform, observability_tooling, cloud_provider, communication_protocol). Under §A41-2 hybrid rule: 7 ≥ 4 → counts as 7 novel concepts → exceeds ≤3 budget → strict-FAIL. (At v3 era, A39 charitably scored as 1 compound concept = PASS; v4+ refresh would re-evaluate as FAIL under §A41-2.) *(Example corrected per R1 review EC-H1 — original example pinned PASS to a fabricated GC2/Lens R7 mapping that A39 §4.3 doesn't actually use; Lens R7 PASSes on "Limited coverage" + grouping-rules concepts, not on a GC2 sub-field count.)*
- **Example "1 compound":** A hypothetical HC2 with 3 visible sub-fields (e.g., Problem Statement / Hypothesis / Riskiest Assumption) at step-01 → 3 ≤ 3 → counts as 1 compound concept. Under ≤3-concept budget, contributes 1 of 3 → does not alone trigger R7 FAIL.
- **Operationally divisive history:** A39 §7.1 Cell 3 demonstrated charitable-vs-strict split on Scout R7 (5 vs 2 concept counts under different readings); this clarification commits to the structure-count rule.

### §A41-3 — Vacuous-PASS methodology status (N_effective semantics)

A **vacuous-PASS cell** = a cell where the operator-decision branch the rubric tests does NOT exist at the audited step. Vacuous-PASS cells are recorded honestly in evidence notes but DO NOT count toward Publication Gate evidence breadth.

T1 trigger evaluation uses **N_effective = N_total − N_vacuous** (cells per right where the rubric could fire). Auditors record both N_total and N_effective in §5 row tables; T1 fires if `fails / N_effective > 30%` AND `N_effective ≥ 3`. If N_effective < 3 for a right, T1 evaluation is **deferred** for that (team × Right) cell-row pending audit-scope expansion to ≥2 steps.

- **Example (deferred branch):** A39 §5 row R1 — N_total = 4 (Scout/Atlas/Lens/Coach); 2 cells vacuous (Atlas R1, Lens R1); N_effective = 2 < 3 floor → T1 evaluation **deferred** for R1 under N_effective semantics. *(Note: deferred ≠ FAIL ≠ PASS; the cell-row is structurally insufficient for T1 evaluation.)*
- **Deferral-resolution mechanism** *(added per R2 review — original "expand audit scope to ≥2 steps" pointed at §A41-8 but §A41-8 doesn't define the mechanism for lifting N_effective from <3 to ≥3)*: to convert a deferred (team × Right) cell-row to evaluable, the audit scope must be expanded to additional steps that introduce **R-relevant operator-decision branches** at the previously-vacuous skills. Mechanism: (1) identify the deferred (team × Right) cell-row + the specific vacuous cells (e.g., A39 R1: Atlas R1 + Lens R1 vacuous); (2) for each vacuous skill, audit additional step files (step-02, step-03, ...) until ≥1 operator-decision branch is found that exposes the right's rubric (e.g., Atlas step-02 has a "review-mode-menu" branch → R1 fires); (3) re-evaluate the cell at the new step scope (Atlas R1 = PASS or FAIL based on the branch); (4) recompute N_effective for the cell-row; if N_effective ≥ 3, evaluate T1; if still N_effective < 3 after exhausting all step files, the cell-row stays deferred and is flagged in the audit report's §Implications + §9 ambiguities. **Important**: simply auditing more steps does NOT mechanically lift N_effective — only steps that introduce R-relevant operator-decision branches count. A workflow whose every step is data-loading (no operator decisions) cannot lift R1/R5 N_effective regardless of step count. This is the structural limit Production-readiness archetypes hit (see §A41-8); A28 v2's ≥2-steps default exists to maximize the chance of exposing R-relevant branches, not to guarantee it.
- **Example (fires branch):** Hypothetical Vortex audit with 5 cells, 1 vacuous on R5 → N_effective = 4 ≥ 3; if 2 of 4 effective cells fail R5 → fail_rate = 50% > 30% → T1 fires on R5. The rule's both branches matter — N_effective deferral is the conservative fallback; T1-firing is still the load-bearing outcome when N_effective ≥ 3.
- **A39's published verdicts stay locked at original N_total framing per G4 mitigation gate** — the N_effective re-read is a v4+ refresh outcome (**a NEW audit run from scratch under v4 rubric, NOT a re-scoring of A39's existing cells**). A39's R1 cell-row stays "T1 fires PROVISIONAL at 50%" in published form; v4+ refresh of Gyre would produce a separate matrix under N_effective semantics. *(Both-branches example added per R1 review EC-H2 — original example only showed deferred case, missing the load-bearing fires-at-N_effective-≥3 branch. Cell-mechanism naming stability across version cutover detailed in §A41-13.)*

### §A41-4 — OC-R5 strictness convergence (clarifies OC-R5; forward-only)

**v4+ audits use OC-R5 strict reading** (literal HALT marker required: `HALT for input.`, `Wait for user input.`, `WAIT for operator input` as standalone line near prompt). Pre-v4 audits (oc-1-1, A24, A39) used oc-1-1 §2.4 R5 lenient reading (implicit-wait accepted per oc-1-1 §8.7 lean-persona precedent reused by A24 §4.1+§4.2). Forward-only adoption per G4 mitigation gate; pre-v4 verdicts stay locked at original strictness.

- **Example net-effect on A39:** under v4+ strict reading, the wait marker `Wait for user input.` at `step-01-load-context.md:77` (cited in A39 §4.4 Coach evidence note, not in §5 verdict table) is sufficient (literal); the §4 dangling-prompt FAIL stands either way. Net: v4+ adoption doesn't change A39 Coach R5 verdict (R2 cascade already accounted for the dangling-prompt; OC-R5 strictness convergence is forward-only methodology hardening). *(Citation location clarified per R1 review EC-H3 — A39 §5 is verdict table; wait marker line citation lives in A39 §4.4 evidence note.)*
- **Hypothetical v3-vs-v4 verdict-difference example** *(added per R1 review AA-FIND-5 — original example showed "no change" case only)*: a future audit of a workflow whose step-01 has an implicit-wait pattern (e.g., "Please provide your input.") with no literal halt marker — under v3 lenient reading per oc-1-1 §8.7, this PASSes R5 (implicit wait accepted). Under v4+ strict reading per §A41-4, this FAILs R5 (no literal HALT marker). Forward-only adoption: v3 audits scoring this pattern stay PASS; v4+ audits score FAIL.

### §A41-5 — "Reading-dependent" verdict (structurally distinct from forbidden "borderline")

A "reading-dependent" verdict is structurally distinct from forbidden "borderline" partial-credit IF AND ONLY IF:

1. **(a)** the audit explicitly commits to one reading for the headline verdict (default: charitable reading per A24 §4.4 Notes precedent);
2. **(b)** the audit documents the alternative reading + alternative verdict in §Notes with explicit reasoning;
3. **(c)** the audit logs the rubric ambiguity as a §9 backlog intake for future methodology resolution.

All three conditions must hold; missing any = the verdict is forbidden borderline (not reading-dependent) and must be resolved binary.

**Audit report structural requirement:** all v4+ Covenant audit reports MUST include a `§9 Rubric Ambiguities Surfaced` section (or equivalent named "ambiguity intake" section) — this is a Compliance Checklist requirement for the audit-report template, not just a convention. Pre-v4 reports (oc-1-1, A24, A39) are grandfathered (all three already have §9 by convention).

- **Example compliant:** A39 §3 footnote ² (R7 reading-dependent) — meets (a) headline commits to charitable PASS per A24 precedent; (b) §4.5 Notes documents strict reading with FAIL alternative; (c) §9 ambiguity #1 logs the compound-counting question.

### §A41-6 — A10 cell composition rule (forward-only)

**v4+ A10 cell composition rule:** the 3-cell minimum must include:
1. **One expected-PASS that is reading-dependent or borderline** (NOT a stable-PASS cell).
2. **One expected-FAIL.**
3. **One borderline cell.**

Stable-PASS cells inflate agreement chance artificially and reduce gate informativeness. v3 audits that selected stable-PASS for the expected-PASS slot (e.g., A39 §7.1 Cell 2 Lens R7) are grandfathered, but v4+ refresh must adopt the borderline-required rule.

**Escape clause:** if no reading-dependent or borderline cell exists in the audited matrix (e.g., a high-quality team where every cell is binary-clear), the auditor selects the closest-to-borderline expected-PASS cell + logs an A10 selection caveat in §7.1 Notes naming the absence of borderline cells as the reason. The gate still runs; informativeness is reduced but not blocked.

- **Example:** A39 §7.1 selected Lens R7 as expected-PASS; reviewer agreement on Cell 2 was structurally guaranteed by selection bias. v4+ refresh of Gyre would select Atlas R7 (charitable PASS / strict FAIL) as expected-PASS to maximize informativeness.

### §A41-7 — Implicit-wait + downstream-explicit-wait composition rule (clarifies OC-R5)

Composition is valid ONLY IF downstream wait CONSUMES upstream prompt's response, where **consumes = wait halts on operator's specific response + branches workflow**. A wait that fires unconditionally regardless of the upstream prompt's response is NOT a consumption — the upstream prompt is dangling and triggers prompt-without-wait FAIL on the upstream prompt itself.

- **Example FAIL:** A39 §4.4 Coach R5 (overturned in R2) — `step-01-load-context.md:60` deferred-review prompt + `:77` §5 wait. The §5 wait fires unconditionally regardless of the operator's yes/no answer to the §4 prompt; §5 does NOT consume the §4 response → no composition → §4 is dangling prompt-without-wait → R5 FAIL.

### §A41-8 — A28 Step Selection v2 (forward-only; ≥2 steps default for Production-readiness archetypes)

For system-loading step-01 surfaces (Production-readiness workflows: Gyre confirmed; Forge + Helm to be classified at first audit), single-step rationale is methodologically weaker; **≥2 steps default-required** unless operator opts into single-step for cross-audit comparability with prior single-step audit AND documents the archetype-distinction note in the audit's §1 Scope section. Discovery workflows (operator-input-driven step-01 — Vortex confirmed) retain A28 v1 single-step-with-rationale acceptance.

- **Baseline exception:** A39 used step-01-only with cross-audit-comparability rationale (matches A24's step-01 scoping). A39 is **grandfathered** under A28 v1 (pre-A41 methodology); v4+ Gyre refresh adopts A28 v2 (≥2 steps default).

### §A41-9 — Portfolio audit definition + cross-cutting exclusion

A **portfolio audit** = a Covenant audit covering ≥1 team, with the team scope explicitly named in the audit report frontmatter or §1 scope section. Examples: A24 = Vortex portfolio audit (1 team); A39 = Gyre portfolio audit (1 team).

**Cross-cutting vs team-scoped identification rule:**
- An audit is **cross-cutting** if its frontmatter `scope` field lists ≥2 teams without team-by-team result tables (e.g., oc-1-1's matrix groups 8 skills across 4 archetypes without partitioning by team).
- An audit is **team-scoped** if its §5 row table groups verdicts under exactly one team header (e.g., A24 §5 row "Vortex N=4"; A39 §5 row "Gyre N=4").

**Cross-cutting audits are excluded from portfolio-count for Publication Gate evidence breadth** even if they cover ≥2 teams (per A40 Round 2 review BH-finding: counting cross-cutting trivially satisfies ≥2 portfolios + defeats the breadth-evidence purpose).

**Note:** oc-1-1 supplies methodology source-of-truth (rubric definitions §2.3/§2.4/§2.6) but does NOT count toward Publication Gate's ≥2 portfolio-audit threshold — two distinct uses.

### §A41-10 — COI Mitigation Tiers (graduated; Publication Gate eligibility)

*(Note: §A41-7 also clarifies OC-R5, in addition to §A41-4. The two are independent: §A41-4 governs strictness threshold (literal vs lenient halt-marker requirement); §A41-7 governs compositional reasoning across upstream/downstream prompts. Both apply concurrently per R1 review BH-M2.)*

Convoke audits acknowledge two structural COI vectors: (i) auditor-side methodology-frame COI (auditor authored the spec OR rubric); (ii) operator-author COI (operator authored content being audited). Mitigation tiers (graduated):

- **Tier-0 (disclosure-only):** Auditor names operator-author overlap + methodology-frame overlap in §COI Disclosure. **Acceptable for internal-evidence use; NOT acceptable as Publication Gate clearance evidence.**
- **Tier-1 (auditor-side blind sub-reviewers):** A10 reproducibility pass with ≥2 blind LLM sub-reviewers, gate-clearing outcome (100% pairwise agreement at N≥3). **Acceptable for Publication Gate IF gate clears; NOT acceptable if gate fails** (A39 case — Tier-1-attempted-but-failed).
- **Tier-2 (external review):** Independent reviewer re-scores ≥3 cells with verdict-comparison. **Any ONE of the following options satisfies Tier-2:** (1) a different LLM model family (e.g., GPT-4 / Gemini / open-source) with ≥3-cell re-score; OR (2) a human peer reviewer with ≥3-cell re-score; OR (3) an adversarial peer-review from a non-Convoke practitioner of operator-experience design (e.g., from a separate project applying the Operator Covenant pattern) with ≥3-cell re-score. The "≥3 cells with verdict-comparison" requirement applies to whichever option is selected. **Acceptable for Publication Gate clearance regardless of A10 outcome** (A10 failure is informative methodology data, not blocking).

**Path forward for v3 audits in provisional limbo (e.g., A39):** Tier-2 OR a v4+ refresh that achieves Tier-1 clearance under the A41-clarified rubric.

### §A41-11 — Cascade termination (clarifies retrofit lifecycle)

*(Added per R1 review BH-H4 + EC-H4 — Story 2.1 AC #4 originally cited "§A41-9" for cascade termination but §A41-9 is portfolio audit definition; the rule was authored in spec AC2 item 5 but never codified into a §A41-N subsection. Fixed here.)*

The retrofit cycle (Story 2.1) ends when **no new T1-firing cells are introduced by the most recent retrofit**. Mechanically evaluable: after each retrofit batch, re-evaluate the audit matrix; if zero new (team × Right) cell-rows transition from PASS to T1-firing, the cycle terminates. Finite per audit matrix (worst case = N×7 cells per team; bounded).

- **Example:** A39 R1-G1 (Scout multi-service) retrofit ships → re-audit Gyre matrix → no new T1-firing cells → cascade terminates for that retrofit. If R1-G1's fix accidentally flipped Coach R3 from PASS → FAIL (per-cell regression baseline per §A41-3 cascade-resolution clause), the cycle continues with an R3-G1 retrofit until cascade terminates.
- **Cross-reference:** Epic Story 2.1 AC #4 (per-cell regression baseline) + AC #5 (cascade-clearance for Publication Gate).

### §A41-12 — A29 single-skill exemption (clarifies §Skill Selection)

*(Added per R1 review AA-FIND-1 — A29 single-skill exemption was authored in spec AC2 item 6 but silently dropped during execution; no §A41-N covered it. Fixed here.)*

A portfolio audit may have **N=1** (single skill) if AND ONLY IF:

1. **(a)** the team has only 1 operator-facing surface (the single skill IS the team's complete operator-visible interaction surface), OR
2. **(b)** the audit is explicitly scoped as a **calibration-case audit** (oc-1-1 Migration/Portfolio pattern — auditing a known-violating skill to validate methodology, not to evaluate the team).

Otherwise, **N≥3 floor applies** per A29 + §A41-3 N_effective rule (whichever is more restrictive).

- **Example (a):** a hypothetical future BMAD-extension team with only one operator-facing workflow (e.g., a single-skill team) qualifies for N=1 audit; verdicts apply only to that skill.
- **Example (b):** oc-1-1 Migration audit (calibration case) — N=1 acceptable because methodology validation is the purpose, not Migration's compliance.
- **Cross-reference:** §A41-9 (portfolio audit definition); §A41-3 (N_effective semantics — applies AFTER A29 exemption check).
- **Note vs §A41-9 cross-cutting exclusion:** the calibration-case exemption (b) is ALSO an exclusion from Publication Gate's ≥2-portfolio-audit count — calibration audits don't count toward breadth-evidence even if they have N=1 acceptable for methodology purposes. Two distinct uses.

### §A41-13 — Cell-mechanism naming stability across version cutover (clarifies cell-centric retrofit semantics; extension of PAD 1)

*(Added per R1 review BH-H3 + M7 — A39's R1-G1, R1-G2, R5-G1, R5-G2 cell-mechanism names referenced in Epic Story 2.1 ACs as load-bearing identifiers, but their T1-firing status changes between v3 (locked at N_total) and v4+ (re-evaluated under N_effective). Stability clarification needed. **PAD authority:** §A41-13 extends PAD 1 (cell-vs-right semantic) — it operationalizes the naming-stability semantics implicit in cell-centric framing. Per R2 review, explicitly tagged as PAD-1 extension rather than promoted to a 14th PAD.)*

**Cell-mechanism names (e.g., R1-G1 = Scout multi-service mechanism; R5-G1 = Coach §4 dangling-prompt mechanism) are stable across methodology versions** as referents to specific operator-decision-branch mechanisms. They name the WHERE (which surface in which workflow), not the WHAT-VERDICT (PASS/FAIL/T1-firing).

**T1-firing status of a named cell-mechanism is version-pinned** — may differ between v3-locked evaluation and v4+ refresh evaluation. Example: A39 R1-G1 fires T1 under v3 (N_total = 4, fail_rate = 50%); under v4+ refresh of Gyre with N_effective = 2 < 3 floor, R1-G1's containing cell-row would have T1 evaluation **deferred** (not "PASS", not "FAIL" — deferred per §A41-3). The mechanism still EXISTS at `step-01-scan-filesystem.md:122-135`; the rubric verdict for its containing cell-row is what changes.

- **Implication for Epic Story 2.1 retrofit scope:** R1-G1, R1-G2, R5-G1, R5-G2 retrofit identities are stable; their inclusion in Story 2.1's retrofit-scope list is version-pinned to A39's v3 evaluation. A v4+ Gyre refresh would produce its own retrofit-scope list under v4 N_effective evaluation. The two scopes may overlap (likely will, since the underlying mechanisms persist) but are distinct artifacts.

---

## Revisions

Every revision records the change type so downstream consumers can detect rubric-version drift.

**Allowed change types:** `initial-authoring`, `rule-add`, `rule-remove`, `rule-renumber`, `rule-content-edit`, `glossary-edit`, `scope-rule-edit`, `structural-rewrite`.

| Date | Change Type | Change | Source |
|------|-------------|--------|--------|
| 2026-04-18 | initial-authoring | 7 rules derived from party mode baseline (2026-04-18); confirmed by Story 1.1 audit (no additions/removals of rights). | oc-1-3 Round 1 |
| 2026-04-18 | structural-rewrite | Round 2 code review addressed 4 HIGH + 6 MEDIUM + 2 LOW findings: inlined novel-concept glossary (HF1), added N/A taxonomy + parser grammar (HF2), added 3-layer scope + worst-case aggregation (HF3), added stable slugs (HF4), tightened rule wording (MF1-MF5), added doc-applicability mapping for Story 1.4 (MF6), revisions table gained change-type column (LF2). | oc-1-3 Round 2 |
| 2026-04-18 | rule-add + rule-content-edit + glossary-edit | Round 3 code review addressed 4 HIGH + 2 MEDIUM patchable findings: added OC-R0 row to main table (H3 — makes the precondition enforceable), added `DEPRECATED` as 5th allowed Compliance Status value + regex (H2), fixed OC-R5 doc-mapping trailing period (H1), tightened OC-R5 marker (iii) wording to require a literal halt statement on a line following the menu (H4), scoped em-dash normalization to the separator position only (M5), acknowledged glossary drift from audit §2.6 (M3 — 4th bucket "Mental-model framings" and "Covenant" example are Round 2 extensions, kept intentionally; lockstep discipline noted). | oc-1-3 Round 3 |
| 2026-04-18 | note | Round 3 DEFERRED findings (per no-R4 convergence rule): H5 (OC-R7 concept counting ambiguity persists even with inline glossary — methodology-level, flagged in audit §9.3), H6 (OC-R7 doc mapping double-counts in Paige's 4-part format → Covenant self-compliance gate may fail by construction; Story 1.4 pre-requisite), M1 (workflow-inherited concepts uni-directional), M2 (conditional-surface skills don't fit 2-N/A taxonomy), M4 (Layer 3 uncontrollable stderr locks skill to permanent FAIL on OC-R6). Triaged via `bmad-enhance-initiatives-backlog`. | oc-1-3 Round 3 |
| 2026-04-18 | rule-content-edit | **A12 shipped** — OC-R7 doc-mapping fix. Rule now uses cumulative vocabulary (concepts introduced in earlier Covenant sections are pre-existing for later sections) and clarifies that good-example and anti-pattern illustrations don't count as novel if they illustrate an already-introduced concept. *Narrows* the OC-R7 doc-mapping failure surface (closes 4-part double-counting). Story 1.4 Section 1 passability depends additionally on the preamble authoring contract — see "Covenant preamble authoring contract" note below the doc-mapping table. | A12 (backlog) |
| 2026-04-18 | rule-content-edit | **A12 follow-up patch** — Round 1 code review of A12 surfaced 3 HIGH findings. Applied inline: (P1) softened Revisions A12-shipped claim to "narrows surface" rather than "unblocks gate"; (P2) added Covenant preamble authoring contract requiring preamble to pre-introduce 9 foundational terms so Section 1 can pass; (P3) closed illustration loophole — new domain nouns introduced INSIDE illustrations still count toward the budget. | A12 follow-up (Round 1 A12 review) |
| 2026-04-18 | scope-rule-edit | **A10 shipped** — Reproducibility gate for multi-skill Covenant audits formalized as a new top-level section. v1 audit ran a 1-cell gate and flagged the single-cell sample as a methodology weakness (see v1 §2.5). v2+ audits MUST cover ≥3 cells spanning expected-PASS + expected-FAIL + borderline, with blind dual-reviewer verdicts and ≥80% agreement threshold. Adds a pre-gate verdict expectation discipline (auditor records predictions before blind review, enabling calibration signal separate from reviewer concurrence). Single-skill audits and Story 1.4 self-compliance on the Covenant document are exempt. | A10 (backlog) |
| 2026-04-18 | rule-content-edit | **A15 + A10 Round 2 follow-up patches** — Round 2 code review of the Round 1 patches surfaced 3 HIGH + 7 MEDIUM + 3 LOW new findings; 13 patches applied inline, 4 deferred. A15 patches: (RP2) OC-R0 row now specifies `(internal)/(external)` qualifier per Layer 3 entry — precondition visible at point-of-entry, not only in the OC-R6 value row; (RP6) evidence-note template explicitly AUGMENTS existing §§3.x / §§8.x conventions (doesn't replace); (RP7) template slots now require concrete evidence refs, not bare "L1 PASS" declarations; (RP9) two-step validation requirement relocated from OC-R6 value row to Parser grammar § with a justification guard against future regex-folding; (RP10) tiebreaker added for both-apply case — `out-of-scope` takes precedence when a skill is both headless and wraps an external CLI. A10 patches: (RP3) added fourth failure-mode path (d) shrink audit scope when the rubric itself can't fix the ambiguity; (RP4) explicit five-step audit sequence resolves the circularity between "headline findings" and "borderline selection"; (RP5) path (b) DISPUTED-exclusion now explicitly re-applies the threshold to the post-exclusion N; (RP8) gate size fixed at cell-selection time — post-hoc N-inflation to escape binary-rule failure at N=3/4 is FORBIDDEN; (RP11) three-way reviewer-disagreement explicitly counted as 0% agreement + separate misprediction flag; (RP13) headline-findings definition de-duped (§7 + §7.1 + §7.2 → §7 and its subsections) with a note that section numbers are illustrative. Audit-report patches: (RP1) §10.5 blanket non-applicability claim corrected — Migration and Portfolio DO wrap git via `execFileSync`, retroactive per-cell re-analysis is deferred; (RP12) "grandfathered" defined — v1 rate citeable as internal retrofit evidence, but Story 2.3 Publication SHOULD NOT treat v1 percentages as binding under A10/A15. | A15+A5+A10 follow-up (Round 2 review) |
| 2026-04-18 | rule-content-edit | **A15 + A10 follow-up patches** — Round 1 code review of A15+A5+A10 surfaced 5 HIGH + 9 MEDIUM + 2 LOW findings; 9 patches applied inline, 6 deferred to `deferred-work.md`. A15 patches: (P1) added required evidence-note template `Layers: L1 PASS, L2 PASS, L3 external-declared (<tool>)` so carve-out preconditions are first-class data rather than prose archaeology; (P6) added parser-enforcement note requiring two-step validation (regex + rule-ID check) to reject `external-declared` on any rule other than OC-R6; (P7) added disambiguation rule vs `out-of-scope` (external-declared when L1+L2 are operator-facing and only L3 is non-owned). A10 patches: (P2) reworked threshold to be coherent — zero disagreements at N=3-4, ≥80% at N≥5 — and failure-mode clarified to aggregate semantics with a three-path remediation (rubric revise, DISPUTED exclusion, methodology-invalid); (P3) borderline hardness test — auditor MUST pick the borderline whose opposite verdict most materially changes headline findings; (P4) "headline findings" defined as §1 + §7 + §7.1 + §7.2 of audit template; (P5) pre-gate misprediction explicitly excluded from threshold arithmetic (separate calibration signal). Audit-report patches: (P8) §10.5 added noting A10 + A15 post-audit extensions and A15 non-applicability to v1 cells; (P9) §10.2 limitation 2 now carries an A10 forward-ref parallel to §2.5. | A15+A5+A10 follow-up (Round 1 review) |
| 2026-04-18 | rule-content-edit | **A15 shipped** — OC-R6 external-declared escape hatch. Added sixth Compliance Status value `N/A — external-declared (<tool>)`, applicable to OC-R6 only, for skills wrapping externally-owned CLIs (git, npm, docker, ...) whose stderr the skill cannot rewrite. Worst-case aggregation §gains an OC-R6 carve-out: Layer 3 excluded from aggregation when the declaration is used, with mandatory evidence-note preconditions (tool named, OC-R0 enumeration, L1+L2 independently PASS OC-R6). If L1 or L2 would FAIL, the cell is FAIL regardless — the carve-out does not mask skill-authored violations. Extends regex parser grammar and em-dash normalization anchor pattern. "No partial credit" note updated to reference three N/A variants. | A15 (backlog) |
| 2026-04-20 | structural-rewrite + scope-rule-edit | **A28 + A29 shipped as a bundle** — former `## Reproducibility gate (multi-skill audits)` section promoted to `## Selection Discipline` parent with three subsections reflecting three orthogonal selection layers: §Skill Selection (A29, new), §Step Selection (A28, new), §Cell Selection (A10 content preserved verbatim under new header). A29 requires auditors to declare structural dimensions + classify each picked skill + declare selection intent (independent verification vs pattern verification) upfront; pattern-verification audits MUST label findings accordingly in their Executive Summary; mixed audits (pattern cluster + independent variation) must label which cells contribute to which claim. A28 requires ≥2 steps per picked skill OR documented single-step scoping rationale. Rationale (Winston consultation 2026-04-20): A24 (Vortex audit expansion, shipped 2026-04-19) was correctly motivated as a mixed audit — picks 1 and 3 (assumption-mapping + hypothesis-engineering) formed a pattern-verification cluster for the HC-contract-at-step-01 pattern; pick 2 (empathy-map, has template+validate scaffolding) provided the independent structural variation. A29 formalizes the vocabulary A24 exercised informally. Forward-only: A24's framing updated in Epic 2 Story 2.1 with explicit retroactive classification note; retrofit scope unchanged. Round 1 adversarial review caught 2 HIGH findings on the initial A24 re-labeling (mis-identified twins as picks 2+3 and flattened the mixed audit to pure pattern-verification); corrected by reading the A24 report directly before shipping. | A28 + A29 (backlog) |
| 2026-04-20 | rule-content-edit | **A33 shipped** — §2.6 "Workflow-inherited concepts" extended to cover `workflow.md`. Four new paragraphs appended after the existing `step-t-02` example: (1) **Workflow.md as "earlier step"** — concepts introduced in `workflow.md` (§2.4 Layer 1) count as pre-existing for all step files within the same workflow; (2) **Scope: operator-visible only** — inheritance applies to operator-visible workflow.md content only, consistent with §"Operator-facing vs agent-facing text"; concepts in `MANDATORY EXECUTION RULES` / `YOUR ROLE:` agent-facing blocks are neither counted at Layer 1 nor inherited; (3) **Inheritance unconditional w.r.t. Layer 1 verdict** — even if workflow.md's own Layer 1 OC-R7 is FAIL, its operator-visible concepts are still pre-existing for step cells (§2.4 worst-case aggregation captures composition at skill level); (4) **Anti-escape-hatch clause** — the rule governs *re-introduction* not total budget; workflow.md's operator-visible content must still pass OC-R7 at Layer 1 under existing §2.6 rules, no new threshold introduced. Resolves §9 ambiguity #5 from the 2026-04-19 Vortex audit. Broader reading codified from natural reviewer behavior during the A24 A10 reproducibility gate (§7.1). Winston consultation 2026-04-20 rejected Option B (narrower reading). Round 1 adversarial review surfaced 2 intent-gap decisions (MANDATORY EXECUTION RULES scope; inheritance from a FAILing workflow.md) both pre-flagged as Ask-First in the shipping spec — operator resolved inline: scope = operator-visible only; inheritance = unconditional. 2 bad_spec findings also patched ("within the same workflow" qualifier restored; anti-escape-hatch clause grounded in existing §2.6 rules rather than implying a new threshold). | A33 (backlog) |
| 2026-04-25 | structural-rewrite + scope-rule-edit + rule-add | **A41+A42 shipped (bundled) — methodology version cutover v3 → v4.** New `## A41-Clarifications` H2 section authored with 13 sub-subsections (§A41-1 through §A41-13) covering: §A41-1 R1 enumerated-options menus (strict per Loom precedent); §A41-2 multi-field contract counting hybrid rule (≤3 sub-fields = 1 compound, ≥4 = N concepts); §A41-3 vacuous-PASS N_effective semantics (excluded from Publication Gate breadth; T1 evaluation deferred if N_effective < 3); §A41-4 OC-R5 strictness convergence (forward-only — v4+ literal halt marker, pre-v4 lenient implicit-wait grandfathered per A24 §8.7); §A41-5 reading-dependent vs borderline distinction (structurally distinct IFF (a) headline commits, (b) §Notes documents alternative, (c) §9 ambiguity logged; v4+ audit reports must include §9 Rubric Ambiguities Surfaced section); §A41-6 A10 cell composition rule (expected-PASS must be reading-dependent or borderline, not stable-PASS; escape clause for matrices without borderline cells); §A41-7 implicit-wait + downstream-explicit-wait composition (valid only if downstream wait CONSUMES upstream prompt's response; Coach R5 dangling-prompt example); §A41-8 A28 v2 step selection (≥2 steps default for Production-readiness archetypes; A39 grandfathered under A28 v1); §A41-9 portfolio audit definition + cross-cutting exclusion (cross-cutting `convoke` portfolio excluded from ≥2-portfolio-audit threshold); §A41-10 COI Mitigation Tier Taxonomy (Tier-0 disclosure-only / Tier-1 blind-sub-reviewers / Tier-2 external-review with three OR-options); §A41-11 cascade termination (no new T1-firing cells introduced by most recent retrofit); §A41-12 A29 single-skill exemption (N=1 acceptable for single-surface teams or calibration-case audits); §A41-13 cell-mechanism naming stability across version cutover (mechanism names are stable referents; T1-firing status is version-pinned). Plus Version-pinning algorithm preamble (v3 = pre-A41 era; v4 = post-A41 era; per-audit pin via `created` date; mid-execution version bumps stay locked). 16-surface-point Epic refactor from skill-centric/right-centric to cell-centric retrofit semantics shipped in same patch. Forward-only application: pre-v4 audits (oc-1-1, A24, A39) stay locked under G4 mitigation gate; v4+ audits use these clarifications. Pre-execution review: V-pass (1 layer, 11 patches) + 3-layer adversarial review (BH+EC+AA, 13 HIGH + 12 MED + 5 LOW after dedup; ~22 patches applied + 2 new PADs added — PAD 12 COI tier taxonomy, PAD 13 A28 v2 — to authorize previously un-PAD'd methodology rules). Post-execution review: 3-layer R1 (BH+EC+AA, ~12 HIGH + ~12 MED + ~10 LOW after dedup; ~25 R1 patches applied including this §Revisions row, §A41-11 cascade termination, §A41-12 A29 single-skill exemption, §A41-13 cell-mechanism stability — plus heading rename, §A41-7+§A41-4 relationship note, example fixes for §A41-2/§A41-3/§A41-4, AC7 A39 NO CHANGE revert, Story 2.3 FR17 verbatim alignment, NFR8 TOC framing, sibling-pointer G4 definition links). | A41+A42 (backlog) |

**Version discipline:** Schema_version in frontmatter is tied to structural breaking changes only (e.g., new required column added to the rules table). Content edits to existing rules go in Revisions without bumping schema_version.
