---
initiative: convoke
artifact_type: retrospective
qualifier: v63-bmad-v6.3-adoption
created: '2026-04-27'
schema_version: 1
epic: v63-initiative-level
owner: amalik
hypotheses:
  I1:
    status: DEFERRED
    observation: 'Per PRD `convoke-prd-bmad-v6.3-adoption/innovation-novel-patterns.md:80`: defer observation to v6.4 adoption (first reuse of `host_framework_sync` playbook is the observation event). Story 5A.2 shipped the playbook outline at `docs/host-framework-sync-playbook.md` (Decision 4); reuse-validation triggers at v6.4 release planning.'
    observed_at: 'pending'
  S1:
    status: DEFERRED
    observation: 'Per PRD `innovation-novel-patterns.md:81`: observe in first 4 weeks of post-release user feedback. Honesty constraints encoded in `convoke-prd-bmad-v6.3-adoption/executive-summary.md:38` (mostHonestOneLineSummary) + Story 5B.1 CHANGELOG.md v4.0 verbatim placement; falsification-window opens at release ship (Story 5B.3).'
    observed_at: 'pending'
  S3:
    status: PASS
    observation: 'Story 5A.1 Sprint 1 experiments artifact (`_bmad-output/planning-artifacts/convoke-note-sprint-1-experiments.md`) reports EXP1/EXP2/EXP3 all PASS (frontmatter `experiment_verdicts:` L8) with per-experiment "What this changed downstream (FR34)" paragraphs (L47, L79, L96) AND L102-106 enumerating concrete downstream scope shifts triggered by each. Hypothesis L28 verbatim confirmed at L108. FR33 + FR34 + M5 contracts met.'
    observed_at: '2026-04-27'
  I3:
    status: DEFERRED
    observation: 'Per PRD `innovation-novel-patterns.md:83`: observe in any post-release behavior-change reports. Story 4.3 release-time-deferred (PF1 validation cycle executes when 4.0 candidate exists); falsification-window is "≥3 behavior-change reports in 4 weeks post-ship" per PRD L38. PF1 harness shipped (Stories 4.1 + 4.2); execution + judging at release ship time.'
    observed_at: 'pending'
  I5:
    status: DEFERRED
    observation: 'CM-2 V-pass dependency-chain: Story 4.4 SHIPPED drift-snapshot TOOLING (`scripts/audit/drift-snapshot.js` + 24 unit tests + protocol doc). PRD `innovation-novel-patterns.md:44-46` specifies observation as "drift snapshot comparison file exists in release artifact" — execution-time event, NOT tool-existence. Tool exists at story-close; execution + comparison-file deferred to Story 4.5 N=1 post-release cycle when real recordings exist.'
    observed_at: 'pending'
  S2:
    status: PASS
    observation: 'Story 5B.1 grep-evidence file (`_bmad-output/implementation-artifacts/v63-5b-1-grep-evidence.md:13`) reports zero matches for FR42 cliché-list grep AND FR43 internalOnly-vocabulary grep against the v4.0 CHANGELOG section. Both grep tests PASS verbatim (L37 + L62 "Output: empty — zero matches"). Dual-framing discipline enforced empirically — internalOnly phrases did not bleed into user-facing CHANGELOG.'
    observed_at: '2026-04-27'
  L1:
    status: DEFERRED
    observation: 'PRD `innovation-novel-patterns.md:86` IS L1''s observation-window: "Did L1''s anti-pattern registry capture the real anti-patterns from 4.0? *(Review the registry at retrospective time.)*" — the creation-review component is satisfied at this retrospective (registry shipped at `_bmad-output/planning-artifacts/convoke-anti-patterns.md` with 10 v6.3-stream anti-patterns). Status remains DEFERRED because L1''s falsification clause per `innovation-novel-patterns.md:64` requires the REUSE-validation component: "if the registry exists but is never consulted during subsequent releases, OR if the same anti-patterns recur in v4.1/v6.4 despite the registry, then the Learning Discipline was curation without feedback." Reuse-validation event = future releases'' retrospective time when registry is consulted + recurrence is tracked. Creation-review portion of L86 satisfied; reuse-validation portion deferred to v4.x or v6.4 retrospective.'
    observed_at: 'pending'
