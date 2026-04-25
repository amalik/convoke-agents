# A39: Gyre Covenant Audit (IN-73)

Status: **ready-for-dev** — Pre-Author Decision 1 resolved 2026-04-25 (Lens → `gap-analysis`, operator-confirmed Party Mode John+Winston+Amalik).

**Epic:** [P21 Convoke Operator Covenant — Epic 2](../planning-artifacts/convoke-epic-operator-covenant.md) (input artifact for Story 2.3 Publication Gate coverage-breadth requirement, gate shipped 2026-04-21 as ✓A40)
**Origin:** IN-73 — Party mode 2026-04-21 (John + Winston, P21 next-best-move discussion)
**Sprint:** Parallel to v6.3.3 (Marketplace) — pure content work, zero code-collision surface
**Namespace decision:** No new skills or `_bmad/bme/` content. Output is a new audit report at `_bmad-output/planning-artifacts/`. The `namespace-decision-for-new-skills` rule from [project-context.md](../../project-context.md) is N/A by construction. The `covenant-compliance-for-convoke-skills` rule is also N/A — this story authors *about* `_bmad/bme/_gyre/` skills but does not modify them.
**Safety analysis (path-safety rule):** N/A — no scripts, no destructive operations. Read-only access to [`_bmad/bme/_gyre/`](../../_bmad/bme/_gyre/) and write-only to a new file under `_bmad-output/planning-artifacts/`.

## Story

As a Convoke contributor preparing P21 Epic 2 Story 2.3 Publication Gate clearance,
I want a Gyre-scoped Covenant audit that scores 4 Gyre agent-owned workflows × 7 Operator Rights = 28 cells using the locked methodology (oc-1-1 §2.3/§2.4/§2.6 + A10 reproducibility gate + A28 Step Selection + A29 Skill Selection),
so that the Publication Gate's coverage-breadth requirement (≥ 2 audited portfolios per A40 amendment, currently satisfied only by Vortex/A24) is satisfied for Gyre, enabling external publication of the Operator Covenant once A41 defines "portfolio audit" at the right granularity.

## Context & Motivation

**Why now:**
- A40 (Publication Gate coverage-breadth amendment, shipped 2026-04-21) added requirement (b): "at least two audits covering distinct portfolios" before Story 2.3 Publication Gate clears. Vortex (A24) is the only post-baseline team audit. Gyre has zero audits.
- Methodology is locked as of 2026-04-20: A10 reproducibility threshold + A28 Step Selection rule + A29 Skill Selection rule (Selection Discipline bundle in [Compliance Checklist](../planning-artifacts/convoke-note-operator-covenant-compliance-checklist.md)). A39 is locked-methodology application — not methodology revision.
- All 4 Gyre agents exist (Scout 🔎 / Atlas 📐 / Lens 🔬 / Coach 🏋️) per [`_bmad/bme/_gyre/README.md`](../../_bmad/bme/_gyre/README.md); Gyre is a parallel team to Vortex with its own handoff contracts (GC1-GC4). Audit surface is mature and stable.
- **Code-collision avoidance:** v6.3 Epic 3 (Marketplace) is touching `scripts/update/migrations/`, `scripts/portability/`, and `.claude-plugin/` — A39 touches none of these. Pure content work.

**Why agents (not workflows) framing in the backlog:**
The backlog row "4 Gyre agents × 7 Operator Rights = 28 cells" is the *headline* framing per [convoke-note-initiative-lifecycle-backlog.md A39](../planning-artifacts/convoke-note-initiative-lifecycle-backlog.md). The *unit of analysis* per oc-1-1 §2.2 is a workflow step (not an agent persona); the agent framing maps 1-to-1 to "the workflow each agent owns" because each Gyre agent owns exactly one primary workflow (Scout/stack-detection, Atlas/model-generation, Coach/model-review) — except Lens (readiness-analyst), which owns 2 workflows (`gap-analysis` and `delta-report`). Pre-Author Decision 1 (see Dev Notes) selects **`gap-analysis`** as Lens's representative workflow with documented rationale.

## Acceptance Criteria

