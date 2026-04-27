---
initiative: convoke
artifact_type: story
qualifier: v63-5a-1-run-sprint-1-experiments-and-log-decisions
created: '2026-04-27'
schema_version: 1
epic: v63-epic-5a
---

# Story 5A.1: Run Sprint 1 experiments and log decisions

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

**Epic:** [Epic 5A — Sprint 1 Experiments & Strategic ADR](../planning-artifacts/convoke-epic-bmad-v6.3-adoption.md#epic-5a-sprint-1-experiments-strategic-adr) (FIRST story; auto-transitions epic backlog → in-progress).
**Sprint:** 1 (FR coverage Sprint 1 stream — but **buildable retrospectively now** per "Why this story is BUILDABLE NOW" rationale below; experiments already ran during Stories 1A.4 + 3.3 + 2026-04-12 EXP3 smoke test).
**FR coverage:** FR33 (operator runs three pre-registered experiments EXP1, EXP2, EXP3 + logs go/no-go decisions for each), FR34 ("what this changed downstream" statement per experiment), FR35 (cross-cutting Sprint 1 artifact informs strategic ADR — Story 5A.2's input).
**M coverage:** M5 (Sprint 1 experiments logged with go/no-go result + 1-paragraph "what this changed downstream" statement in Sprint 1 artifact).
**Failure modes addressed:** none new. Story 5A.1 is itself the failure-mode coverage — without formal Sprint 1 logging, the experiments-shaped-decisions principle (innovation-novel-patterns.md L28 hypothesis) becomes unverifiable.

**Why this story is BUILDABLE NOW (NOT release-time-deferred like Stories 4.3/4.5):** all three experiments have already RUN (EXP1 = Story 1A.4 migration dry-run testing; EXP2 = Story 3.3 marketplace PR submission, PR `#9` open at upstream `bmad-code-org/bmad-plugins-marketplace`; EXP3 = 2026-04-12 platform-agnostic exporter smoke test, PASS recorded in `convoke-note-exp3-platform-agnostic-smoke-test.md`). Story 5A.1 = retrospective formal-logging work. ZERO code, ZERO tests, ZERO new dependencies. Pure documentation that consolidates existing primary evidence into a Sprint 1 artifact per FR33+FR34+M5.

**Why all 3 experiments (NOT just EXP1+EXP2 as epic story brief suggests):** epic story brief at line 396-400 lists only EXP1+EXP2, but FR33 + M5 + product-scope.md + executive-summary all require all 3 (EXP1, EXP2, EXP3). EXP3 is already PASS-recorded at `convoke-note-exp3-platform-agnostic-smoke-test.md` (2026-04-12); Story 5A.1 cites it (Decision 3 — no re-authoring). **Spec-author judgment:** epic brief is narrower than the formal FR33+M5 contract; this story honors the broader contract. (Operator can override at V-pass time if intent was strictly EXP1+EXP2 only.)

**Upstream dependencies:**
- **Story 1A.4 (DONE)** — migration script + integration tests at `tests/lib/migration-3.x-to-4.0.test.js`. EXP1 evidence: migration dry-run on Emma agent passed with empty filesystem diff (per Story 1A.4 completion notes).
- **Story 3.3 (DONE)** — marketplace registry PR submission. EXP2 evidence: `_bmad-output/implementation-artifacts/v63-3-3-validation-log.md` (M12a Path-C PASS) + `v63-3-3-pr-link.md` (PR #9 open at upstream).
- **EXP3 standing artifact** — `_bmad-output/planning-artifacts/convoke-note-exp3-platform-agnostic-smoke-test.md` (2026-04-12 PASS; Bolder Move 3 absorbed into 4.0).

**Downstream consumers:**
- **Story 5A.2** — strategic ADR + playbook outline. ADR cites the experiment outcomes (decisions, downstream impacts); playbook draws on the experience. **Hard dependency:** Story 5A.2 requires Story 5A.1's Sprint 1 artifact path resolved.
- **Story 5B.2 retrospective** — Sprint 1 experiments inform the retro (each experiment's hypothesis status per FR49 NFR25).

**Namespace decision:** all artifacts under `_bmad-output/implementation-artifacts/v63-5a-1-*` (Convoke initiative artifacts) + `_bmad-output/planning-artifacts/convoke-note-sprint-1-experiments.md` (consolidated Sprint 1 artifact, matches `convoke-note-` family naming for permanent records). NO code, NO `_bmad/bme/` skill — covenant-compliance-checklist N/A.

## Story

As Convoke maintainer (Amalik) preparing the v4.0 release retrospective + ADR,
I want **a single consolidated Sprint 1 experiments artifact at `_bmad-output/planning-artifacts/convoke-note-sprint-1-experiments.md` that logs go/no-go decisions + "what this changed downstream" statements for all 3 pre-registered experiments (EXP1 migration dry-run, EXP2 marketplace PR pathfinder, EXP3 platform-agnostic exporter smoke test)**,
so that M5 + FR33 + FR34 are satisfied with verifiable retrospective evidence + Story 5A.2's strategic ADR has a load-bearing input + the innovation-novel-patterns.md L28 hypothesis ("pre-registered experiments shape downstream scope") is verifiable.

**Story shape:** **pure documentation / retrospective-logging / buildable-now.** Smallest v6.3 story-shape — ZERO code, ZERO tests, ZERO new dependencies. ~30-60 min operator-equivalent (most of which is reading existing primary evidence). 2 NEW markdown files + 1 MODIFIED (sprint-status).

**Empirical baseline (probed 2026-04-27):**

| Probe | Result | Spec impact |
|-------|--------|-------------|
| Story 1A.4 spec exists + status `done` | ✓ — `v63-1a-4-create-migration-script-3-x-to-4-0-js.md` | EXP1 primary evidence available |
| Story 3.3 spec + validation log + PR link exist | ✓ — `v63-3-3-submit-marketplace-registry-pr.md`, `v63-3-3-validation-log.md`, `v63-3-3-pr-link.md` | EXP2 primary evidence available |
| EXP3 standing artifact exists | ✓ — `convoke-note-exp3-platform-agnostic-smoke-test.md` (2026-04-12 PASS) | EXP3 cite-only per Decision 3 |
| `convoke-note-sprint-1-experiments.md` clean slate | ✓ — absent | Story 5A.1 creates it |
| `_bmad-output/implementation-artifacts/v63-5a-1-*` clean slate | ✓ — absent (only this story file present after Task 1) | Confirms scope |
| Epic 5A status | ⚠️ — `backlog` (this story is the first; will auto-transition to `in-progress` per `bmad-create-story` Step 1) | Sprint-status update during creation |
| `npm test` baseline post-Story-4.4-R2 | ✓ — `tests 1492 / pass 1491 / skip 1 / fail 0` | Unchanged (Story 5A.1 adds 0 tests) |
| Sprint 1 experiments hypothesis verifiability | ✓ — innovation-novel-patterns.md L28 ("pre-registered experiments shape downstream scope") testable via retrospective Sprint 1 artifact | Story 5A.1 is itself the verification surface |

## Acceptance Criteria

### Decisions (pinned at spec-author time; defensible at dev-time)

**Decision 1 — Single consolidated Sprint 1 artifact at `_bmad-output/planning-artifacts/convoke-note-sprint-1-experiments.md`** (NOT 3 separate per-experiment artifacts; NOT 1 in `implementation-artifacts/`). Rationale: M5 wording is "Sprint 1 artifact" (singular) — a single consolidated note matches the contract. `planning-artifacts/` placement matches the existing `convoke-note-exp3-platform-agnostic-smoke-test.md` family + the artifact is a permanent retrospective record (not an implementation deliverable). **Frontmatter (8 keys):** `initiative: convoke`, `artifact_type: note`, `qualifier: sprint-1-experiments`, `created: <YYYY-MM-DD>`, `schema_version: 1`, `experiment_ids: [EXP1, EXP2, EXP3]` (sorted lexicographic per OS-1 V-pass — deterministic YAML output for machine-parseable downstream gates), `experiment_verdicts: {EXP1: PASS|FAIL, EXP2: PASS|FAIL, EXP3: PASS}` (mapping with same lexicographic key order; EXP3 PASS pinned), `consolidated_decision: <one-line summary of net Sprint 1 impact>`. Body = 3 sections (one per experiment) + closing "Net downstream impact" section per FR34.

**Decision 2 — Retrospective authoring approach: cite-existing-evidence pattern (NOT re-author).** Each experiment's primary evidence is already documented in shipped Story specs / validation logs / PR links. Story 5A.1 authors the FORMAL go/no-go decision + downstream-impact statement, but quotes-and-cites primary sources rather than re-narrating the experiment work. Pattern per experiment: ~150-200 words = (a) experiment design (1-2 sentences referencing the primary artifact), (b) results summary (cite specific evidence with file:line), (c) go/no-go verdict (PASS/FAIL with criterion check), (d) "what this changed downstream" statement per FR34 (1 paragraph: which subsequent decision/scope-shift was informed by this experiment).

**Decision 3 — EXP3 scope: cite-only, NOT re-author** (LL-1 V-pass — compacted). EXP3 is comprehensively documented at `convoke-note-exp3-platform-agnostic-smoke-test.md` (2026-04-12 PASS). Story 5A.1 summarizes + cross-references; does not re-author. Preserves record integrity.

---

**AC1 — `_bmad-output/planning-artifacts/convoke-note-sprint-1-experiments.md` authored with 8-key frontmatter + 3-experiment body + downstream-impact closing.**
**Given** Story 5A.1 dev-story start
**When** Tasks 1-3 complete
**Then**:
- File exists at the specified path.
- Frontmatter matches Decision 1 exactly (8 keys; `experiment_ids` is sorted lexicographic; `experiment_verdicts` is mapping with PASS/FAIL per experiment).
- Body has 4 sections: `## EXP1 — Migration dry-run on one agent`, `## EXP2 — Marketplace PR pathfinder`, `## EXP3 — Platform-agnostic exporter smoke test`, `## Net Downstream Impact`. Each experiment section has subsections per Decision 2 pattern: design, results, verdict, downstream-impact.

**AC2 — EXP1 section meets FR33 + FR34 contract (go/no-go + downstream-impact).**
**Given** Task 2 runs
**When** EXP1 section is authored
**Then**:
- Cites Story 1A.4 spec at `_bmad-output/implementation-artifacts/v63-1a-4-create-migration-script-3-x-to-4-0-js.md` as primary evidence.
- Records pre-registered go/no-go criterion: "migration produces empty filesystem diff on ≥1 sandbox fixture (per M4)".
- Records empirical result: PASS (per Story 1A.4 completion notes — verify at dev-time; if Story 1A.4 reports anything other than PASS for the dry-run, re-author this section accordingly).
- Records "what this changed downstream" statement (FR34) — 1 paragraph: which downstream decision was confirmed by EXP1 PASS (e.g., "WS1 migration workstream proceeded with confidence; M9 PF1 gate scope unchanged; no scope cuts triggered by experiment outcome").

**AC3 — EXP2 section meets FR33 + FR34 contract.**
**Given** Task 2 runs
**When** EXP2 section is authored
**Then**:
- Cites Story 3.3 evidence: `v63-3-3-submit-marketplace-registry-pr.md` (spec), `v63-3-3-validation-log.md` (M12a Path-C PASS evidence), `v63-3-3-pr-link.md` (PR #9 link).
- Records pre-registered go/no-go criterion: "marketplace PR opens at upstream `bmad-code-org/bmad-plugins-marketplace` + passes PluginResolver validation OR documented Path-C fallback (per M12a)".
- Records empirical result: PASS via Path C (per Story 3.3 R1+R2 close — manual schema-match closes M12a regardless of upstream CI behavior; M12b NONE_BY_RELEASE per OP-4).
- Records "what this changed downstream" statement (FR34) — 1 paragraph: which downstream decision was informed by EXP2 outcome (e.g., "WS2 marketplace-distribution stream proceeds; submission pattern documented in playbook input for Story 5A.2; OP-4 framing validated — upstream review responsiveness is correctly out-of-scope for ship gating").

**AC4 — EXP3 section is cite-only per Decision 3 + closes "Net Downstream Impact" with consolidated statement.**
**Given** Task 3 runs
**When** EXP3 section + closing section are authored
**Then**:
- EXP3 section is ~3-5 sentences citing `convoke-note-exp3-platform-agnostic-smoke-test.md` for full design + per-adapter results; references the verdict (PASS) + the downstream impact (Bolder Move 3 absorbed into 4.0 framing) without re-authoring.
- "Net Downstream Impact" closing section (per FR34 + innovation-novel-patterns.md L28 hypothesis verification) is 1 paragraph summarizing how the 3 experiment outcomes COLLECTIVELY shaped Convoke 4.0 scope (e.g., "Sprint 1 experiments validated three foundational bets — migration safety, marketplace viability, platform-agnostic publishing — enabling 4.0 to ship with confidence on all three workstreams. Hypothesis confirmed: pre-registered experiments produce decisions that shape downstream scope.").

**AC5 — Validation gates green + scope discipline.**
- [ ] 5.1 `npm test` baseline unchanged at 1492/1491/1/0 (Story 5A.1 adds 0 unit tests — pure docs).
- [ ] 5.2 `npm run test:integration` baseline unchanged at 93/93/0.
- [ ] 5.3 `npm run lint` baseline unchanged (no JS).
- [ ] 5.4 `git status --porcelain` confirms scope: 2 NEW + 1 MODIFIED (per AC6).

**AC6 — Scope discipline.**
- IN scope (NEW files):
  - This story file.
  - `_bmad-output/planning-artifacts/convoke-note-sprint-1-experiments.md` (Decision 1 — single consolidated Sprint 1 artifact).
- IN scope (MODIFIED):
  - `_bmad-output/implementation-artifacts/sprint-status.yaml` — status transitions (epic-5a backlog → in-progress + this story backlog → ready-for-dev → in-progress → review → done) + `last_updated` narrative.
  - This story file (Tasks/Subtasks checkboxes + Dev Agent Record + File List + Change Log + Status).
- MUST NOT touch: `convoke-note-exp3-platform-agnostic-smoke-test.md` (preserve 2026-04-12 standing artifact per Decision 3); any code; any test files; `package.json`/`package-lock.json`; any `_bmad/` files; Story 1A.4 / 3.3 specs (frozen surfaces — only cite, don't modify).

## Tasks / Subtasks

- [ ] **Task 0: Pre-flight gates.**
  - [ ] 0.1 Confirm Story 1A.4 status `done` in sprint-status.yaml.
  - [ ] 0.2 Confirm Story 3.3 status `done` in sprint-status.yaml.
  - [ ] 0.3 Confirm `convoke-note-exp3-platform-agnostic-smoke-test.md` exists at `_bmad-output/planning-artifacts/`.
  - [ ] 0.4 Confirm clean slate: `_bmad-output/planning-artifacts/convoke-note-sprint-1-experiments.md` absent.
  - [ ] 0.5 Confirm `npm test` baseline 1492/1491/1/0 unchanged.

- [ ] **Task 1: Read primary evidence for EXP1 + EXP2 + EXP3 (~10 min).**
  - [ ] 1.1 Read Story 1A.4 spec + completion notes + Dev Agent Record (EXP1 primary evidence). Note: pre-registered go/no-go criterion = "empty filesystem diff per M4"; result = PASS (verify wording at dev-time).
  - [ ] 1.2 Read Story 3.3 spec + `v63-3-3-validation-log.md` + `v63-3-3-pr-link.md` (EXP2 primary evidence). Note: pre-registered criterion = "PR opens + PluginResolver validates OR Path-C fallback"; result = PASS via Path C.
  - [ ] 1.3 Read `convoke-note-exp3-platform-agnostic-smoke-test.md` for EXP3 cite-only material — frontmatter + per-adapter table + decision wording.

- [ ] **Task 2: Author EXP1 + EXP2 sections of Sprint 1 artifact (~20 min).**
  - [ ] 2.1 Create `_bmad-output/planning-artifacts/convoke-note-sprint-1-experiments.md` skeleton with frontmatter (8 keys per Decision 1 — `experiment_verdicts` populated post-section-authoring).
  - [ ] 2.2 Author `## EXP1 — Migration dry-run on one agent` section per AC2 + Decision 2 pattern (design / results / verdict / downstream-impact).
    - [ ] 2.2.1 (EO-1 V-pass nuance guard) Confirm Story 1A.4 completion notes phrase the migration test result as a PASS. If any caveats or partial results are noted (e.g., "PASS on 2 of 3 agents", "PASS with non-blocking warning", or any non-binary outcome), surface this in the EXP1 section's downstream-impact paragraph + call out the caveat explicitly in `experiment_verdicts` mapping (e.g., `EXP1: PASS-WITH-CAVEAT` rather than bare `PASS`). Prevents silent lossy interpretation of nuanced primary evidence.
  - [ ] 2.3 Author `## EXP2 — Marketplace PR pathfinder` section per AC3 + Decision 2 pattern.
  - [ ] 2.4 Verify both sections cite primary evidence with file paths (NOT just "see Story 1A.4" — include the artifact-relative path).

- [ ] **Task 3: Author EXP3 cite + Net Downstream Impact closing (~10 min).**
  - [ ] 3.1 Author `## EXP3 — Platform-agnostic exporter smoke test` section per AC4 + Decision 3 (cite-only, ~3-5 sentences with full cross-reference to `convoke-note-exp3-platform-agnostic-smoke-test.md`).
  - [ ] 3.2 Author `## Net Downstream Impact` closing section per AC4 — 1 paragraph synthesizing the 3 experiment outcomes' collective impact on Convoke 4.0 scope. Verify connection to innovation-novel-patterns.md L28 hypothesis.
  - [ ] 3.3 Populate `experiment_verdicts` frontmatter mapping with the 3 verdicts (EXP1, EXP2, EXP3 per their authored sections).
  - [ ] 3.4 Populate `consolidated_decision` frontmatter scalar with one-line summary (matches the closing section's first sentence).

- [ ] **Task 4: Validation gates (AC5).**
  - [ ] 4.1 `npm test 2>&1 | tail -5` — baseline 1492/1491/1/0 unchanged.
  - [ ] 4.2 `npm run test:integration 2>&1 | tail -5` — baseline 93/93/0 unchanged.
  - [ ] 4.3 `npm run lint 2>&1 | tail -5` — clean (no JS).
  - [ ] 4.4 `git status --porcelain` — confirms AC6 scope (2 NEW + 1 MODIFIED).

- [ ] **Task 5: Story-close sprint-status update.**
  - [ ] 5.1 Update sprint-status.yaml: epic-5a `backlog → in-progress` (auto-transition per `bmad-create-story` workflow Step 1; verify it already happened or apply now); story `ready-for-dev → review` (per `bmad-dev-story` workflow Step 9).
  - [ ] 5.2 Author `last_updated` narrative entry summarizing Story 5A.1 outcome (3 verdicts + consolidated decision summary).

## Dev Notes

**Decision rationales (compact):** D1 = single consolidated Sprint 1 artifact (matches M5 "Sprint 1 artifact" singular wording + `planning-artifacts/` permanent-record placement matches existing EXP3 family naming). D2 = cite-existing-evidence pattern preserves primary-source integrity + reduces duplication risk. D3 = EXP3 cite-only preserves 2026-04-12 standing artifact integrity.

**Anti-patterns to avoid (top 5):**
- DON'T modify `convoke-note-exp3-platform-agnostic-smoke-test.md` — frozen 2026-04-12 standing artifact (Decision 3).
- DON'T re-narrate the experiments — cite primary evidence (Decision 2). Authoring is for verdicts + downstream-impact, not experiment recap.
- DON'T scope this story to EXP1+EXP2 only despite epic story brief framing — FR33+M5 require all 3, including EXP3 cite (rationale in "Why all 3 experiments" intro section).
- DON'T author per-experiment artifacts in addition to the consolidated one — Decision 1 specifies single artifact; multi-artifact pattern increases maintenance surface.
- DON'T touch Story 1A.4 / 3.3 specs to add experiment framing retrospectively — those are frozen surfaces; cite-from-outside only.

**External dependencies + risk (compact):**

| ID | Risk | Mitigation |
|----|------|-----------|
| PR1 | Story 1A.4 completion notes don't explicitly frame the migration test as "EXP1" | Spec-author judgment: EXP1's substantive design (migration dry-run on one agent) maps directly to Story 1A.4's tests; framing is retrospective |
| PR2 | Story 3.3 PR #9 is still open at upstream (M12b NONE_BY_RELEASE) — does that affect EXP2 verdict? | EXP2 verdict is PASS per Path-C M12a per Story 3.3 R1+R2 close; M12b is aspirational not gating; no risk |
| PR3 | EXP3 cite-only might leave the Sprint 1 artifact thin on EXP3 detail for readers | Cross-reference to standing artifact is sufficient; readers needing depth follow the link |
| PR4 | Hypothesis (innovation-novel-patterns.md L28) verification — what if "downstream impact" wasn't load-bearing in practice? | AC4 closing-section authoring forces the operator to articulate the connection; if no real downstream impact, FAIL is the honest answer (which itself is a decision-shaping outcome) |

**Spike points:** None. Pure retrospective documentation.

**Apply Epic 3 retro action items:**
- **PI-9 (`${PIPESTATUS[0]}`):** N/A — no shell pipelines.
- **PI-10 (Edge Case Hunter):** code-review at story close MUST include Edge Case Hunter layer (markdown + cross-reference + frontmatter-shape edges).
- **PI-11 (DEF-SPIKE inversion handling):** N/A — no spikes.
- **PI-12 (spec spot-check rubric audit):** AC1-AC6 each pin verifiable assertions.

**Inheritance from prior stories:**
- Story 4.5: separate-report-cited-from-release-record pattern (not applicable here — this is a primary record, not a derivative). Frontmatter convention reuse (8 keys; structured artifact_type).
- Stories 4.3 + 4.4: release-time-deferred pattern is NOT applied (Story 5A.1 is buildable now). No execution-precondition gate.
- EXP3 standing artifact: format template for the consolidated artifact's per-experiment sections.

**Story 5A.1 is the smallest v6.3 story-shape** — pure documentation, ZERO code, ZERO tests, ZERO new deps, ~1 hour total operator time. Closes 1 of 2 Epic 5A stories; Story 5A.2 (strategic ADR + playbook outline) is the natural next step (depends on Sprint 1 artifact path resolved).

**TI-9 cron-durability:** N/A — no scheduled actions.

**Scope guardrails for V-pass:** if V-pass tries to suggest "expand to per-experiment artifacts" — DEFER per Decision 1 rationale. If V-pass suggests "include EXP3 detail re-authoring" — DEFER per Decision 3 rationale. If V-pass questions whether retrospective authoring is acceptable — Decision 2 cite-pattern is well-precedented (Story 4.3 release record cite-from-Story-4.2-evidence + Story 4.4 cite-from-Story-4.3-recordings). The story shape is small + well-scoped.

## Change Log

- 2026-04-27 — V-pass batch-applied **3 improvements** (0 critical + 1 enhancement + 1 optimization + 1 LLM-opt) via spec-rewrite. **Empirical probes 12/12 PASS** (cleanest V-pass of v6.3 stream — no critical defects; spec-author judgment on EXP1+EXP2+EXP3 broadening was correct per FR33+M5 strict reading). EO-1 added Task 2.2.1 explicit nuance-guard for EXP1 result interpretation (if Story 1A.4 reports anything other than binary PASS, surface caveat in `experiment_verdicts` mapping rather than silent lossy reduction). OS-1 noted lexicographic-ordering rationale in Decision 1 (deterministic YAML output for machine-parseable downstream gates). LL-1 compacted Decision 3 rationale (~25 token savings without losing meaning). Final spec: 6 ACs + 3 Decisions + 5 Tasks + 4 PR risks + 1 sub-task added (2.2.1). Story remains ready-for-dev. **V-pass ROI:** prevented 0 silent-failure-mode defects (clean spec) + tightened 1 nuance-handling guard + future-proofed 1 frontmatter contract. Lower ROI than Stories 4.3/4.4 (more complex code stories with more defect vectors); appropriate for pure-documentation procedural shape.
- 2026-04-27 — Story 5A.1 created via `/bmad-create-story v63-5a-1`. **First Epic 5A story** — `v63-epic-5a` auto-transitions backlog → in-progress. 6 ACs + 3 Decisions + 5 Tasks + 4 PR risks. Pure documentation / retrospective-logging story (smallest v6.3 shape). Single deliverable (`convoke-note-sprint-1-experiments.md`) consolidates all 3 Sprint 1 experiments per FR33+FR34+M5 (epic story brief was narrower at EXP1+EXP2 only; spec broadens to honor formal contract). Cite-existing-evidence pattern (Decision 2) preserves primary-source integrity. EXP3 cite-only (Decision 3) preserves 2026-04-12 standing artifact. **NOT release-time-deferred** (experiments already ran during Stories 1A.4 + 3.3 + 2026-04-12 EXP3 smoke test); buildable retrospectively now. v6.3 progress: 19/29 stories shipped + 3 ready (Stories 4.3 + 4.5 release-time-deferred; Story 5A.1 buildable-now). Story 5A.2 hard-depends on this story's Sprint 1 artifact path. **Recommend V-pass** before dev-story given retrospective authoring approach + EXP scope clarification (epic vs FR33).

## Dev Agent Record

### Agent Model Used

(set at dev-story start)

### Debug Log References

### Completion Notes List

### File List
