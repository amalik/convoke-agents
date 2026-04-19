# A24: Vortex Audit Expansion (IN-12)

Status: done (2026-04-19) — report: [convoke-report-operator-covenant-audit-vortex-2026-04-19.md](../planning-artifacts/convoke-report-operator-covenant-audit-vortex-2026-04-19.md)

## Story

As a Convoke contributor preparing Epic 2 Story 2.1's T1 (team × Right) trigger evaluation,
I want a Vortex-scoped audit extension that scores ≥ 3 additional Vortex workflows beyond `lean-persona` against all 7 Operator Rights using the locked oc-1-1 methodology,
so that the Vortex team cell reaches N ≥ 4 and T1 trigger evaluation for Vortex becomes valid (currently blocked at N = 1 per [convoke-epic-operator-covenant.md:365](../planning-artifacts/convoke-epic-operator-covenant.md#L365)).

## Acceptance Criteria

1. **Methodology reuse, not revision.** The audit applies §2.3 scoring scheme + §2.4 per-right rubric + §2.6 novel-concept glossary from [convoke-report-operator-covenant-audit-2026-04-18.md](../planning-artifacts/convoke-report-operator-covenant-audit-2026-04-18.md) verbatim. If a rubric ambiguity surfaces, it is recorded as an intake for the initiatives backlog (not resolved in-story).

2. Audit findings reference rights by name (e.g., "Right to pacing"), not number — same rule as oc-1-1 AC #2.

3. **Scope — ≥ 3 additional Vortex workflows audited.** The set must include `assumption-mapping` (IN-12 origin spot-check target) and `empathy-map`; the third is selected from `hypothesis-engineering` or `lean-experiment`. Rationale for the third choice is documented in the report. Combined with lean-persona (carried over from oc-1-1 §7), the Vortex cell reaches N ≥ 4.

4. **Unit of analysis matches oc-1-1 §2.2.** One representative step per workflow is audited. If the workflow has > 3 steps, the report discloses which step was chosen and why (same disclosure pattern as oc-1-1 Loom add-team scoping).

5. Each workflow × right cell produces a binary PASS / FAIL verdict with a ≤ 2-sentence evidence note citing specific file references and behaviors (no partial-credit language — see Round 3 triage on partial credit).

6. **Right-to-pacing cells apply §2.6 glossary strictly.** The IN-12 spot-check estimate of "~10 novel concepts in assumption-mapping step-01" is a pre-audit *hypothesis*, not a finding — the actual concept count (via §2.6 glossary enumeration) is the AC #5 evidence. A mismatch between estimate and measured count does not invalidate the finding; it is logged in the report §notes.

7. **Output report saved** at `_bmad-output/planning-artifacts/convoke-report-operator-covenant-audit-vortex-YYYY-MM-DD.md` with governance frontmatter (`initiative: convoke`, `artifact_type: report`, `created: YYYY-MM-DD`, `schema_version: 1`). `convoke-doctor` must pass on the saved file.

8. **Vortex (team × Right) row computed** — for each of the 7 rights, the report emits `vortex_fail_rate = fails_in_vortex / N_vortex_audited` using the combined set (3 new workflows + lean-persona carried from oc-1-1 §7).

9. **T1 trigger verdict recorded** — for each right, the report states whether the Vortex cell fails the T1 threshold (< 70% compliance at N ≥ 3 per [convoke-epic-operator-covenant.md:360](../planning-artifacts/convoke-epic-operator-covenant.md#L360)). If any right trips T1, the affected (Vortex × Right) cell(s) are escalated as in-scope for Epic 2 Story 2.1 retrofit — logged in the report §Implications section.

10. **Initiatives-backlog log entry** — on completion, add a 2026-MM-DD row to the backlog §2.5 activity log summarizing: workflows audited, Vortex fail rates per right, T1 trigger verdict, and whether Epic 2 Story 2.1 scope is affected. Move A24 from Fast Lane → §2.5 Completed.

## Tasks / Subtasks

- [ ] Task 1: Confirm workflow selection (AC #3) — pick the third workflow from `hypothesis-engineering` or `lean-experiment`; document rationale (e.g., coverage of different Vortex stream archetypes, skill maturity, recent adoption).
- [ ] Task 2: Identify representative step per workflow (AC #4) — cite step path (e.g., `_bmad/bme/_vortex/workflows/assumption-mapping/step-01-<name>.md`) and rationale for step choice.
- [ ] Task 3: Score each workflow × 7 rights (AC #5, #6) — 3 workflows × 7 rights = 21 new cells; evidence notes cite specific file:line references where behavior is defined.
- [ ] Task 4: Compute Vortex team × Right row (AC #8) — 4 workflows (3 new + lean-persona from oc-1-1 §7) × 7 rights; report per-right fail count and fail rate.
- [ ] Task 5: Evaluate T1 trigger for Vortex (AC #9) — per-right: does `(fails / N) < 0.30` at `N ≥ 3`? Any `TRUE` escalates.
- [ ] Task 6: Draft §Implications section — for each T1-tripping right (if any), recommend retrofit pattern drawing from oc-1-1 §9.1's retrofit catalogue where applicable.
- [ ] Task 7: Save report (AC #7) + run `npx convoke-doctor` to verify governance acceptance.
- [ ] Task 8: Update initiatives backlog (AC #10) — activity-log row + move A24 to §2.5 Completed.

### Review Findings (Round 1, 2026-04-19)

**Legend:** Severity follows `code-review-convergence` rule. 3 layers ran: Blind Hunter (no context), Edge Case Hunter (diff + project read), Acceptance Auditor (diff + spec + context docs).

**Meta-COI note:** Sub-agents produced findings independently. Main-agent classification is by the same author as the audit; classifications reflect best-effort but reviewer should weight with COI in mind.

#### Decision-needed (3) — require operator input before fix

- [ ] [Review][Decision] **Right-to-next-action PASS vs AC #4 unit-of-analysis** — evidence notes for all 3 workflows say "no error surface at step-01; non-conforming routes into step-02 with gaps named". The PASS verdict leans on step-02+ behavior, which contradicts AC #4 (one representative step per workflow). Options: (a) rescore as N/A at intake-only step-01 per §2.3 with justification, (b) extend scope to include step-02 error paths (violates AC #4), (c) accept PASS as method-consistent with lean-persona oc-1-1 §8.7 (same reasoning was accepted there). HIGH. [convoke-report-operator-covenant-audit-vortex-2026-04-19.md:§4.1,4.2,4.3 R6]
- [ ] [Review][Decision] **Empathy-map Right-to-pacing glossary consistency** — §4.2 excludes the 6 empathy-map quadrants (Says/Thinks, Does/Feels, Pain Points, Gains) as "framework signposts not unpacked in step-01", while §4.3 counts hypothesis-engineering's Functional/Emotional/Social Jobs as distinct sub-axes. If the §2.6 workflow-inherited rule is applied strictly (workflow.md counts as prior introduction), empathy-map's 6 quadrants push the count over the budget → FAIL, making Vortex pacing 0/4 (0%). Trigger still fires either way, but the cell is affected. HIGH. [convoke-report-operator-covenant-audit-vortex-2026-04-19.md:§4.2 R7]
- [ ] [Review][Decision] **COI mitigation for self-authored spec/self-executed audit** — §8 discloses the methodology-frame COI (auditor wrote the story spec then executed against it) but proposes no mitigation beyond the A10 reproducibility gate. Options: (a) treat as disqualifying — rerun by separate reviewer; (b) accept provisional with COI caveat (current state); (c) accept as-is without provisional qualifier. HIGH. [convoke-report-operator-covenant-audit-vortex-2026-04-19.md:§8]

#### Patches (15) — fixable without operator input

- [ ] [Review][Patch] **Compound-concept "A13" rule applied beyond locked §2.6** — AC #1 violation. §4.1 and §4.3 evidence notes cite "§2.6 compound-concept grouping A13" but A13 is a backlog proposal, not a locked glossary rule. Reframe FAILs under strict §2.6 without grouping (≥ 6 novel concepts under strict reading — verdict unchanged). HIGH. [convoke-report-operator-covenant-audit-vortex-2026-04-19.md:§4.1 R7, §4.3 R7]
- [ ] [Review][Patch] **Pacing FAIL evidence notes exceed ≤ 2 sentences** — AC #5 violation. §4.1 R7 (4 sentences), §4.3 R7 (4 sentences), §4.2 R7 (3 sentences) all exceed the limit. Trim or split. MEDIUM. [convoke-report-operator-covenant-audit-vortex-2026-04-19.md:§4.1,4.2,4.3 R7]
- [ ] [Review][Patch] **Story spec task checkboxes unchecked despite "done" status** — spec hygiene. All 8 `- [ ]` Tasks remain unchecked while header reads `Status: done (2026-04-19)`. Check completed items. LOW. [oc-vortex-audit-expansion-a24.md:§Tasks]
- [ ] [Review][Patch] **Wrong line-anchor citations to Covenant epic** — Edge Case Hunter verified: "L360" cited for T1 threshold is actually the Retrofit-scope line; T1 definition is at line 359. "L365" cited for v1 N=1 baseline claim is actually the "Supersedes" paragraph. Fix line numbers or replace with section anchors (e.g., `#retrofit-trigger-rule`). MEDIUM. [oc-vortex-audit-expansion-a24.md:Story, AC #9, Dev Notes; convoke-report-operator-covenant-audit-vortex-2026-04-19.md]
- [ ] [Review][Patch] **Activity-log "A24 shipped" wording contradicts §7 provisional verdict** — report §7 declares T1-FIRES provisional pending A10 reproducibility pass, but backlog activity log entry for 2026-04-19 says "A24 shipped". Downgrade wording or add explicit "(provisional)" qualifier in the backlog row. HIGH. [convoke-note-initiative-lifecycle-backlog.md:§Change Log 2026-04-19 A24 entry]
- [ ] [Review][Patch] **AC #6 "§notes" section missing** — AC #6 says estimate-vs-measurement mismatch "is logged in the report §notes", but the report has no labelled §notes section; the comparison is inlined in §4.1 evidence note (contributing to length overrun above). Add §notes section or reframe AC #6 to acknowledge inline evidence satisfies. LOW. [convoke-report-operator-covenant-audit-vortex-2026-04-19.md:§4.1 R7]
- [ ] [Review][Patch] **AC #8 emits compliance rate, not `vortex_fail_rate`** — AC #8 literal specifies `vortex_fail_rate = fails_in_vortex / N_vortex_audited`. Report §5 table shows "4/4 (100%)" compliance ratios. Add fail-rate column or rename. Fraction is unambiguous but doesn't match AC literal. LOW. [convoke-report-operator-covenant-audit-vortex-2026-04-19.md:§5]
- [ ] [Review][Patch] **§6.4 T2 calculation produces verdict-shaped number despite scope anti-pattern** — report states "T2 is NOT re-evaluated" yet computes "55% compliance globally" using non-Vortex oc-1-1 verdicts. Drop the figure or push entirely to a §backlog-intake list. MEDIUM. [convoke-report-operator-covenant-audit-vortex-2026-04-19.md:§6.4]
- [ ] [Review][Patch] **§6.4 falsely attributes "every Right ≥ 70%" phrase to oc-1-1** — Edge Case Hunter verified the phrase does not exist in the oc-1-1 report; it appears in `convoke-epic-operator-covenant.md`. The "internal inconsistency in oc-1-1" claim is misidentified as cross-doc inconsistency. Correct citation or remove claim. HIGH. [convoke-report-operator-covenant-audit-vortex-2026-04-19.md:§6.4]
- [ ] [Review][Patch] **Class-level retrofit figures (23 Vortex workflows, 8+ affected) are unsourced** — §6.2 cites these numbers without provenance. Mark as rough estimates or drop specific numbers. LOW. [convoke-report-operator-covenant-audit-vortex-2026-04-19.md:§6.2]
- [ ] [Review][Patch] **§6.5 Epic 2 baseline-update claim lacks ratification step** — "Epic 2 §Retrofit Trigger Rule baseline now reads..." asserts authority to rewrite the epic. Soften to "should be updated to read" + add action item. MEDIUM. [convoke-report-operator-covenant-audit-vortex-2026-04-19.md:§6.5]
- [ ] [Review][Patch] **Backlog activity log row under-reports per-right fail rates** — AC #10 requires "Vortex fail rates per right" (plural); shipped row quantifies only pacing. List all 7 (6 at 100% / pacing at 25%). MEDIUM. [convoke-note-initiative-lifecycle-backlog.md:§Change Log 2026-04-19 A24 entry]
- [ ] [Review][Patch] **Stale A8/A9 references — no referential-integrity grep** — renames (A8→A24, A9→A25) happened, but no check ran for orphan references in other artifacts. Quick grep pass. LOW. [repo-wide]
- [ ] [Review][Patch] **A26 floated in §6.2 prose without backlog intake** — speculative initiative named without proper backlog triage. Either log as IN-## intake or remove A26 mention from report body. LOW. [convoke-report-operator-covenant-audit-vortex-2026-04-19.md:§6.2]
- [ ] [Review][Patch] **Task 5 "fails/N < 0.30" inequality inverted vs AC #9 "< 70% compliance"** — Task 5 as written would never fire T1 for high-fail cells. Should be `(fails / N) ≥ 0.30` (since `< 70% compliance` ≡ `fail_rate > 30%`, strict). HIGH. [oc-vortex-audit-expansion-a24.md:§Tasks/Subtasks Task 5]

#### Deferred (4) — pre-existing or out-of-scope for this round

- [x] [Review][Defer] **Step-01 sampling bias — later steps unaudited for all 3 workflows (assumption-mapping:4, empathy-map:6, hypothesis-engineering:5 steps)** — deferred. Already acknowledged in §7 reproducibility discussion. Extending to all steps is a future audit scope (candidate A26).
- [x] [Review][Defer] **Third-workflow "twins" pick — diverse structural sampling for future audits** — deferred. Design guidance for future Vortex audits; does not invalidate current findings.
- [x] [Review][Defer] **IN-12 intake-to-shipped same-day governance smell** — deferred. Process observation; belongs in retro or project-context.md if formalized.
- [x] [Review][Defer] **T1 boundary case (exactly 70% compliance)** — deferred. Epic-level clarification; out of scope for A24.

#### Dismissed (4) — noise / method-consistent / false positive

- Portfolio column 'vortex' (backlog) vs frontmatter `initiative: convoke` (report) — different columns track different things (initiative attribution vs skill-team attribution). Method-consistent with oc-1-1 report.
- convoke-doctor validation untested — was run during the session; output confirmed (2 pre-existing unrelated issues, no A24 failures).
- "Implicit wait" boilerplate across Pause cells — method-consistent with oc-1-1 §8.7 lean-persona scoring verbatim.
- Shared Right-to-default fallback text scored twice — each workflow is a distinct audit unit; independent scoring is correct.



## Dev Notes

### Origin & Scoring

- **Intake:** IN-12 (deferred from oc-1-1 Round 3 Edge Case Hunter per `code-review-convergence` no-R4 rule)
- **Backlog ID:** A24 (renamed from A8 on 2026-04-19 — collision with v6.3 Adoption A8/WS3 Amelia consolidation)
- **RICE:** R=6, I=1, C=80%, E=2, Score=2.4 — Fast Lane qualification

### Pre-Audit Hypothesis (from IN-12)

oc-1-1 sampled only `lean-persona` from the Vortex team, which returned 1 Right-to-pacing FAIL out of 7 rights (one of the *least-violating* outcomes in the audit matrix — [convoke-report-operator-covenant-audit-2026-04-18.md:271](../planning-artifacts/convoke-report-operator-covenant-audit-2026-04-18.md#L271) row). IN-12 spot-check flagged `assumption-mapping` step-01 as introducing ~10 novel concepts in a single round, suggesting Vortex is systematically weaker on Right to pacing than lean-persona indicated. If confirmed under §2.6 glossary, Vortex may trip T1 on Right to pacing (N=4, ≥3 FAILs → 75% fail → trigger fires).

This is a hypothesis, not a prediction. The audit executes the methodology and reports the result — even if Vortex passes, the N ≥ 3 floor for T1 evaluation is the primary deliverable.

### Downstream Consumers

- **Epic 2 §Retrofit Trigger Rule ([line 365](../planning-artifacts/convoke-epic-operator-covenant.md#L365)):** baseline updates from "v1 oc-1-1 (N_vortex = 1, T1-invalid)" to "v2 post-A24 (N_vortex ≥ 4, T1-valid)". This is the *primary* consumer regardless of outcome.
- **Epic 2 Story 2.1:** if any Vortex × Right cell trips T1, that cell becomes in-scope retrofit. Escalation path: report §Implications → sprint-planning on Epic 2.
- **Operator Covenant external publication (Epic 2 Story 2.3):** Publication Gate evaluates against the refreshed matrix; a T1-valid Vortex row is required before publication.

### Anti-Patterns to AVOID

- ❌ Do NOT modify §2.4 rubric or §2.6 glossary — this is a re-run, not a methodology revision. Rubric ambiguities go to backlog as intakes.
- ❌ Do NOT audit only Right to pacing — all 7 rights must be scored to prevent cherry-pick bias and to keep the Vortex row commensurable with oc-1-1 §7.
- ❌ Do NOT re-score `lean-persona` — carry its oc-1-1 §7 verdicts forward unchanged. If carrying forward surfaces a drift concern, log as backlog intake.
- ❌ Do NOT use partial-credit language in evidence notes — rejected in oc-1-1 Round 3 ("residual partial-credit language in some evidence notes" was deferred).
- ❌ Do NOT conflate this audit with a full re-audit of the 6-skill oc-1-1 matrix — scope is Vortex-team-only expansion; Migration, Portfolio, export-skill, validate-exports, Loom add-team, enhance-backlog, Gyre stack-detection are **not** re-audited.

### Conflict-of-Interest Disclosure

If the auditor has materially authored or edited any of the three Vortex workflows selected, the report must disclose this in a §COI section (pattern: oc-1-1 §6 enhance-backlog disclosure). This does not invalidate the audit, but reviewers reading the T1 verdict should know.

### Output File

```
_bmad-output/
└── planning-artifacts/
    └── convoke-report-operator-covenant-audit-vortex-YYYY-MM-DD.md  # THIS STORY creates this file
```