**AC1 — Methodology reuse, not revision.** The audit applies §2.3 scoring scheme (strict binary PASS/FAIL, no partial credit) + §2.4 per-right rubric + §2.6 novel-concept glossary from [convoke-report-operator-covenant-audit-2026-04-18.md](../planning-artifacts/convoke-report-operator-covenant-audit-2026-04-18.md) verbatim. If a rubric ambiguity surfaces (e.g., domain-specific concept counting for stack inventories), it is recorded as a backlog intake (not resolved in-story). This is the same constraint A24 carried.

**AC2 — Audit findings reference rights by name** (e.g., "Right to pacing"), not number — same rule as oc-1-1 AC #2 and A24 AC #2.

**AC3 — Scope: 4 Gyre workflows audited, one per agent.** The audit covers:
- `stack-detection` (Scout 🔎 — scanning/listing archetype)
- `model-generation` (Atlas 📐 — generation archetype)
- `gap-analysis` (Lens 🔬 — decision-support archetype; locked 2026-04-25 — see Pre-Author Decision 1 in Dev Notes for the `gap-analysis` vs `delta-report` analysis and the resolved trade-off)
- `model-review` (Coach 🏋️ — review/feedback archetype)

The 4 workflows cover 4 distinct structural archetypes (scan / generate / decide / review), satisfying A29 Selection Discipline §independent verification mode (default; ≥1 variation required on primary structural dimension). Per A29, the audit report's §2 must explicitly:
1. Declare the structural dimensions used for selection (proposed: workflow phase {scan/generate/decide/review} + GC contract role {producer/consumer/both}).
2. Classify each pick inline.
3. Declare selection intent: **independent verification** (4 distinct archetypes; no pattern-cluster claim).

**AC4 — Unit of analysis matches oc-1-1 §2.2 + A28 Step Selection rule.** Per A28 ("each picked skill's audit MUST cover ≥2 steps OR explicitly scope to single step with documented rationale"): A39 scopes to **step-01** for all 4 workflows with the documented rationale "cross-audit comparability with A24 baseline (which scoped to step-01 across 4 Vortex workflows); step-01 is also where Gyre workflows receive their primary inputs (GC1 stack profile, GC2 capabilities manifest) and where workflow-level concept load concentrates." This rationale is **not** the explicitly-forbidden circular reasoning ("step-01 is the highest-concept-density step"); it is cross-audit comparability + GC-contract receipt point. If a workflow has no `step-01` (e.g., single-file workflow.md only), the report discloses which step or section was chosen and why.

**AC5 — Each workflow × right cell produces a binary PASS / FAIL verdict** with a ≤ 2-sentence evidence note citing specific file references and behaviors (no partial-credit language). 28 cells total. 0 N/A unless explicitly justified per cell.

**AC6 — §Notes section captures methodology-application observations** that don't belong in evidence notes (e.g., domain-specific concept counting for stack inventories, GC-contract-vs-step-content scope questions).

**AC7 — Output report saved** at `_bmad-output/planning-artifacts/convoke-report-operator-covenant-audit-gyre-YYYY-MM-DD.md` with governance frontmatter `initiative: convoke`, `artifact_type: report`, `created: 'YYYY-MM-DD'`, `schema_version: 1` — **matching A24's report frontmatter exactly** (no `qualifier` field; the qualifier `operator-covenant-audit-gyre` is filename-encoded only per the convention `{initiative}-{artifact_type}[-{qualifier}]-{date}.md` from [taxonomy.yaml:25](../../_bmad/_config/taxonomy.yaml#L25)). `npx convoke-doctor` must pass on the saved file.

**AC8 — Gyre (team × Right) row computed** — for each of the 7 rights, the report emits `gyre_fail_rate = fails_in_gyre / N_gyre_audited` (N=4) using the AC #8 literal formula from A24, plus compliance-rate column for readability.

**AC9 — T1 trigger verdict recorded** — for each right, the report states whether the Gyre cell fails the T1 threshold (`< 70% compliance at N ≥ 3`). If any right trips T1, the affected (Gyre × Right) cell(s) are escalated as in-scope for Epic 2 Story 2.1 retrofit — logged in the report §Implications section. Same threshold semantics as A24 AC #9.