---

# Retrospective — Convoke 4.0 / BMAD v6.3 Adoption

**Initiative-level retrospective** closing v6.3-adoption release-process-discipline at Sprint 5 per FR47 Sprint 0 commitment (`success-criteria.md:72` Release Process Checklist). Records PASS/FAIL/DEFERRED status for all 7 innovation hypotheses (I1/S1/S3/I3/I5/S2/L1) per FR49 + NFR25 + Decision 2.

**Position in epic flow:** authored AT Story 5B.2 close, BEFORE Story 5B.3 release ship (Decision 6 pre-ship positioning per evidence-completeness logic; deviates from arch:455 ship-then-retro sequence — defensible per FR47 Sprint 0 commitment + DEFERRED-with-windows partition).

**Status partition (per AC3):** **2 PASS + 5 DEFERRED + 0 FAIL.** Both PASS hypotheses (S2 + S3) cite shipped evidence by file:line. All 5 DEFERRED hypotheses cite explicit PRD observation-windows: 4 from `innovation-novel-patterns.md` L80-85 (I1/S1/S3/I3/I5/S2 numbered 1-6) + 1 from L86 (L1, item 7) per CR-H1 R1 correction. ZERO FAIL — no shipped evidence falsifies any hypothesis at story-close.

---

## Hypothesis Status Table

| Hypothesis | Theme | Status | Observation summary | Observed at |
|------------|-------|--------|---------------------|-------------|
| **I1** — `host_framework_sync` as named release class | Release Discipline | DEFERRED | PRD-cited window: v6.4 adoption first-reuse | pending |
| **S1** — Honesty constraints as release discipline ⭐ | Release Discipline | DEFERRED | PRD-cited window: first 4 weeks post-release feedback | pending |
| **S3** — Pre-registered experiments as Sprint 1 gates | Release Discipline | **PASS** | Story 5A.1 Sprint 1 artifact: 3/3 experiments PASS with downstream scope shifts | 2026-04-27 |
| **I3** — PF1 behavioral equivalence as shipping commitment | Validation Discipline | DEFERRED | PRD-cited window: post-release behavior-change reports (Story 4.3 release-time-deferred) | pending |
| **I5** — Pre/post drift snapshot | Validation Discipline | DEFERRED | Tooling shipped (Story 4.4); execution-deferred to Story 4.5 N=1 per PRD L44-46 | pending |
| **S2** — Dual-framing for audience | Communication Discipline | **PASS** | Story 5B.1 grep-evidence: FR42 + FR43 both zero matches in CHANGELOG v4.0 | 2026-04-27 |
| **L1** — Anti-pattern registry | Learning Discipline | DEFERRED | PRD L86 — creation-review satisfied at this retrospective; reuse-validation deferred to v4.x/v6.4 | pending |

---

## Observations per Hypothesis

### I1 — `host_framework_sync` as a named, reusable release class — DEFERRED

PRD `convoke-prd-bmad-v6.3-adoption/innovation-novel-patterns.md:80` deferred I1's observation to v6.4 adoption: "Did I1's playbook artifact serve its purpose? Will it be reusable at v6.4? *(Defer observation to v6.4 adoption.)*" Story 5A.2 shipped the playbook outline artifact at `docs/host-framework-sync-playbook.md` (Decision 4 per Story 5A.2 spec) — sections (a)-(c) populated with Convoke-4.0-execution evidence; sections (d)-(e) + Winston playbook sign-off remain as `<!-- TODO-5B3-* -->` hand-off markers for Story 5B.3. **Falsification condition (per PRD L16):** if v6.4 adoption rewrites ≥50% of the playbook, the release class was premature abstraction. **Observation event:** v6.4 release planning consults the playbook + measures content-reuse percentage.

### S1 — Honesty constraints as release discipline — DEFERRED

