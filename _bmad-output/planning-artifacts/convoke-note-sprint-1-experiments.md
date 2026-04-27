---
initiative: convoke
artifact_type: note
qualifier: sprint-1-experiments
created: '2026-04-27'
schema_version: 1
experiment_ids: [EXP1, EXP2, EXP3]
experiment_verdicts: {EXP1: PASS, EXP2: PASS, EXP3: PASS}
consolidated_decision: "All three Sprint 1 experiments PASS — three foundational bets validated (migration safety, marketplace viability, platform-agnostic publishing), enabling Convoke 4.0 to ship with confidence on all three workstreams."
---

# Sprint 1 Experiments — Consolidated Log (Convoke 4.0)

**Pre-registered hypothesis (innovation-novel-patterns.md L28):** "If we pre-register EXP1/EXP2/EXP3 with go/no-go criteria before Sprint 1 starts, then each experiment will produce a documented decision that shapes downstream scope, rather than being run and ignored."

**Status:** all three experiments completed; verdicts and downstream impacts logged below per FR33 + FR34 + M5.

**Lifecycle note:** EXP3 was resolved early (2026-04-12) and has its own standing artifact (`convoke-note-exp3-platform-agnostic-smoke-test.md`); EXP1 + EXP2 ran during Stories 1A.4 + 3.3 dev cycles (substantively — the experiments and the Stories' work are the same activity; this artifact provides retrospective FR33/FR34/M5 framing).

---

## EXP1 — Migration dry-run on one agent

### Design

**Pre-registered criterion (per M4 + Sprint 1 plan):** migration produces empty filesystem diff on ≥1 sandbox fixture (i.e., dry-run + apply on a controlled fixture should preserve byte-identical pre-section content + apply v4 template only to the targeted regions).

**Subject:** sandbox fixture representing one v3.x agent (`bmad-agent-bme-contextualization-expert` analog) per Story 1A.4's tmpDir-fixture testing pattern (per `test-fixture-isolation` rule).

**Tool:** `scripts/update/migrations/3.3.x-to-4.0.0.js` (`scripts/update/migrations/3.0.x-to-4.0.0.js` + `3.1.x-to-4.0.0.js` + `3.2.x-to-4.0.0.js` thin wrappers extend chain coverage post-R1).

**Primary evidence:** [`v63-1a-4-create-migration-script-3-x-to-4-0-js.md`](../implementation-artifacts/v63-1a-4-create-migration-script-3-x-to-4-0-js.md) — Story 1A.4 spec + Completion Notes List + Change Log.

### Results

- **5-phase migration completed** (Detect → Phase 2 module configs → Phase 3 SKILL.md sweep → Phase 4 deprecation banner → Phase 5 convoke-doctor diff) per [Story 1A.4 Completion Notes](../implementation-artifacts/v63-1a-4-create-migration-script-3-x-to-4-0-js.md#completion-notes-list).
- **AC4 byte-identical preservation verified** — Phase 3 template-based rewrite uses line-index splice (not substring replace); 5 tests cover happy path, byte-identical preservation of pre-section content, CRLF handling, missing section, non-canonical step-1.
- **AC6 convoke-doctor diff** — fail-soft warnings to stderr, state still completes; "convoke-doctor unchanged (2 pre-existing findings carried forward from 1A.1 baseline)" per Completion Notes — i.e., the migration introduced ZERO new doctor findings.
- **Test coverage:** 19 tests across 7 suites; full suite 1258/1258 pass at story close.

### Verdict

**PASS** — pre-registered criterion (empty filesystem diff per M4) substantively met. Migration runs cleanly on sandbox fixture; byte-identical preservation verified at per-file level; doctor baseline unchanged.

**EO-1 V-pass nuance guard (Task 2.2.1):** Story 1A.4 surfaced a registry-pattern constraint (migration name `3.x` couldn't be used; had to be version-anchored `3.3.x-to-4.0.0`) **during initial implementation** (Task 8 register entry). Initial story-close shipped only the `3.3.x-to-4.0.0` entry, leaving 3.0/3.1/3.2 users uncovered. **R1 review's D2 decision resolved** the chain-coverage gap by adding parallel registry entries (`3.0.x-to-4.0.0.js`, `3.1.x-to-4.0.0.js`, `3.2.x-to-4.0.0.js` as thin wrappers) — chain coverage now extends to all 3.x users. **CR-M4 R1 framing fix:** the constraint was *discovered during initial implementation*, then *resolved at R1 review*; previous wording conflated the two phases. **This is itself an instance of the L28 hypothesis**: experiment outcome (constraint discovery) shaped downstream decision (parallel entries). Verdict remains binary PASS post-R1 because the chain-coverage gap was closed before story close.

### What this changed downstream (FR34)

**WS1 migration workstream proceeded with confidence.** The dry-run validation provided empirical evidence that the 5-phase migration design works on a controlled fixture. M9 PF1 gate scope (Story 4.3) was unchanged by this experiment outcome — the migration's behavioral-equivalence assumption held for the sandbox-fixture pattern. **No scope cuts triggered.** Idempotency / lockfile / offline-safe robustness were explicitly deferred to Story 1A.5 per pre-registered scope boundary; that deferral was informed by EXP1 demonstrating the core happy-path works. **Downstream decision shape:** EXP1 enabled Story 1A.5 to focus on robustness (re-run safety, interrupt resume) rather than re-litigating the core migration design.

---

## EXP2 — Marketplace PR pathfinder

### Design

**Pre-registered criterion (per M12a):** marketplace PR opens at upstream `bmad-code-org/bmad-plugins-marketplace` + passes PluginResolver validation (Path A: upstream CI; Path B: local PluginResolver invocation) OR documented Path-C fallback (manual schema-match per OP-4) closes M12a.

**Subject:** Convoke registry submission (`registry/community/convoke.yaml` matching FR24 schema + CONTRIBUTING template + whiteport-design-studio.yaml precedent).

**Tool:** `gh` CLI for fork + branch + PR submission.

**Primary evidence:**
- [`v63-3-3-submit-marketplace-registry-pr.md`](../implementation-artifacts/v63-3-3-submit-marketplace-registry-pr.md) — Story 3.3 spec.
- [`v63-3-3-validation-log.md`](../implementation-artifacts/v63-3-3-validation-log.md) — gate-1 (pre-submission) + gate-2 (PluginResolver via Path C manual schema-match) PASS evidence.
- [`v63-3-3-pr-link.md`](../implementation-artifacts/v63-3-3-pr-link.md) — PR #9 open at upstream `bmad-code-org/bmad-plugins-marketplace`; submission timestamp 2026-04-25T09:21:04Z; validation_status PASS.

### Results

- **Gate 1 (pre-submission):** PASS at 2026-04-25T09:09:03Z — `convoke-validate-marketplace` exit 0 (with expected version-drift WARNING; non-blocking per Story 3.1's E5 framing) + `convoke-audit-skill-dirs` 99/99 pass.
- **Gate 2 (PluginResolver schema-match):** PASS via Path C — manual verification of all 10 base-required + 5 community-only required + 5 included-optional fields. **20 ✓ / 0 ✗ / 2 ⊘** (intentional optional-field omissions per CONTRIBUTING template).
- **PR submitted:** PR #9 open at upstream; M12a satisfied per OP-4 ("upstream review responsiveness is out-of-scope for ship-blocking; manual schema-match closes M12a regardless of upstream CI behavior").
- **M12b status:** NONE_BY_RELEASE per OP-4 framing (aspirational, not ship-blocking; PR is open and awaiting BMAD org review at indeterminate timeline). **CR-M2 R1 citation note:** `pr-link.md` frontmatter records the mechanical state as `m12b_status: PENDING` (reflecting the open-PR not-yet-merged state literally); per Story 3.3 R1+R2 close + OP-4 framing ("upstream review responsiveness is out of scope for ship-blocking"), this resolves to NONE_BY_RELEASE for ship-decision purposes. Both views are correct at their respective layers — mechanical PENDING vs ship-decision NONE_BY_RELEASE.

### Verdict

**PASS via Path C** — pre-registered M12a criterion met through manual schema-match per OP-4 (upstream had no community-tier CI pipeline at submission time; no local PluginResolver tool available; manual verification closed the gate). M12b NONE_BY_RELEASE is acceptable per OP-4 contract.

### What this changed downstream (FR34)

**WS2 marketplace-distribution stream proceeded.** Path-C verdict validated OP-4's "upstream review responsiveness is out-of-scope" framing — the experiment confirmed that ship can proceed without upstream merge (Convoke npm distribution + marketplace PR open is sufficient evidence of distribution channel viability). **Submission pattern documented as Story 5A.2 playbook input** — the `gh` CLI + manual-schema-match + OP-4 framing is reusable for future BMAD-marketplace contributions. **No scope cuts.** **Downstream decision shape:** EXP2 enabled Stories 3.4 (dual-distribution parity) + 3.5 (platform adapter batch validation) to proceed without upstream-merge dependency, which would have introduced calendar uncertainty. Path-C evidence framing also informs Story 5A.2's strategic ADR (BMAD coupling decision: parallel-extension model is decoupled from BMAD review velocity).

---

## EXP3 — Platform-agnostic exporter smoke test

EXP3 ran 2026-04-12; full design, results, decision, and downstream-impact statement are documented in the standing artifact: [`convoke-note-exp3-platform-agnostic-smoke-test.md`](convoke-note-exp3-platform-agnostic-smoke-test.md).

**Summary for cross-reference:**
- **Subject:** `bmad-cis-agent-brainstorming-coach` (Carson — standalone Tier 1 persona-based agent).
- **Tool:** `scripts/portability/convoke-export.js`.
- **Platforms tested:** Claude Code + GitHub Copilot + Cursor (3 adapters).
- **Verdict:** PASS — all 3 adapters generate correctly, are self-contained (zero framework leaks), and are ready to drop into their respective platform locations.
- **Decision:** GO — Bolder Move 3 (platform-agnostic publishing) absorbed into Convoke 4.0 framing. Convoke ships everywhere, starting with the BMAD marketplace.

**Per FR34 downstream impact** (8 documented items in the standing artifact: (1) PRD framing shifts narrow → broad, (2) WS2 scope gain of ~1 validation story (Story 3.5), (3) Executive Summary update, (4) Product Scope update absorbing Bolder Move 3 from Growth to MVP, (5) Project Scoping deferred-list update, (6) archived PRD frontmatter PR2-3 status update, (7) release announcement canonicalization on broad framing, (8) architecture doc inclusion of platform-agnostic distribution as a first-class concern alongside marketplace).

---

## Net Downstream Impact

Sprint 1 experiments validated three foundational bets — **migration safety** (EXP1), **marketplace viability** (EXP2), and **platform-agnostic publishing** (EXP3) — enabling Convoke 4.0 to ship with confidence on all three workstreams. Each experiment produced load-bearing decisions that shaped subsequent scope:

- **EXP1** demonstrated migration soundness on a controlled fixture, enabling Story 1A.5 to focus on robustness (idempotency, resume, lockfile) rather than re-litigating core migration design. The registry-pattern constraint (discovered during initial implementation; resolved at R1 review per D2) led directly to the parallel-entries decision (3.0/3.1/3.2 wrappers) — itself an instance of the L28 hypothesis (experiment outcome shapes downstream decision).
- **EXP2** validated OP-4's "upstream-review-responsiveness-out-of-scope" framing, enabling Stories 3.4 + 3.5 to proceed without calendar dependency on BMAD org review. The submission pattern + Path-C precedent feeds Story 5A.2's strategic ADR (BMAD coupling: parallel-extension model decoupled from BMAD review velocity).
- **EXP3** absorbed Bolder Move 3 into 4.0, scaling WS2 scope to include cross-platform validation (Story 3.5) and shifting PRD framing from narrow ("BMAD marketplace debut") to broad ("Convoke ships everywhere, starting with the BMAD marketplace"). The standing artifact's 8 downstream-impact items collectively reframe Convoke's 4.0 positioning.

**Hypothesis confirmed (canonical L28 wording per `innovation-novel-patterns.md:28`):** "If we pre-register EXP1/EXP2/EXP3 with go/no-go criteria before Sprint 1 starts, then each experiment will produce a documented decision that shapes downstream scope, rather than being run and ignored." All three Sprint 1 experiments cleared this verifiability bar — none ran ceremonially; each produced a decision that altered downstream work (per the per-experiment bullets above + the EXP3 standing artifact's 8-item enumeration). **CR-L2 R1 wording reconciliation:** the closing now uses the canonical L28 quote verbatim rather than a re-stated short form (intro section above also quotes the canonical wording).

---

## Traceability

- **Source PRD:** `convoke-prd-bmad-v6.3-adoption/` (sharded)
- **FR coverage:** FR33 (three pre-registered experiments + go/no-go decisions), FR34 (downstream impact statements), FR35 (Sprint 1 artifact informs strategic ADR — Story 5A.2 input)
- **M coverage:** M5 (Sprint 1 artifact with go/no-go + downstream statement)
- **Hypothesis verification:** innovation-novel-patterns.md L28
- **Story 5A.1 spec:** [`v63-5a-1-run-sprint-1-experiments-and-log-decisions.md`](../implementation-artifacts/v63-5a-1-run-sprint-1-experiments-and-log-decisions.md)
- **Story 5A.2 dependency:** strategic ADR + playbook outline consume this artifact as input (hard dependency per Epic 5A sequencing)