**AC10 — A10 Reproducibility Pass executed and logged.** Per A10 (≥ 3 cells with independent reviewer agreement at 100% threshold for v3+ audits — A39 is the v3 baseline since A24 was v2, subject to Epic 2 governance ratification of v2 baseline first; if v2 ratification is still pending at A39 close, the spec's "v3" framing should be softened to "third audit refresh" with a note that ratification chain is operator's call). Cells selected per A10 composition rule (one expected-PASS, one expected-FAIL, one borderline). Result table appended as report §7.1, mirroring A24 §7.1 shape.

**Operationalization (matches A24 §7.1 pattern):** the "2 independent reviewers" are **2 LLM-driven review invocations blind to each other's verdicts** — implementation: spawn 2 separate Agent subagents (e.g., `general-purpose` or `Explore`), each given (a) the methodology source-of-truth (oc-1-1 §2.3/§2.4/§2.6), (b) the cell to score, (c) the underlying workflow step file, with NO knowledge of the main audit's verdict or the other reviewer's verdict. Compare verdicts after both return; agreement = same PASS/FAIL outcome. **Honest caveat preserved:** same-model LLM reviewers share base training; agreement validates rubric unambiguity *for LLMs*, not against human judgment (A24 §7.1 honest-limitations #1).

**AC11 — Initiatives-backlog log entry** — on completion, add a 2026-MM-DD row to the backlog §2.5 Completed lane summarizing: workflows audited, Gyre fail rates per right, T1 trigger verdicts, whether Epic 2 Story 2.1 scope is affected, and A10 reproducibility outcome. Move A39 from §2.4 Backlog → §2.5 Completed. Per A39 backlog scope-note: "A39's output-counting-toward-gate depends on A41 defining 'portfolio audit' at the right granularity" — the backlog entry must state this gate-counting-status as **pending A41**.

**AC12 — Conflict-of-Interest disclosure.** If the auditor (Claude or human) has materially authored or edited any of the 4 picked workflows, the report must disclose this in §8 (pattern: oc-1-1 §6 enhance-backlog disclosure; A24 §8 vortex disclosure). This does not invalidate the audit, but reviewers reading the verdict should know.

## Tasks / Subtasks

### Task Dependency Matrix (scannable execution order)

| # | Task | Depends on | Primary input | Primary output | AC ref |
|---|---|---|---|---|---|
| 0 | Pre-check workflow files | none | `_bmad/bme/_gyre/workflows/{stack-detection,model-generation,gap-analysis,model-review}/steps/` | confirm step-01 exists in each (verified 2026-04-25 — file `step-01-load-manifest.md` for gap-analysis; surface mismatch as Decision-Needed if found at execution time) | AC3, AC4 |
| 1 | ✓ Pre-Author Decision 1 (Lens pick) | none | Dev Notes table | locked: `gap-analysis` (resolved 2026-04-25) | AC3 |
| 2 | A29 declaration paragraph | T0, T1 | Gyre README + workflow files | report §2: structural-dimension table + selection-intent declaration prose (template provided below) | AC3 |
| 3 | Identify representative step per workflow | T0, T2 | workflow `steps/` dirs | step file paths + per-workflow rationale | AC4 |
| 4 | Score each workflow × 7 rights | T3, oc-1-1 §2.3/§2.4/§2.6 | step files | 28 cells (PASS/FAIL + ≤2-sentence evidence) | AC5, AC6 |
| 5 | Compute Gyre team × Right row | T4 | 28-cell matrix | report §5: Fails/N, Fail rate, Compliance, T1 verdict per right | AC8 |
| 6 | Evaluate T1 trigger | T5 | §5 row | per-right T1 verdicts; FIRES candidates list | AC9 |
| 7 | Draft §Implications | T6, A24 §6.1 | retrofit catalogue, T6 output | §Implications prose | AC9 |
| 8 | A10 Reproducibility Pass | T4 (cells exist) | 3 selected cells (PASS/FAIL/borderline) | report §7.1 results table; convergence verdict | AC10 |
| 9 | §8 Conflict-of-Interest disclosure | T0 (workflow files known) | git-blame / authorship check on 4 step-01 files | §8 prose | AC12 |
| 10 | Save report + doctor gate | T2-T9 (report drafted) | report file | committed report; convoke-doctor pass | AC7 |
| 11 | Update initiatives backlog | T10 | backlog A39 row | §2.5 Completed move + activity-log row | AC11 |