PRD `innovation-novel-patterns.md:81` deferred S1's observation to "first 4 weeks of user feedback." S1 is the load-bearing innovation per PRD L23 ("everything else in the PRD bends around this one"). Honesty-constraint encoding shipped in: (a) `mostHonestOneLineSummary` verbatim at `convoke-prd-bmad-v6.3-adoption/executive-summary.md:38`, propagated verbatim into `CHANGELOG.md` v4.0 section line 1 (Story 5B.1 AC1); (b) explicit `userMigrationFriction: unknown_until_validated` framing per PRD scope shards; (c) named bandwidth + drift-monitoring gaps per PRD L21. **Falsification condition (per PRD L21):** retrospective findings tagged `overclaim` or `expectation-mismatch` post-release. **Observation event:** 4-week post-release feedback window opens at Story 5B.3 ship; falsification surfaces in any post-ship retrospective amendment.

### S3 — Pre-registered experiments as Sprint 1 gates — PASS

**Primary evidence:** `_bmad-output/planning-artifacts/convoke-note-sprint-1-experiments.md` (Story 5A.1 deliverable). Frontmatter L8 records `experiment_verdicts: {EXP1: PASS, EXP2: PASS, EXP3: PASS}`. Body sections enumerate per-experiment "What this changed downstream (FR34)" paragraphs at L47 (EXP1), L79 (EXP2), L96 (EXP3) — each citing concrete downstream scope shifts: EXP1 enabled Story 1A.5 robustness focus rather than re-litigating core migration design; EXP2 validated OP-4 "upstream-review-out-of-scope" framing enabling Stories 3.4 + 3.5 to proceed without calendar dependency; EXP3 absorbed Bolder Move 3 (platform-agnostic publishing) into 4.0 scope, scaling WS2 to include Story 3.5 cross-platform validation. The L102-106 "Net Downstream Impact" section consolidates scope shifts. **Hypothesis L28 verbatim confirmed at L108.** FR33 + FR34 + M5 contracts met.

**Falsification check (per PRD L30):** the falsification condition was "experiments ran but downstream scope is unchanged regardless of results." Each experiment produced load-bearing scope changes (per L102-106 enumeration); none ran ceremonially. Hypothesis confirmed.

### I3 — PF1 agent behavioral equivalence as shipping commitment — DEFERRED

PRD `innovation-novel-patterns.md:83` deferred I3's observation to "any post-release behavior-change reports." PF1 harness infrastructure shipped via Stories 4.1 (judge prompt + calibration test) + 4.2 (validation battery harness `tests/lib/pf1-validation-battery.js`). Execution + judging is gated by Story 4.3 (release-time-deferred — runs when 4.0 candidate exists with recorded baselines + post-migration outputs). **Falsification condition (per PRD L39):** ≥3 behavior-change reports in first 4 weeks post-ship despite PF1 passing. **Observation event:** Story 4.3 PF1 cycle execution + 4-week post-release report window. Per PRD L39 honest framing: "validation establishes measurement, not necessarily improvement" — DEFERRED status acknowledges that I3's full validation requires both PF1 PASS at ship + absence of behavior-change reports post-ship.

### I5 — Pre/post drift snapshot — DEFERRED (tooling-shipped, execution-deferred)

PRD `innovation-novel-patterns.md:44-46` specifies I5's observation as: "A drift snapshot comparison file exists in the release artifact, showing semantic diff between pre- and post-release outputs on the same inputs." This is an **execution-time event**, NOT tool-existence. Story 4.4 SHIPPED the drift-snapshot tooling (`scripts/audit/drift-snapshot.js` ~280 LOC LCS-based line-diff + 24 unit tests across 7 fixtures + operator protocol doc at `v63-4-4-drift-snapshot-protocol.md`); the comparison-file generation requires real pre/post recordings, which are produced during Story 4.5 N=1 external user validation cycle (release-time-deferred). **Dependency chain pinned (CM-2 V-pass):** tooling-shipped (Story 4.4 done R1+R2) → execution-deferred (Story 4.5 N=1 post-release) → comparison-file artifact (the actual I5 observation event). **Falsification condition (per PRD L46):** if the comparison reveals significant unintended drift, the release had behavioral impact PF1 alone failed to validate (PF1's sample too narrow). **Observation event:** Story 4.5 N=1 cycle executes drift-snapshot.js against live recordings.

