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
| OC-R0 | Has the auditor enumerated the full 3-layer interaction surface (workflow.md + all step files + all invoked scripts/CLIs) before answering any OC-R1...OC-R7? The enumeration must be recorded in evidence notes (e.g., `Surface: workflow.md + 5 step files + scripts/foo.js`). This is a mandatory precondition — cells answered against an incompletely-enumerated surface are invalid. | |
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

Fill each Compliance Status cell with one of **five** enumerated values (strict; no free-form variants accepted):

| Value | Meaning |
|-------|---------|
| `PASS` | Evidence from the skill's interaction surface satisfies the rule's question with an affirmative answer. |
| `FAIL` | Evidence from the skill's interaction surface violates the rule — even once. |
| `N/A — vacuous (<reason>)` | The rule's question has no applicable surface in this skill by design. Example: `N/A — vacuous (skill is pure automation, no operator prompts)`. Vacuous ≠ PASS by default — only grant `N/A — vacuous` if the surface genuinely doesn't exist; otherwise answer PASS or FAIL. |
| `N/A — out-of-scope (<reason>)` | The entire skill is declared out-of-scope for this audit (e.g., headless automation, non-operator-facing build tool). Typically applied at skill level once; all 7 rules then get the same `out-of-scope` answer. |
| `DEPRECATED (<covenant-revision>)` | The rule was removed from the Covenant in the cited revision. The row is retained for rule-ID stability. Audits after the revision treat the cell as a non-finding (neither PASS nor FAIL). Example: `DEPRECATED (2026-07-01)`. |

### Parser grammar (for Story 2.2 Loom gate)

The Loom validator parses each Compliance Status cell against this regex:

```
^(PASS|FAIL|DEPRECATED \(.+\)|N/A — (vacuous|out-of-scope) \(.+\))$
```

Normalization rules:
- Em-dash (`—`, U+2014) is canonical **as the separator between a leading-token (`N/A` or equivalent) and the qualifier**. Parsers MUST accept `--` (double hyphen-minus) and `-` (single hyphen) as equivalents in that separator position only, coercing to em-dash before regex validation. Hyphens WITHIN the reason text (inside the parentheses) are NOT coerced — e.g., `N/A — out-of-scope (build-tool wrapper)` preserves the hyphens in "build-tool". Implementations anchor the coercion on the pattern `^(N/A) (—|--|-) (vacuous|out-of-scope) \(`.
- Pipe characters (`|`) in cell content MUST be escaped as `&#124;` to preserve table structure.
- Blank cells = FAIL (incomplete audit); parsers MUST emit a warning and treat as FAIL.
- Leading/trailing whitespace is stripped before validation.
- **No trailing punctuation.** Do NOT append a period, semicolon, or other punctuation after the closing `)` — `N/A — vacuous (reason).` fails the regex because `.` falls outside the capture group. If a closing-sentence feel is desired, end the reason text with a period inside the parens: `N/A — vacuous (no operator surface.)`.

### No partial credit

Strict binary + two N/A variants. No severity, no weighting, no "borderline". Nuance belongs in evidence notes alongside the Checklist, not in the Compliance Status cell.

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

**Version discipline:** Schema_version in frontmatter is tied to structural breaking changes only (e.g., new required column added to the rules table). Content edits to existing rules go in Revisions without bumping schema_version.