### Task details

- [ ] **Task 0: Pre-check workflow file existence** — Before Task 3 begins, verify each of the 4 picked workflows has a `step-01-*.md` file: `stack-detection/steps/step-01-*.md`, `model-generation/steps/step-01-*.md`, `gap-analysis/steps/step-01-*.md`, `model-review/steps/step-01-*.md`. Verified 2026-04-25 during spec validation: all 4 exist (gap-analysis: `step-01-load-manifest.md`). If a future re-pickup discovers a file has been renamed/removed, surface as Decision-Needed before proceeding — AC4's "scope to step-01" rationale depends on step-01 existing across all 4.
- [x] **Task 1: ~~Confirm Pre-Author Decision 1 (Lens workflow pick)~~** — RESOLVED 2026-04-25 → `gap-analysis` (operator-confirmed Party Mode John+Winston+Amalik). Trade-off documented in Dev Notes Pre-Author Decision 1 table.
- [ ] **Task 2: Per-workflow A29 declaration paragraph** (AC3 §2 of report) — populate the table below FIRST, then write the declaration prose around it:

  | Workflow | Phase | GC role at step-01 | Step count | Structural archetype |
  |---|---|---|---|---|
  | `stack-detection` (Scout) | scan | none — consumes raw codebase signals | TBD | Scanning/listing |
  | `model-generation` (Atlas) | generate | GC1 consumer (+ GC4 amendments) | TBD | Generation |
  | `gap-analysis` (Lens) | decide | GC2 consumer | 5 | Decision-support |
  | `model-review` (Coach) | review | GC2 + GC3 consumer | TBD | Review/feedback |

  Then declare: "**Selection Intent: Independent Verification** — 4 distinct phase archetypes (scan / generate / decide / review); no pattern-cluster claim; per A29 §independent-verification-mode. Note: 3 of 4 workflows (Atlas, Lens, Coach) are GC-contract consumers at step-01 — see §6 Implications for the GC-schema-at-step-01 cross-team observation pattern."

- [ ] **Task 3: Identify representative step per workflow** (AC4) — cite full step path for each (e.g., `_bmad/bme/_gyre/workflows/gap-analysis/steps/step-01-load-manifest.md`). Step-01 selected for all 4 workflows per AC4's documented rationale (cross-audit comparability with A24 + GC-contract receipt point). If at execution time a workflow has substituted step-01 with a different name, document the substitute scope.
- [ ] **Task 4: Score each workflow × 7 rights** (AC5, AC6) — 4 workflows × 7 rights = 28 cells; evidence notes cite specific `file:line` references where behavior is defined. Note any domain-specific concept-counting calls in §Notes (AC6) — e.g., "stack inventory items" (Scout) and "capability entries" (Atlas) may need glossary calls similar to A24 §4.4 Notes' compound-concept handling.
- [ ] **Task 5: Compute Gyre team × Right row** (AC8) — N=4; emit Fails/N, Fail rate, Compliance, T1 verdict columns per A24 §5 table shape.
- [ ] **Task 6: Evaluate T1 trigger for Gyre** (AC9) — per-right: does `(fails / N) > 0.30` at `N ≥ 3`? Any TRUE escalates to §Implications.
- [ ] **Task 7: Draft §Implications section** — for each T1-tripping right (if any), recommend retrofit pattern drawing from oc-1-1 §9.1 and A24 §6.1's retrofit catalogue where applicable. If no T1 trips, §Implications notes that explicitly + states "Gyre is Covenant-compliant under A39 baseline; no Story 2.1 retrofit additions." Also include the Atlas/Lens/Coach vs Scout cross-team observation if pacing-FAIL pattern matches the GC-receiver hypothesis (per Dev Notes Implication-for-Task-4 note).
- [ ] **Task 8: A10 Reproducibility Pass** (AC10) — pick 3 cells per A10 composition rule (one expected-PASS, one expected-FAIL, one borderline); spawn 2 independent LLM Agent subagents per AC10's operationalization note, each blind to the other's verdict and to the main audit's verdict; emit §7.1 results table mirroring A24 §7.1 shape. If A10 fails (< 100% at N=3-4), §7 verdict is provisional and §Implications must flag downstream consumers (Story 2.3 Publication Gate counting, Epic 2 Story 2.1 retrofit scoping).
- [ ] **Task 9: §8 Conflict-of-Interest disclosure** (AC12) — auditor declares authorship/edit history on the 4 picked workflows' step-01 files; use `git log --follow` per file for verification, mirroring A24 §8 disclosure pattern.
- [ ] **Task 10: Save report** (AC7) + run `npx convoke-doctor` to verify governance acceptance. Frontmatter shape per AC7 (no `qualifier` field; matches A24 report).
- [ ] **Task 11: Update initiatives backlog** (AC11) — activity-log row + move A39 to §2.5 Completed with pending-A41-counting-status note. Update sprint-status.yaml if A39 was tracked there (per Dev Notes, A39 is not currently in sprint-status.yaml as a Fast Lane item — backlog row is the canonical tracker).

