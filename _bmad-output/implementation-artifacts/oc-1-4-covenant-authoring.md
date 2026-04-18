# Story 1.4: Author The Convoke Operator Covenant

Status: review

## Story

As a prospective adopter of Convoke (internal contributor or external evaluator),
I want the Convoke Operator Covenant as a single authoritative document codifying the axiom, Operator Rights, scar stories, and JTBD,
so that I understand what Convoke commits to operators, can trace each right to a real production incident, and can evaluate whether Convoke meets its own standard.

## Acceptance Criteria

1. Covenant draft contains (1) the axiom "The operator is the resolver" with one-paragraph explanation, (2) JTBD statement, (3) Operator Rights (count matches Story 1.3 Checklist = 7), (4) a "Why This Exists" section with scar stories naming Migration and Portfolio and their specific violations, (5) audience guidance addressing three distinct readers: contributors, reviewers, operators/external evaluators.
2. Each right follows the 4-part format: (a) right statement (one sentence), (b) why it exists (paragraph anchored in a real incident or principle), (c) good example (concrete interaction snippet), (d) anti-pattern (concrete snippet with what it should have been).
3. Every right can be shown as a direct consequence of the axiom (derivation integrity per NFR5). Rights that cannot be derived are rewritten or removed before proceeding.
4. Preamble introduces the 9 foundational terms required by the Compliance Checklist's Covenant preamble authoring contract: `default`, `fallback`, `override`, `unresolvable state`, `exclusion`, `decision point`, `interaction round`, `concept budget`, `scope`.
5. Covenant draft self-validates against the Compliance Checklist (FR14) — all 7 rights pass OC-R1 through OC-R7 per the doc-applicability mapping. Preamble exempt from ≤3-concept budget per the preamble authoring contract's explicit recognition.
6. File saved at `_bmad-output/planning-artifacts/convoke-covenant-operator.md` with governance frontmatter (`initiative: convoke`, `artifact_type: covenant`, `created: 2026-04-18`, `schema_version: 1`).

## Tasks / Subtasks

- [x] Task 1: Author preamble (axiom + JTBD + foundational vocabulary) — §1-3 of Covenant; all 9 foundational terms introduced per authoring contract
- [x] Task 2: Author "Why This Exists" with scar stories — §4 of Covenant; Migration + Portfolio named with specific violations and "what this taught us" generalization
- [x] Task 3: Author "How to read this" with 3-audience guidance — §5 of Covenant; external evaluator + contributor + reviewer voices addressed
- [x] Task 4: Author the 7 Operator Rights in 4-part format — §6 of Covenant; each right has statement / why / good example / anti-pattern
- [x] Task 5: Author derivation-from-axiom section — §7 of Covenant; each right traced to the axiom
- [x] Task 6: Author "How to comply" pointing to the Checklist — §8 of Covenant; references Checklist as operational instrument + cites current 82% compliance + honest gap acknowledgment
- [x] Task 7: Self-validate against Compliance Checklist — walked through OC-R1 through OC-R7 per doc-applicability mapping; two fixes applied (added TOC of 7 rights at §6 for OC-R2 doc-form; revised §6.2 good example to use cumulative vocabulary instead of 4 specific domain labels for OC-R7)
- [x] Task 8: Save with governance frontmatter — file at `_bmad-output/planning-artifacts/convoke-covenant-operator.md` with `initiative: convoke`, `artifact_type: covenant`, `created: 2026-04-18`, `schema_version: 1`. `convoke-doctor` green (25/25 checks, all 6 taxonomy checks pass).

## Dev Notes

### Input documents

- Epic (Story 1.4 definition + NFRs + UX-DRs): `_bmad-output/planning-artifacts/convoke-epic-operator-covenant.md`
- Audit report (scar stories + rubric + good-example skills): `_bmad-output/planning-artifacts/convoke-report-operator-covenant-audit-2026-04-18.md`
- Checklist (self-compliance gate + doc-applicability mapping + preamble authoring contract): `_bmad-output/planning-artifacts/convoke-spec-covenant-compliance-checklist.md`
- Project memory: `project_operator_covenant.md` — axiom, JTBD, strategic framing

### Stylistic defaults (approved by Amalik 2026-04-18)

- **Audience voice:** external evaluator (Victor's Blue Ocean wedge). Contributors and reviewers can handle slightly aspirational framing; externals need it.
- **Tone register:** mixed. Principle register for §1-3 (axiom, JTBD, scars). Practitioner register for §4 (the 7 rights).
- **Length budget:** publishable short — 600-800 lines; cover-to-cover in 15 minutes.
- **Scar detail depth:** names Migration + Portfolio explicitly. Approximate date framing OK (exact scar-era quotes tracked as backlog item A11).

### Anti-patterns to AVOID (from epic NFRs + UX-DRs)

- ❌ Do NOT reference rights by number in prose — names only (AC #2 of oc-1-1).
- ❌ Do NOT anonymize scars — Migration and Portfolio named by name (UX-DR4; trust signal).
- ❌ Do NOT aspire without evidence — NFR2 credibility requires the Covenant cite audit findings where they exist.
- ❌ Do NOT skip derivation integrity — every right must visibly derive from the axiom (NFR5).
- ❌ Do NOT violate OC-R7 in the per-right sections — ≤3 novel concepts per section in the Covenant's cumulative vocabulary (post-A12 rule).

### Namespace decision

`artifact_type: covenant` — the type was added to the taxonomy in oc-1-2 specifically for this deliverable. Lives in `_bmad-output/planning-artifacts/`.

### References

- [Source: convoke-epic-operator-covenant.md#Story-1.4] — story ACs
- [Source: convoke-report-operator-covenant-audit-2026-04-18.md] — scar stories + compliance evidence
- [Source: convoke-spec-covenant-compliance-checklist.md] — self-compliance gate + preamble authoring contract

## Dev Agent Record

### Agent Model Used

_To be filled when story is picked up_

### Debug Log References

### Completion Notes List

### File List
