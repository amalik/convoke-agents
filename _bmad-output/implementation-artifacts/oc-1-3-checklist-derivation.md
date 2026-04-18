# Story 1.3: Derive Covenant Compliance Checklist

Status: done

## Story

As a Convoke reviewer auditing a new or existing skill,
I want a tabular Checklist derived from the 7 Operator Rights with one testable yes/no question per right,
so that I can evaluate skill compliance quickly and consistently, the format is machine-readable enough to serve as a future Loom validation gate input, and the Checklist serves as the self-compliance gate for the Covenant authored in Story 1.4.

## Acceptance Criteria

1. Checklist contains one row per right (7 rows — count confirmed by Story 1.1 audit, no additions/removals required) with ≤ 3 columns: (1) rule ID (stable: `OC-R1` through `OC-R7` in baseline order from the party mode session 2026-04-18), (2) testable question in yes/no form, (3) compliance-status column left unfilled for use during audits.
2. Rule IDs are stable and unique within the Checklist; columns are ≤ 3 (UX-DR5); the structure is a simple markdown table parseable via standard markdown parsers without custom tooling (NFR6) — a future Loom validator can extract (rule ID, question, status) columns programmatically.
3. File saved at `_bmad-output/planning-artifacts/convoke-spec-covenant-compliance-checklist.md` with governance frontmatter (`initiative: convoke`, `artifact_type: spec`, `created: YYYY-MM-DD`, `schema_version: 1`).

## Tasks / Subtasks