## Dev Notes

### Origin & Scoring

- **Intake:** IN-73 (Party mode 2026-04-21 — John + Winston, P21 next-best-move discussion)
- **Backlog ID:** A39
- **RICE:** R=4, I=2, C=80%, E=3, **Score=2.1** — Fast Lane qualification (not initiative-pipeline).
- **Why this RICE survived 2026-04-25 re-prioritization (Party Mode 2026-04-25 — John + Winston + Amalik):** other higher-RICE items (BUG-5 7.2 ✓just-shipped; U15 4.8; I80 4.5) had code-collision risk with v6.3.3 (Marketplace) sprint. A39 is pure content work in `_bmad-output/planning-artifacts/` only — zero overlap with `scripts/update/`, `scripts/portability/`, or `.claude-plugin/`.

### Pre-Author Decision 1 — Lens workflow pick (`gap-analysis` vs `delta-report`) — RESOLVED 2026-04-25

**Resolution:** `gap-analysis` (operator-confirmed Party Mode 2026-04-25, John + Winston + Amalik).

Lens (readiness-analyst) owns 2 workflows. A39 scope is "1 workflow per agent" (4 picks total per AC3). The trade-off table below was the basis for resolution; the spec-author recommendation (`gap-analysis`) was accepted as-is. Trade-off captured for traceability + future audit reference (e.g., a v4+ Gyre re-audit picking `delta-report` instead would have a documented "alternative not previously sampled" rationale).