### S2 — Dual-framing for audience — PASS

**Primary evidence:** `_bmad-output/implementation-artifacts/v63-5b-1-grep-evidence.md` (Story 5B.1 deliverable). FR42 cliché-list grep (L33-41) returns zero matches — exit code 1 (grep "no matches found"); FR43 internalOnly-vocabulary grep (L57-65) returns zero matches — exit code 1. Both tests run against the v4.0 section ONLY via `sed -n '/^## \[4\.0\.0\]/,/^## \[3\.3\.0\]/p' CHANGELOG.md` scope-narrowing per OS-1 V-pass (L19-27). **CM-1 V-pass dual-classification note** (L77): `opinionated downstream` appears in BOTH the cliché-list AND internalOnly regex — both grep tests verify the v4.0 section against the union of vocabulary rules. R1 code-review CR-H1 patch removed a "What's New" surfacing bullet that repeated a v3.3.0 feature; both pre-patch and post-patch grep runs return zero matches — patches preserved the zero-violations property.

**Falsification check (per PRD L55):** falsification was "any internalOnly phrase appears in user-facing docs." Zero matches across both regexes; dual-framing discipline empirically enforced. Hypothesis confirmed.

### L1 — Retrospective anti-pattern registry — DEFERRED (creation-review satisfied; reuse-validation deferred)

**PRD-cited observation-window correction (CR-H1 R1):** Earlier framing claimed L1 had "no PRD-cited observation-window" — this was wrong. PRD `innovation-novel-patterns.md:86` IS L1's observation-window: *"Did L1's anti-pattern registry capture the real anti-patterns from 4.0? (Review the registry at retrospective time.)"* L80-85 enumerates 6 hypothesis windows (I1/S1/S3/I3/I5/S2 numbered 1-6); L86 is item 7 = L1.

**Two-component observation per PRD L62-64 (L1 hypothesis + falsification):**
1. **Creation review** (PRD L86 + L62 hypothesis "document the anti-patterns observed during 4.0 in a standing registry"): SATISFIED at this retrospective — registry shipped at `_bmad-output/planning-artifacts/convoke-anti-patterns.md` with 10 v6.3-stream anti-patterns (AP-1..AP-10) sourced from Epic 1A/2/3 retros + per-story V-pass + R1/R2 findings + PRD seed examples per L62. Registry includes Maintenance + Reuse section codifying consultation cadence per PRD L100.
2. **Reuse validation** (PRD L64 falsification clause: *"if the registry exists but is never consulted during subsequent releases, OR if the same anti-patterns recur in v4.1/v6.4 despite the registry, then the Learning Discipline was curation without feedback and failed to change behavior"*): DEFERRED — closes when v4.x or v6.4 retrospective consults the registry + tracks recurrence count. The reuse-validation half is the load-bearing falsification surface; creation alone is necessary but not sufficient.

**Status DEFERRED because reuse component dominates the L1 hypothesis test.** Creation-review-only would yield PASS (registry exists, sourced from real v6.3 observations, format-checked); but PRD L64 binds the hypothesis to recurrence-tracking which only future retrospectives can supply. The new I96 backlog entry (`provenance: v63-5b-2-retrospective`) codifies the Sprint 0 consultation discipline that closes the falsification surface from "operator must remember" to "checklist enforces." **Observation event:** future-release retrospective ingests this registry + reports recurrence count.

---

## Anti-Patterns Observed

The standing anti-pattern registry is at `_bmad-output/planning-artifacts/convoke-anti-patterns.md` (created by this story per Decision 4 + AC2). Initial population: 10 anti-patterns sourced from Epic 1A/2/3 retros + per-story V-pass + R1/R2 findings + PRD seed examples per `innovation-novel-patterns.md:62` (the L1 hypothesis paragraph). Story 5B.2 ships the registry's first instance — per PRD L86 ("Review the registry at retrospective time"), this satisfies L1's creation-review observation; reuse-validation closes at future retrospectives per L1 falsification clause.