- [x] Task 1: Confirm rights count from Story 1.1 audit (AC: #1) — confirmed: 7 rights, audit did NOT propose additions/removals. Canonical order from party mode 2026-04-18 preserved.
- [x] Task 2: Draft yes/no question per right (AC: #1, #2) — 7 yes/no questions drafted, each mapped to a specific PASS criterion from oc-1-1 audit report §2.4. All questions pass the "genuinely yes/no" test (no "to what extent" phrasing).
- [x] Task 3: Format as markdown table (AC: #2) — 3 columns (Rule ID | Question | Compliance Status). Rule IDs `OC-R1` through `OC-R7`. Compliance Status left empty. Standard markdown pipe-separated syntax.
- [x] Task 4: Add usage notes — separate "Applying this Checklist" section with auditor instructions; "N/A requires justification" rule; worst-case combined verdict rule; references to Covenant + audit report.
- [x] Task 5: Save with governance frontmatter (AC: #3) — file saved at `_bmad-output/planning-artifacts/convoke-spec-covenant-compliance-checklist.md` with all 4 required frontmatter fields. `convoke-doctor` passes: 25/25 checks, all 6 taxonomy checks green.

## Dev Notes

### Context

The 7 Operator Rights are the canonical baseline from the party mode session (2026-04-18). Story 1.1 audited them against 8 skills; the audit did NOT propose adding or removing rights — final count is 7, unchanged from baseline.

Rights in canonical order (per party mode session output):

1. **Right to a default** — never receive "unknown" without a proposed fallback
2. **Right to the full universe** — see scope before filtering
3. **Right to rationale** — every decision point explains why it matters
4. **Right to completeness** — nothing silently dropped; exclusions named and justified
5. **Right to pause** — workflows WAIT at every decision point
6. **Right to next action** — errors tell you what to do, not just what broke
7. **Right to pacing** — max 3 new concepts per interaction round

### Downstream consumers

- **Story 1.4 (Covenant self-validation):** the Covenant draft will be evaluated against this Checklist before close — self-compliance gate per FR14.
- **Story 2.2 (Loom gate, deferred):** the Checklist becomes input to a future Loom Add Skill validation gate. Structure must be machine-parseable.
- **Future audits (v2+):** the Checklist is the stable instrument; re-audits use the same questions against evolving skills.

### Rubric mapping

The yes/no questions are derived from Story 1.1's §2.4 audit rubric (PASS/FAIL criteria). Each question codifies the PASS criterion as a yes-equals-compliant question. Example mapping:

- Rubric (§2.4): "Right to a default — PASS when every unresolvable branch proposes a default." → Question: "Does the skill propose a default fallback whenever it encounters unresolvable state?"

### Anti-patterns to AVOID

- ❌ Do NOT add severity or weighting columns — §2.3 binary rubric. Yes/No only.
- ❌ Do NOT use numbered R1-R7 in evidence notes (AC #2 of oc-1-1). Rule IDs `OC-R1...OC-R7` are acceptable since they're stable identifiers, not the right's name.
- ❌ Do NOT pack multiple questions into one row (one yes/no per right).
- ❌ Do NOT add a "Not Applicable" column to the table — N/A is handled per-audit in the Compliance Status cell (e.g., "N/A — skill has no filter operation").

### Namespace decision

**Artifact:** `convoke-spec-covenant-compliance-checklist.md`. Lives in `_bmad-output/planning-artifacts/`. Type: `spec` (testable rules for skill compliance — aligns with existing `spec` usage like `convoke-spec-baseartifact-contract.md`). NOT `covenant` type — that's reserved for the Covenant itself (Story 1.4 authors the one canonical covenant artifact).

### References

- [Source: _bmad-output/planning-artifacts/convoke-epic-operator-covenant.md#Story-1.3] — epic-level story definition
- [Source: _bmad-output/planning-artifacts/convoke-report-operator-covenant-audit-2026-04-18.md#2.4] — rubric each question is derived from
- [Source: _bmad/_config/taxonomy.yaml] — `spec` type confirmed available

## Dev Agent Record

### Agent Model Used

claude-opus-4-7 (1M context) via bmad-dev-story — 2026-04-18.

### Debug Log References

- Story file authored directly (create-story had not run for oc-1-3; ACs were already defined in epic file, scope small enough to warrant direct authoring).
- Sprint status: backlog → in-progress → review.
- `convoke-doctor` verified: 25/25 checks passed, all 6 taxonomy checks green. 2 pre-existing unrelated issues (not caused by this story).

### Completion Notes List

**What was produced:**

- `_bmad-output/planning-artifacts/convoke-spec-covenant-compliance-checklist.md` — the Checklist deliverable

**Structure:**

- Frontmatter: `initiative: convoke`, `artifact_type: spec`, `created: 2026-04-18`, `schema_version: 1`
- Primary artifact: 3-column markdown table with 7 rows (one per right)
- Supporting sections: canonical right-name mapping (OC-R1 → Right to a default, etc.), usage instructions, revisions table

**Key decisions:**

1. **Rule IDs are stable, not ordinal.** If the Covenant renumbers rights, the Checklist does NOT renumber OC-R1 through OC-R7. The revision table tracks identity over time.
2. **Rights referenced by name in all prose; rule IDs used only in the stable-identifier table.** Preserves AC #2 of oc-1-1 (rights by name not number) while allowing a machine-parseable stable identifier.
3. **3-column strict binary** enforced — no severity, no weighting, no "partial" cells. `N/A` permitted only with explicit justification (otherwise = FAIL).
4. **Evidence notes live outside the table** (in the audit report that consumes the Checklist), not in the Compliance Status cell itself. Keeps the table clean and machine-parseable.

**AC verification summary:**

- **AC #1** (one row per right, count = 7, ≤3 columns, rule IDs, compliance-status column empty): PASS — table has exactly 7 rows, 3 columns, `OC-R1` through `OC-R7` in canonical order.
- **AC #2** (stable/unique rule IDs, ≤3 cols, markdown-parseable, machine-extractable): PASS — standard pipe-separated table; rule IDs stable per revisions section.
- **AC #3** (file at correct path with governance frontmatter): PASS — path and frontmatter verified; `convoke-doctor` green.

**Downstream readiness:**

- Story 1.4 (Covenant authoring) can consume this Checklist for self-compliance gate (FR14). The Covenant and Checklist should reference each other cleanly.
- Story 2.2 (Loom gate, deferred) can parse this table programmatically — 3 columns, standard markdown, stable rule IDs.

### File List

Created:
- `_bmad-output/planning-artifacts/convoke-spec-covenant-compliance-checklist.md`
- `_bmad-output/implementation-artifacts/oc-1-3-checklist-derivation.md` (this story file)

Modified:
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (status transitions)

### Change Log

- 2026-04-18: Story authored, deliverable produced, doctor verified. Status: backlog → in-progress → review.
- 2026-04-18: Round 1 code review produced 4 HIGH + 6 MEDIUM + 2 LOW findings (Acceptance Auditor: no AC violations — Blind Hunter and Edge Case Hunter surfaced structural gaps in the Checklist as an operational tool). Round 2 rewrite applied: inlined §2.6 novel-concept glossary, added N/A taxonomy + parser grammar, added 3-layer scope rule with worst-case aggregation, added stable slugs to canonical-name mapping, tightened all 7 rule questions (OC-R3 100% threshold, OC-R4 split compound predicate, OC-R5 enumerated halt markers, OC-R6 3-layer scope for errors, OC-R7 inline glossary + interaction-round definition), added document-applicability mapping for Story 1.4 self-compliance gate, Revisions table gained change-type column.

### Round 2 change summary

**HIGH findings addressed:**
- HF1 (OC-R7 glossary circular dep) — inlined §2.6 glossary into Checklist §Novel-Concept Glossary
- HF2 (N/A handling, binary vs ternary) — added 4-value Compliance Status enumeration with two N/A variants; parser regex spec
- HF3 (scope ambiguity: workflow.md vs step files vs scripts) — added 3-layer scope + pre-audit OC-R0 enumeration precondition + worst-case aggregation rule
- HF4 (Rule-ID slug stability) — added stable slug column to canonical-name table; documented rename/add/remove discipline

**MEDIUM findings addressed:**
- MF1 OC-R3 threshold made explicit (100% / any single miss = FAIL)
- MF2 OC-R4 compound predicate split into (a) count + (b) reason-per-class
- MF3 OC-R5 halt-and-wait markers enumerated (3 accepted forms)
- MF4 Machine-readable markers added (`<!-- checklist-rules-start -->` / `-end -->`), pipe-escape rule, em-dash normalization
- MF5 OC-R6 vacuous-N/A taxonomy; retry/restart nuance
- MF6 Document-applicability mapping for Story 1.4 self-compliance gate (7 rules mapped to document-structural questions)

**LOW findings addressed:**
- LF1 OC-R1 phrasing tightened (removed "instead of" redundancy; explicit skip/abort = FAIL)
- LF2 Revisions table gained `change_type` column; enumerated change types documented

Sprint-status stays at `review` pending Amalik's approval of Round 2 content.

### Round 3 change summary (2026-04-18)

Round 3 code review produced 6 HIGH + 5 MEDIUM + 3 LOW findings. Per code-review-convergence rule, Round 3 is the final allowed round — unresolved items triaged to backlog.

**Applied inline (4 HIGH + 2 MEDIUM patches):**
- H1 — OC-R5 doc-mapping trailing period fixed (parser regex now passes)
- H2 — `DEPRECATED` added as 5th allowed Compliance Status value + regex extended
- H3 — OC-R0 added as a real row in the main checklist table (precondition now enforceable by Loom parser)
- H4 — OC-R5 marker (iii) tightened: requires literal halt statement on a line following the menu; bare `> question?` blockquote explicitly = FAIL
- M5 — em-dash normalization scoped to separator position only (hyphens in reason text preserved)
- M3 — glossary drift from audit §2.6 acknowledged in Revisions (4th bucket + "Covenant" example retained intentionally as Round 2 extensions)

**Deferred to backlog (no Round 4 permitted):**
- H5 — OC-R7 concept counting ambiguity persists even with inline glossary (methodology-level, overlaps audit §9.3 recommendation for stricter glossary in future audits)
- H6 — OC-R7 doc mapping double-counts in Paige's 4-part format → Covenant self-compliance gate may fail by construction. **Critical for Story 1.4 — MUST be resolved before Story 1.4 runs its self-compliance gate.**
- M1 — workflow-inherited concepts rule uni-directional (edge case)
- M2 — conditional-surface skills don't fit 2-N/A taxonomy (needs `N/A — conditional` variant)
- M4 — Layer 3 uncontrollable stderr (e.g., git/npm) locks OC-R6 to permanent FAIL (needs external-declaration escape hatch)

**AC verification (post-Round-3):**
- AC #1: PASS — 8 rows now (OC-R0 added as precondition + OC-R1…OC-R7). The "7 rows per right" part is preserved; OC-R0 is a precondition, not a right.
- AC #2: PASS — rule IDs stable/unique; columns ≤ 3; parser regex now accepts all 5 Compliance Status values.
- AC #3: PASS — file path and frontmatter unchanged.
- Anti-patterns: preserved.

**⚠️ Pre-requisite for Story 1.4:** before Story 1.4 applies this Checklist to the Covenant draft as the self-compliance gate (FR14), H6 (OC-R7 doc mapping double-count) must be resolved. Story 1.4 Dev Notes should reference this caveat.