| Criterion | `gap-analysis` | `delta-report` |
|---|---|---|
| GC contract role | **GC2 consumer; GC3 producer** (verified 2026-04-25 via [workflow.md](../../_bmad/bme/_gyre/workflows/gap-analysis/workflow.md): step-01 loads GC2 only — `.gyre/capabilities.yaml`; step-05 writes GC3) | GC3 consumer; produces delta narrative (step-01 loads prior + current GC3 from `.gyre/findings.yaml`) |
| Operator surface | Direct — operator sees GC3 findings as primary deliverable | Indirect — narrative describing what changed since prior GC3 |
| Step-01 entry point | `step-01-load-manifest.md` — receives GC2 capabilities manifest (parallel to A24's schema-at-step-01 pattern, but receives ONE GC contract not two — narrower load than Atlas/Coach) | `step-01-load-history.md` — receives prior GC3 + current GC3 (delta computation pattern, structurally distinct from A24) |
| Audit comparability with A24 | Higher — same "schema-at-step-01" surface as Vortex's `assumption-mapping` and `hypothesis-engineering` | Lower — delta-pattern is structurally distinct from A24's picks |
| Step count | 5 steps total (step-01 to step-05; verified 2026-04-25 via `ls .../gap-analysis/steps/`) | 3 steps total (verified 2026-04-25 via `ls .../delta-report/steps/`) |
| Risk of "twins pattern" with Atlas/Coach | Moderate — Atlas/model-generation receives GC1 (+ GC4 amendments) at step-01; Coach/model-review receives GC2+GC3 at step-01. All three (Atlas/Lens/Coach) are GC consumers at step-01, but the loaded contracts differ. Scout/stack-detection is the sole non-GC-consumer (raw codebase signals as input). | Lower — delta-pattern provides structural variation |

**A29 Selection Discipline implication (resolved):** picking `gap-analysis` keeps the audit in independent-verification mode (4 distinct phase archetypes scan/generate/decide/review) with weaker structural-dimension diversity on the GC-receipt axis — 3 of 4 workflows (Atlas, Lens, Coach) consume GC contracts at step-01; Scout is the sole raw-codebase-signal consumer. Picking `delta-report` would have added structural variation (delta-computation pattern) at the cost of comparability with A24. **Resolution rationale: comparability with A24 is the higher-value property** for A39 because A39's primary downstream consumer is the Story 2.3 Publication Gate (where cross-audit consistency strengthens the publication claim). The delta-report archetype is a candidate for a follow-up Gyre audit if A39 passes cleanly — log as a backlog intake at A39 close if relevant.

**Implication for Task 4 evidence-note authoring:** because 3 of 4 picks (Atlas, Lens, Coach) are GC-contract-at-step-01 receivers, the auditor MUST be alert to the same "shared architectural pattern" finding A24 §6.2 surfaced. If Atlas/Lens/Coach all FAIL Right to pacing on the same GC-schema-at-step-01 mechanism, this is **strong cross-team evidence** for the convoke-wide GC/HC-receiver pacing pattern (A26 input observation per the Downstream Consumers section below). Scout's position as the sole non-GC-consumer makes it the natural control case — if Scout PASSES Right to pacing while Atlas/Lens/Coach FAIL, the GC-receiver mechanism hypothesis is strongly supported.

### Pre-Audit Hypothesis (none — A39 is a baseline-establishment audit)

Unlike A24 (which had IN-12's spot-check hypothesis "Vortex assumption-mapping has ~10 novel concepts in step-01 → likely T1 fire on Right to pacing"), A39 has **no pre-audit hypothesis**. Gyre has never been audited; the audit's primary deliverable is the N ≥ 3 Gyre team cell *regardless of outcome*. T1 verdicts (per right) are emergent from the matrix, not pre-hypothesized.

This is per design: A39 is the v3 audit refresh (v1 = oc-1-1 baseline, v2 = A24 Vortex expansion, v3 = A39 Gyre baseline). Each new team-audit establishes that team's N ≥ 3 floor for T1/T2 evaluation.

### Downstream Consumers

- **Epic 2 Story 2.3 Publication Gate** (per A40 amendment 2026-04-21): A39 satisfies the second team-audit required for coverage-breadth. **However:** A39's gate-counting-status is **pending A41** (Publication Gate definitional rigor). A41 must define "portfolio audit" at the right granularity before A39's contribution to gate clearance is operationally measurable. A39 ships independent of A41; A41 ships independent of A39. Order of execution does not matter; both are required before Story 2.3 can clear.
- **Epic 2 Story 2.1 retrofit scope:** if any Gyre × Right cell trips T1, that cell becomes in-scope retrofit. Escalation path: report §Implications → sprint-planning on Epic 2.
- **Covenant v3 audit baseline:** if A39 ships before A24 v2 baseline is formally ratified by Epic 2 governance, A39's §6.5 should propose v3 baseline advancement (parallel to A24 §6.5) — both v2 and v3 ratifications are pending Epic 2 owner sign-off.
- **A26 (Vortex-wide HC-schema pattern audit, qualified):** A39's findings on Gyre's GC-schema-at-step-01 surface (Scout/Atlas/Lens) provide an out-of-class data point for whether the HC-schema-at-step-01 pacing pattern A24 §6.2 hypothesized as "Vortex-wide" is actually **convoke-wide** (i.e., a general schema-receiver pattern, not Vortex-specific). If Gyre ALSO trips Right-to-pacing on Scout/Atlas/Lens step-01 surfaces, this is significant evidence — log as an A26 input observation.

### Anti-Patterns to AVOID

- ❌ Do NOT modify §2.4 rubric or §2.6 glossary — A39 is a re-application, not a methodology revision. Rubric ambiguities go to backlog as intakes (per AC1 + per the locked methodology constraint).
- ❌ Do NOT audit only the rights you expect to fail — all 7 rights must be scored to prevent cherry-pick bias and to keep the Gyre row commensurable with A24 §5 + oc-1-1 §7.
- ❌ Do NOT re-score A24 Vortex cells — they are frozen v2 baseline (per A24 G4 mitigation gate). Drift concerns become v4 audit input.
- ❌ Do NOT use partial-credit language in evidence notes — explicitly rejected in oc-1-1 Round 3 ("residual partial-credit language" was deferred) and reaffirmed in A24.
- ❌ Do NOT conflate this audit with a full re-audit of the 8-skill oc-1-1 matrix or A24's 4 Vortex cells — scope is Gyre-team-only baseline; non-Gyre cells stay locked.
- ❌ Do NOT silently pick step-01 — A28 explicitly requires documented rationale (provided in AC4). Implicit single-step scoping is a methodology gap.
- ❌ Do NOT silently re-open Pre-Author Decision 1 — Lens pick is locked to `gap-analysis` 2026-04-25. If implementation surfaces a strong reason to switch (e.g., `gap-analysis` step-01 doesn't exist or has degenerate scope), surface as a Decision-Needed in the dev-story flow rather than silently switching.

### Conflict-of-Interest Disclosure

The auditor SHOULD check whether they (or any reviewer in the A10 pass) have materially authored or edited:
- `_bmad/bme/_gyre/workflows/stack-detection/steps/step-01-*.md`
- `_bmad/bme/_gyre/workflows/model-generation/steps/step-01-*.md`
- `_bmad/bme/_gyre/workflows/gap-analysis/steps/step-01-*.md`
- `_bmad/bme/_gyre/workflows/model-review/steps/step-01-*.md`

If yes, disclose in §8 of the report. Pattern: oc-1-1 §6 + A24 §8.

### Output File

```
_bmad-output/
└── planning-artifacts/
    └── convoke-report-operator-covenant-audit-gyre-YYYY-MM-DD.md  # THIS STORY creates this file
```

Frontmatter must include:
```yaml
---
initiative: convoke
artifact_type: report
qualifier: operator-covenant-audit-gyre
created: 'YYYY-MM-DD'
schema_version: 1
---
```

`npx convoke-doctor` must accept the saved file (AC7).

### Reference Artifacts

| Artifact | Purpose | Location |
|---|---|---|
| Vortex audit report (A24) | Reference template for shape, scoring, §7.1 A10 pass | [convoke-report-operator-covenant-audit-vortex-2026-04-19.md](../planning-artifacts/convoke-report-operator-covenant-audit-vortex-2026-04-19.md) |
| oc-1-1 baseline audit | §2.3 / §2.4 / §2.6 methodology source-of-truth | [convoke-report-operator-covenant-audit-2026-04-18.md](../planning-artifacts/convoke-report-operator-covenant-audit-2026-04-18.md) |
| Operator Covenant + Compliance Checklist | A10 / A28 / A29 Selection Discipline definitions | [convoke-covenant-operator.md](../planning-artifacts/convoke-covenant-operator.md) + [convoke-spec-covenant-compliance-checklist.md](../planning-artifacts/convoke-spec-covenant-compliance-checklist.md) *(filenames updated post-artifact-governance migration: `note-operator-covenant` → `covenant-operator`; `note-operator-covenant-compliance-checklist` → `spec-covenant-compliance-checklist`)* |
| Gyre module README | Agent → workflow ownership map; archetype confirmation | [_bmad/bme/_gyre/README.md](../../_bmad/bme/_gyre/README.md) |
| P21 Epic 2 file | Story 2.3 Publication Gate text; FR15/FR17 retrofit semantics | [convoke-epic-operator-covenant.md](../planning-artifacts/convoke-epic-operator-covenant.md) |
| A24 story spec (precedent for THIS spec) | Story shape template | [oc-vortex-audit-expansion-a24.md](./oc-vortex-audit-expansion-a24.md) |
| A40 ship note | Coverage-breadth requirement A39 satisfies | Backlog §2.5 row 2026-04-21 in [convoke-note-initiative-lifecycle-backlog.md](../planning-artifacts/convoke-note-initiative-lifecycle-backlog.md) |
| A41 backlog row | Definitional dependency for A39's gate-counting | §2.4 Initiative Lane in [convoke-note-initiative-lifecycle-backlog.md](../planning-artifacts/convoke-note-initiative-lifecycle-backlog.md) |
