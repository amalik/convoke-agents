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

## Reproducibility gate (multi-skill audits)

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

**Version discipline:** Schema_version in frontmatter is tied to structural breaking changes only (e.g., new required column added to the rules table). Content edits to existing rules go in Revisions without bumping schema_version.