See: [`../planning-artifacts/convoke-anti-patterns.md`](../planning-artifacts/convoke-anti-patterns.md).

---

## Backlog Findings

Per FR50 + Decision 5: retrospective findings feed `_bmad-output/planning-artifacts/convoke-note-initiative-lifecycle-backlog.md` as new/updated items with `provenance: v63-5b-2-retrospective` tag. Each modification cites the specific finding (anti-pattern OR hypothesis observation OR retro insight) that triggered it. Story 5B.2 ships AT LEAST 1 backlog modification (proves the loop closes).

See: [`../planning-artifacts/convoke-note-initiative-lifecycle-backlog.md`](../planning-artifacts/convoke-note-initiative-lifecycle-backlog.md) — search for `provenance: v63-5b-2-retrospective`.

---

## Traceability

- **PRD source:** `_bmad-output/planning-artifacts/convoke-prd-bmad-v6.3-adoption/innovation-novel-patterns.md` (canonical 7-hypothesis definitions + observation-windows L80-86 + standing-discipline analysis L88-99)
- **Sprint 0 commitment:** `convoke-prd-bmad-v6.3-adoption/success-criteria.md:72` (Release Process Checklist)
- **FR coverage:** FR47 (retrospective scheduled with owner + date + feedback process + target backlog destination); FR48 (`convoke-anti-patterns.md` registry created); FR49 (each of 7 hypotheses explicitly addressed with PASS/FAIL/DEFERRED status); FR50 (findings feed backlog with traceable provenance)
- **NFR coverage:** NFR25 (3-status partition per hypothesis)
- **Story 5B.2 spec:** [`v63-5b-2-run-retrospective-and-create-anti-pattern-registry.md`](v63-5b-2-run-retrospective-and-create-anti-pattern-registry.md)
- **Epic retros consumed:** [`epic-v63-1a-retro-2026-04-23.md`](epic-v63-1a-retro-2026-04-23.md), [`epic-v63-2-retro-2026-04-24.md`](epic-v63-2-retro-2026-04-24.md), [`epic-v63-3-retro-2026-04-25.md`](epic-v63-3-retro-2026-04-25.md)
- **PASS evidence inputs:** [`../planning-artifacts/convoke-note-sprint-1-experiments.md`](../planning-artifacts/convoke-note-sprint-1-experiments.md) (S3); [`v63-5b-1-grep-evidence.md`](v63-5b-1-grep-evidence.md) (S2)
- **DEFERRED evidence inputs:** PRD `innovation-novel-patterns.md` L80-86 (observation windows: items 1-6 for I1/S1/S3/I3/I5/S2 + item 7 = L86 for L1 per CR-H1 R1 correction); Story 4.4 ships drift-snapshot tooling; Story 4.5 release-time-deferred for execution; v6.4 adoption window for I1; 4-week post-release feedback window for S1; future retrospective reuse-validation for L1

---

## Meta

Retrospective conducted 2026-04-27 via `/bmad-create-story` + `/bmad-dev-story` for Story 5B.2 (this story IS L1's first instance per recursive observation framing). Owner: Amalik. Format: analytical-document style consistent with prior 3 epic retros (`epic-v63-1a/2/3-retro-*.md`). No stakeholder meetings; single-operator project. Next retrospective candidate: Story 5B.3 release ship close OR v4.x/v6.4 amendment if post-release falsification surfaces (S1 4-week window OR I3 behavior-change reports OR I5 drift-snapshot execution).

**Story 5B.2 closes Epic 5B 2/3** (Story 5B.1 done; this story done; Story 5B.3 release-ship remains). v6.3 progress: 22/28 stories shipped on close (verified 2026-04-27 via `grep -cE "^  v63-[0-9]+[a-z]?-[0-9]+-" sprint-status.yaml` → 28 total stories; `: done` count → 21 prior + this story closing = 22). Earlier "23/29" framing was a count drift inherited from Story 5B.1 spec narrative; CR-H2 R1 correction.
