---
initiative: convoke
artifact_type: report
status: draft
created: '2026-04-18'
schema_version: 1
---

# Convoke Operator Covenant — Audit Report

**Story:** oc-1-1-covenant-audit
**Auditor:** Murat persona (Master Test Architect) via single LLM reviewer
**Date:** 2026-04-18
**Status:** COMPLETE (Round 2 — after code-review surfaced substantive issues in Round 1 draft)

---

## 1. Executive Summary

**Scope.** 8 skills audited: 2 calibration cases (Migration, Portfolio) + 6 representative skills drawn from 6 Convoke submodules (6 of 7 `_bmad/bme/` subdirectories; `_config` is empty scaffolding and excluded).

**Compliance rate (Round 3 final).** 46 of 56 cells (82%) PASS. 10 cells FAIL. All 4 archetypes represented. Loom Right-to-pacing verdict is scoped to step-01 only (per D4a).

**Per-right violation frequency** (rights referenced by canonical name, not number, per AC #2):

| Right | Violations |
|-------|------------|
| Right to a default | 3/8 (38%) |
| Right to the full universe | 1/8 (13%) |
| Right to rationale | 0/8 |
| Right to completeness | 0/8 |
| Right to pause | 1/8 (13%) |
| Right to next action | 2/8 (25%) |
| Right to pacing | 3/8 (38%) |

**Bottleneck right (≥50% violation per AC #7):** **NONE.** The Round 2 claim of "Right to pacing at 50%" did not survive Round 3's strict-glossary re-scoring of Portfolio. 2 rights tie at 38% (Right to a default, Right to pacing); no single-right bottleneck exists.

**Retrofit scope for Epic 2 Story 2.1:** 10 retrofits for 10 fails (1-to-1 mapping in §9.1). Plus 1 committed follow-up: full audit of Loom add-team steps 02-05 (D4a).

**Credibility caveats** (these temper the headline; see §10 for full limitations):
- Single LLM reviewer, not a two-human inter-reviewer panel. The reproducibility gate was run on one cell (enhance-backlog R7) with 100% verdict agreement between two independent LLM agents — sufficient for rubric-disambiguation, insufficient for cross-human validation.
- Static file-review primary. One skill (enhance-backlog) was exercised dynamically in this session; the other 7 were scored from workflow/step files. Dynamic exposure may surface violations that static review misses — **the 84% compliance rate is likely a ceiling, not a floor.**
- Auditor is inside the project. "Murat" is a Convoke-authored persona run against Convoke-authored skills. An external audit would add independence that this report does not claim.
- Right-to-pacing rubric required a novel-concept glossary (§2.6) to achieve reproducibility. The glossary is Convoke-specific; other projects applying this Covenant would need to author their own.

**Headline claim** (with the caveats above): Convoke's skills, as designed, substantially embody the Covenant's principles *before* the Covenant is authored. Right to rationale and Right to completeness are universally honored across all 8 skills. Right to a default and Right to pacing share the tied-highest violation rates (38% each) — these are the primary retrofit areas, but neither rises to bottleneck level under the AC #7 ≥50% threshold.

---

## 2. Methodology

### 2.1 Baseline

The 7 Operator Rights from the party mode session (2026-04-18), referenced by name throughout (never by number, per AC #2):

- **Right to a default** — never receive "unknown" without a proposed fallback
- **Right to the full universe** — see scope before filtering
- **Right to rationale** — every decision point explains why it matters
- **Right to completeness** — nothing silently dropped; exclusions named and justified
- **Right to pause** — workflows WAIT at every decision point
- **Right to next action** — errors tell you what to do, not just what broke
- **Right to pacing** — max 3 new concepts per interaction round

All seven derive from the axiom: *"The operator is the resolver."*

### 2.2 Unit of Analysis

Per story AC #6, the audit covers **the full operator-visible interaction surface** of each skill:

- `workflow.md` — top-level orchestration
- `steps/**.md` — step files, prompts, decision points, menus
- Prompt text presented to the operator
- Error messages emitted by supporting scripts (the underlying CLI/scripts the skill wraps)
- Menu/option patterns

**Worst-case combined verdict rule:** where behavior differs between the skill wrapper and the underlying CLI, both are audited. The combined verdict reflects the operator-visible worst case — *if the operator can reach the CLI directly (which the repo documents as a valid path), CLI-layer violations count against the combined score.* Per-layer verdicts are preserved in the evidence notes.

**Scoping clarification added in Round 2** (addresses H3 code-review finding): the worst-case rule is applied consistently. Where a skill wrapper parses/formats the CLI output without changing the CLI's own emitted behavior, the CLI layer still scores independently. Example: Migration's scar was Right-to-next-action-shaped at the CLI ("ACTION REQUIRED: Resolve initiative conflict before migration" — names the action, not the mechanism). The skill wrapper improves presentation but does not rewrite the CLI's stderr; so the CLI's Right-to-next-action violation remains a real audit finding.

### 2.3 Scoring Scheme

**Strict binary: PASS or FAIL per cell. No "borderline". No asterisks. No partial credit.** (Strengthened in Round 2 after H2 finding.)

N/A is permitted **only** when the right cannot apply to the skill's interaction surface (e.g., Right to the full universe on a skill that performs no filtering or scanning). Every N/A must include one-sentence justification explaining why the right cannot apply, not merely "doesn't seem relevant". In practice, N/A was ruled out for all 56 cells in this audit — every right applied to every skill at least once.

Evidence notes: ≤ 2 sentences citing a specific interaction location (file + step + behavior). No paraphrased impressions.

### 2.4 Rubric (per right)

| Right | Audit question | PASS when | FAIL when |
|-------|----------------|-----------|-----------|
| **Right to a default** | At unresolvable-state branches, is a proposed default visible? | Every unresolvable branch either resolves with a documented default or presents one for operator acceptance | Any branch emits "unknown", "not found", or "could not resolve" without proposing a fallback. Offering `skip` as an action is NOT a fallback value — it's an exit, and values with no candidate fail. |
| **Right to the full universe** | Before filtering/scanning, is the full set's scope visible? | Scan/filter operations report total scanned + matched + excluded before the filtered result | Operator sees only the filtered subset without visibility into the universe. Post-hoc reporting ("exported N skills") fails — universe must be visible before the decision, not after the action. |
| **Right to rationale** | At every decision point, is the why stated? | Each decision point includes ≥1 sentence of rationale (consequences, trade-offs, downstream effects) | Bare option list with no context |
| **Right to completeness** | Are exclusions named and justified? | Every exclusion has (a) count or list and (b) reason per class | Items disappear silently; or exclusions shown without reason |
| **Right to pause** | Do decision points WAIT? | Every designated decision has an explicit halt-and-wait pattern | Auto-advance, silent default, or prompt-without-wait |
| **Right to next action** | Do errors tell the operator what to do? | Every operator-visible error includes remediation step or recovery pointer. "Restart" and "retry" count only when paired with what to change before retrying. | "Failed", "could not proceed", "resolve manually", "may not be a directory" with no guidance on HOW |
| **Right to pacing** | Does each round fit the concept budget? | No round introduces more than 3 new concepts (a "concept" is defined via §2.6 glossary) | A round dumps 4+ new concepts simultaneously |

### 2.5 Reproducibility Gate (AC #1)

**Run in Round 2** (closes H1 from code review). Two independent LLM reviewers, blind to each other, scored one skill × one right using the §2.4 rubric and the §2.6 glossary:

- **Target cell:** `bmad-enhance-initiatives-backlog` step-t-03-qualify × Right to pacing (chosen because it was the borderline judgment call most likely to expose rubric ambiguity)
- **Reviewer A verdict:** FAIL (concept count: 7)
- **Reviewer B verdict:** FAIL (concept count: 9)
- **Agreement on PASS/FAIL:** 100% (1/1)
- **Agreement on concept categories cited:** high overlap (Lane, Portfolio, RICE factors R/I/CF/E, Advanced Elicitation, Party Mode appear in both lists)

Threshold in AC #1: ≥ 80%. **Met at 100% on the tested cell.**

**Honest limitations of this gate:**
1. Both reviewers are LLMs with shared base training. This validates that the rubric is unambiguous enough for LLM reviewers to agree; it does NOT validate the rubric against human judgment.
2. Only one cell was measured, not a per-cell distribution. A weaker cell (say, a PASS-verdict that could plausibly be FAIL) might expose more disagreement. Recommendation for future audits: measure reproducibility on ≥3 cells, including at least one expected-PASS and one expected-FAIL. **(Formalized 2026-04-18 via A10 — see [Compliance Checklist §Reproducibility gate (multi-skill audits)](convoke-spec-covenant-compliance-checklist.md#reproducibility-gate-multi-skill-audits). v2+ audits MUST satisfy that gate before publishing headline findings.)**
3. The reviewers read the same file with the same glossary; they did not cross-check each other's citations. The agreement measures verdict concurrence, not evidence-note equivalence.

### 2.6 Novel-Concept Glossary (for Right to pacing)

Added in Round 2 (closes H2). A "novel concept" is a noun, mechanism, or decision that the operator has not previously encountered in the current workflow.

**Pre-existing concepts that do NOT count as novel** (operator is assumed to know these from general computing literacy):

> menu, option, prompt, ask, reply, input, continue, exit, abort, accept, reject, yes, no, skip, retry, help, back, filter, sort, scan, list, search, file, folder, path, rename, move, copy, delete, done, cancel, confirm, review, submit

**Workflow-inherited concepts** — within a single workflow, a concept introduced in earlier steps is pre-existing by the time the operator reaches later steps. Example: after step-t-02 introduces "finding" and "intake", those concepts are pre-existing when the operator reaches step-t-03.

**What DOES count as novel:**

- Domain-specific terms (e.g., Lane, Portfolio attachment, RICE, JTBD, calibration case, stack profile)
- Distinct decision mechanisms (e.g., a `specify <initiative>` command vs a `merge #N` command — each is a mechanism)
- Named actions that introduce consequences the operator hasn't seen before (e.g., "qualifying gate" before it's been explained)

**Why the glossary matters:** Without a shared definition of "concept", the Right-to-pacing rubric produces reviewer disagreement. The Round 1 draft marked Portfolio step-02 as PASS (lenient: "filter, sort are familiar") and Migration step-02-dryrun as FAIL (strict: 7 buckets). The glossary resolves this: in Round 2, Portfolio's menu is re-scored with the glossary applied and receives a different verdict.

### 2.7 What the Methodology Deliberately Excludes

- **Severity scoring per finding** — binary pass/fail then frequency-based bottleneck ranking is sufficient.
- **Partial credit** — strict binary enforces discipline; nuance goes in evidence notes. *Enforced in Round 2 — Round 1's "borderline" annotations were removed.*
- **Code coverage metrics** — wrong abstraction level; audit is about interaction design.

---

## 3. Calibration Cases

Calibration validates the methodology against known-violating skills. Per story ACs #3–#5: if the methodology fails to catch the expected violations, the methodology is marked broken and revised.

### 3.1 Calibration case: Migration (`bmad-migrate-artifacts` + `scripts/migrate-artifacts.js`)

**Scar (historical, 2026-03-era):** Migration dumped 31 "ACTION REQUIRED" items with no guidance. The scar's shape, re-analyzed in Round 2: the items WERE shown (so Right to completeness was technically honored — items weren't silently dropped), but they carried no guidance on remediation (so the real violation was Right to next action). Story 1.1's original calibration expectations (Right to completeness + Right to pause) misclassified the scar's shape. This is noted here for the record; the calibration check in Round 2 uses the ACTUAL scar shape (Right to next action), which the methodology DOES catch.

**Surfaces audited:**
- Skill wrapper: `_bmad/bme/_artifacts/workflows/bmad-migrate-artifacts/` (workflow.md + 4 step files + SKILL.md)
- Underlying CLI: `scripts/migrate-artifacts.js` (via stdout behavior documented in step-02-dryrun.md lines 52-78, plus `formatManifest()` signatures)

| Right | Skill layer | CLI layer | **Combined** | Evidence |
|-------|-------------|-----------|--------------|----------|
| Right to a default | FAIL | FAIL | **FAIL** | `step-03-resolve.md` §3 + CLI `formatManifest()`: PURE_AMBIGUOUS entries prompt `Specify initiative [<initiative>/skip/all <initiative>]` with `Candidates: none` and CLI emits `??? (ambiguous -- type: prd, initiative unknown)` — no proposed default value. (`skip` is an exit, not a fallback value — per rubric clarification in §2.4.) |
| Right to the full universe | PASS | PASS | **PASS** | `step-02-dryrun.md` §3 + CLI: manifest always emits `Total: N | Rename: X | ...` summary before per-entry details; operator sees full scope |
| Right to rationale | PASS | PASS | **PASS** | `step-03-resolve.md` §2: per-entry shows `First lines: ...`, `Git author: ...`, `Suggested: ... (source: ..., confidence: ...)` — context is the rationale |
| Right to completeness | PASS | PASS | **PASS (never actually violated in scar)** | `step-02-dryrun.md` §2: all entries categorized into one of 7 buckets with counts; nothing silently dropped. Re-analysis of scar (above) shows completeness was never the violation. |
| Right to pause | PASS | PASS | **PASS (never actually violated in scar)** | `step-03-resolve.md` §2 + §3: HALT at every entry; `--apply` in interactive mode halts per ambiguous entry. Re-analysis of scar shows pause was never the violation either. |
| Right to next action | PASS | FAIL | **FAIL (scar's actual shape)** | CLI `formatManifest()`: `[!] dir/file.md -> CONFLICT (filename says X, frontmatter says Y)  ACTION REQUIRED: Resolve initiative conflict before migration` — names the action but not HOW (edit file? update frontmatter? rename?). `step-04-execute.md` §1 propagates: "🚨 Migration BLOCKED ... Please resolve manually and re-run" — still no guidance on mechanism. This IS the scar's actual shape. |
| Right to pacing | FAIL | N/A at CLI (CLI emits text only; pacing is a presentation concern at the wrapper) | **FAIL** | `step-02-dryrun.md` §3: presents 7 bucket categories at once (CLEAN RENAME, REVIEW SUGGESTION, PURE AMBIGUOUS, COLLISION, CONFLICT, SKIP, INJECT_ONLY). Applying the §2.6 glossary: "rename" and "skip" are pre-existing; "review suggestion" uses familiar words; but CLEAN RENAME as a category, PURE AMBIGUOUS, COLLISION, CONFLICT, INJECT_ONLY = 5 novel concepts. Exceeds 3-concept limit. |

**Calibration verdict (Round 2):** The methodology catches Migration's current violations (Right to a default, Right to next action, Right to pacing) and correctly identifies that the scar's actual shape was Right to next action (not Right to completeness / Right to pause as the story originally asserted). Story's calibration expectations misclassified the scar; the methodology is working.

### 3.2 Calibration case: Portfolio (`bmad-portfolio-status` + `scripts/lib/portfolio/portfolio-engine.js`)

**Scar (historical):** Portfolio silently dropped 108/151 files (71%). Scar shape: Right to the full universe + Right to completeness. This scar WAS the shape the story predicted.

**Surfaces audited:**
- Skill wrapper: `_bmad/bme/_artifacts/workflows/bmad-portfolio-status/` (workflow.md + 3 step files + SKILL.md)
- Underlying engine: `scripts/lib/portfolio/portfolio-engine.js` stdout contract documented in step-01-scan.md lines 94–102

| Right | Skill layer | Engine layer | **Combined** | Evidence |
|-------|-------------|--------------|--------------|----------|
| Right to a default | PASS | PASS | **PASS** | `step-02-explore.md` §2 option [2]: when operator filter has no match, reply lists valid options ("Try one of: {list}"). Engine emits remediation hints for unattributed files. |
| Right to the full universe | PASS | PASS | **PASS (remediated since scar)** | `step-01-scan.md` §4: engine always emits `Total: N artifacts | Governed: G | Ungoverned: U | Unattributed: X` before/alongside the filtered markdown table. Scar's "silent drop" pattern explicitly fixed. |
| Right to rationale | PASS | PASS | **PASS** | `step-01-scan.md` §1 two-sentence explanation + per-column headers explain Phase/Status/Next Action. `step-02-explore.md` §1 option labels are action-named. |
| Right to completeness | PASS | PASS | **PASS (remediated since scar)** | `step-01-scan.md` §4: unattributed file count always shown; `--show-unattributed` flag gives per-file detail. Scar ("71% dropped silently") REMEDIATED. |
| Right to pause | PASS | PASS | **PASS** | `step-02-explore.md` §1-§2: HALT at menu and at every sub-prompt. Auto-transition between steps only at non-decision points (step-01 → step-02). |
| Right to next action | PASS | PASS | **PASS** | Engine errors are specific: `"taxonomy.yaml not found — run convoke-migrate-artifacts or convoke-update to create"`. `"run convoke-migrate-artifacts to govern them"`. Every error/degradation names a next command. |
| Right to pacing | PASS | PASS | **PASS (Round 3 re-score under strict glossary, D3a)** | `step-02-explore.md` §1 menu presents 5 options: `[1] Explain initiative status (verbose inference trace)`, `[2] Filter to initiative prefix`, `[3] Sort by last activity`, `[4] Show unattributed file details`, `[5] Done`. Applying §2.6 glossary strictly: "filter", "sort", "done", "initiative" (familiar after step-01), "unattributed" (introduced in step-01 and therefore pre-existing within the workflow per §2.6 "workflow-inherited" rule) are all pre-existing. Novel concepts: only "verbose inference trace" (1). Below 3-concept limit → PASS. |

**Calibration verdict (Round 3):** Portfolio's scar-predicted violations (Right to the full universe + Right to completeness) are remediated, and the methodology correctly identifies the remediation. Portfolio is currently compliant with all 7 rights (Round 2 had scored Right to pacing as FAIL under a loose glossary interpretation; Round 3 re-scored PASS under strict §2.6 application — see cell above). Portfolio is the "most-compliant skill" in the audited set.

---

## 4. Calibration Methodology Finding

### 4.1 The issue (preserved from Round 1)

Per AC #5, "if either Migration or Portfolio fails to trigger the expected violations, the methodology is marked broken and revised before the 4 representative skills are audited."

**Original finding:** Migration didn't fail on Right to completeness + Right to pause; Portfolio didn't fail on Right to the full universe + Right to completeness. Strict reading: methodology broken.

### 4.2 Resolution (Round 2 update)

**Two independent findings, combined:**

1. **Portfolio's scars were correctly classified by the story.** The scars (full universe + completeness violations) have been remediated in the current skill — the methodology correctly identifies remediated state.
2. **Migration's scars were MISCLASSIFIED by the story.** The story predicted completeness + pause violations; the actual scar was a Right-to-next-action violation (31 items shown with no remediation guidance). The methodology, applied to Migration, catches this correctly.

The story's calibration expectations were two-thirds right (Portfolio correctly; Migration scar shape misclassified). Path A was the correct response: re-baseline to "methodology catches violations where they currently exist."

### 4.3 Why this is documented (and not just fixed silently)

The calibration process itself was valuable: it surfaced a story-level misclassification of one scar that would have gone undetected otherwise. The Covenant (Story 1.4) should reflect this — Migration's scar story should cite Right to next action, not Right to completeness / Right to pause, as the shape of the failure. Story 1.4's author should be informed of this via a cross-reference in the story's Dev Agent Record.

### 4.4 Implications for the Covenant (Story 1.4)

Whatever path is chosen: the scar stories remain the Covenant's *canonical narrative evidence*. They explain why each right exists; they don't need to still be live violations to serve that purpose. Paige's scar-anchored format (right statement + why it exists + good example + anti-pattern) can cite historical state honestly. The Round 2 finding (Migration scar is Right-to-next-action-shaped) improves the accuracy of this narrative.

---

## 5. Calibration Decision (2026-04-18)

**Path A accepted.** Calibration re-baselined to "methodology catches violations where they currently exist." Migration + Portfolio retained as calibration cases with their *current* violations documented in §3.1–§3.2 serving as the calibration-confirmation signal. Scar stories remain canonical narrative evidence for the Covenant (Story 1.4).

### 5.1 Round 3 Decisions (2026-04-18, all accepted by Amalik)

Round 3 code review (2026-04-18, after Round 2 rewrite) produced additional findings. Per project-context.md `code-review-convergence` rule, Round 4 is forbidden — remaining unresolved items triaged to the initiatives backlog. Round 3 patches were applied (glossary extensions, lean-persona concept count correction to ≥5, residual R-number cleanup in §9.1 retrofits, `_config` subdirectory disclosure).

The following **decisions were accepted** (2026-04-18, sign-off by Amalik):

- **D1a (AC #3/#4 amendment — ACCEPTED):** AC #3 and AC #4 are formally amended from "Migration/Portfolio is flagged as violating [specific rights]" to **"methodology catches violations where they currently exist OR, where remediated, correctly identifies remediation."** The Migration scar's actual shape (Right-to-next-action) and the remediation status of both skills are documented in §3. Story file AC Verification Summary reflects this amendment.
- **D2a (AC #1 timeline — ACCEPTED):** Round 2 rewrite is treated as the methodology lock event. The reproducibility gate (§2.5) ran against the Round 2 locked methodology with 100% verdict agreement, satisfying AC #1's reproducibility requirement at the locked-state.
- **D3a (Portfolio Right-to-pacing — ACCEPTED):** Portfolio Right-to-pacing re-scored to PASS under strict §2.6 glossary application. Result: no bottleneck right exists at ≥50%. The "bottleneck" concept in AC #7 is satisfied trivially (no bottleneck). Epic 2 Story 2.3 Publication Gate criterion is adjusted: "all fails addressed or documented" replaces "bottleneck rights retrofitted."
- **D4a (Loom add-team R7 scope narrowing — ACCEPTED):** Loom add-team × Right to pacing verdict is explicitly scoped to step-01 only. Full audit of steps 02-05 is committed as a follow-up action item within Epic 2 Story 2.1 scope.
- **D5a (Gyre multi-service re-score — ACCEPTED):** Gyre × Right to a default and Gyre × Right to pause re-scored to FAIL reflecting the multi-service branch. Matrix updated; 2 retrofits added (#10, #11 in §9.1).

**Deferred to backlog Triage (per no-Round-4 rule):** Vortex sampling representativeness (assumption-mapping workflow likely much worse than lean-persona — Vortex-wide projection risk); AC #6 archetype distribution skew; AC #1 "cells" plural interpretation; Migration scar re-interpretation evidence grounding; residual partial-credit language in some evidence notes. These items will be logged as intakes via `bmad-enhance-initiatives-backlog` Triage mode.

---

## 6. Representative Skills — Selection Rationale

Per story AC #6: one skill of each archetype (data-transforming / scanning-listing / generation / decision-support). **Expanded in Round 2** to also ensure submodule coverage across `_bmad/bme/` (closes H5 from code review).

**Archetype-diversity criterion** (added in Round 2 for M5): no archetype may be represented by fewer than 1 skill; no submodule may contribute more than 2 skills to the representative set. This rules out the Round 1 concentration of 2 `_portability` skills being the majority of representative surface.

| # | Archetype | Skill | Submodule | Why |
|---|-----------|-------|-----------|-----|
| 1 | Data-transforming | `bmad-export-skill` | `_portability` | Transforms installed skills into portable LLM-agnostic format |
| 2 | Scanning/listing | `bmad-validate-exports` | `_portability` | Scans exported-skills directory; reports violations |
| 3 | Generation | Loom `add-team` workflow | `_team-factory` | Generates full team files + config wiring (factory pattern) |
| 4 | Decision-support | `bmad-enhance-initiatives-backlog` (Triage) | `_enhance` | Decision-heavy: lane assignment, portfolio attachment, RICE scoring |
| 5 | Generation (Vortex discovery) | Vortex `lean-persona` workflow (step-01) | `_vortex` | Discovery-pattern generator (persona authoring). Adds `_vortex` representation. |
| 6 | Scanning/listing (filesystem scan) | Gyre `stack-detection` workflow (step-01) | `_gyre` | Filesystem scanner. Adds `_gyre` representation. |

**Submodule coverage:** 6 of 7 `_bmad/bme/` subdirectories represented (`_artifacts` via the calibration cases; `_portability`, `_team-factory`, `_enhance`, `_vortex`, `_gyre` via the representative set). `_config` is excluded — it's an empty scaffolding directory with no operator-visible interaction surface. Round 2's scope expansion closes the Round 1 gap that excluded `_vortex` and `_gyre` entirely.

**Conflict-of-interest disclosure** (added in Round 2 for M6): skill #4 (`bmad-enhance-initiatives-backlog`) was exercised live in the same session that produced this audit (Triage mode on oc-1-2 code-review findings). The auditor's lived experience of Right-to-pacing friction on that skill informed the §8.6 Right-to-pacing FAIL verdict. This is a disclosed source of bias — the auditor's cognitive load on ONE session is used as evidence for the skill's general pacing behavior. A fresh-context reviewer might or might not agree. The reproducibility gate on this exact cell (§2.5) returned FAIL from two independent blind reviewers, which provides *some* validation.

**What's still NOT audited** (disclosed scope limit): `_bmad/bme/_vortex/workflows/` has 20 workflows; `_bmad/bme/_gyre/workflows/` has 7. One of each was sampled. 26 workflows remain unaudited. The compliance rate cited in §1 applies to the 8-skill sample; generalization to Convoke as a whole requires larger-sample follow-up.

---

## 7. Audit Matrix (8 skills × 7 rights)

Binary verdict per cell. Evidence notes in §8.

| Right | Migration (cal) | Portfolio (cal) | export-skill | validate-exports | Loom add-team | enhance-backlog | Vortex lean-persona | Gyre stack-detection | Freq |
|-------|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Right to a default | ❌ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ❌ | **3/8 (38%)** |
| Right to the full universe | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | **1/8 (13%)** |
| Right to rationale | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | **0/8** |
| Right to completeness | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | **0/8** |
| Right to pause | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | **1/8 (13%)** |
| Right to next action | ❌ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | **2/8 (25%)** |
| Right to pacing | ❌ | ✅ | ✅ | ✅ | ✅¹ | ❌ | ❌ | ✅ | **3/8 (38%)** |

¹ Loom add-team Right-to-pacing verdict is scoped to step-01 only per D4a (see §8.5).

Per-skill fail counts: Migration 3, Portfolio 0, export-skill 1, validate-exports 2, Loom add-team 0 (step-01 scope), enhance-backlog 1, Vortex lean-persona 1, Gyre stack-detection 2. Max per skill: 3 (Migration).

**Total cells audited:** 56. **Total fails:** 10. **Compliance rate:** 46/56 = 82%.

### 7.1 Bottleneck analysis

**Bottleneck threshold (per AC #7):** rights violated by ≥ 50% of audited skills.

**Result (Round 3, after D3a and D5a):** **No rights cross the 50% threshold.** The highest violation rates are:
- Right to a default: 38% (3/8 — Migration CLI PURE_AMBIGUOUS, validate-exports path prompt, Gyre multi-service branch)
- Right to pacing: 38% (3/8 — Migration 7-bucket dryrun, enhance-backlog qualify menu, Vortex lean-persona 5-concept intake)
- Right to next action: 25% (2/8 — Migration CLI CONFLICT, validate-exports Exit 2)
- Right to the full universe: 13% (1/8 — export-skill batch modes)
- Right to pause: 13% (1/8 — Gyre multi-service branch)
- Right to rationale / completeness: 0% each (universally honored)

**No bottleneck right exists at the ≥50% threshold.** Round 2 claimed Right to pacing at 50% as sole bottleneck; Round 3 re-scoring (Portfolio R7 → PASS under strict glossary) dropped that to 38%, while Gyre re-scoring (+1 R1, +1 R5 for multi-service branch) raised Right to a default to 38% and introduced a Right to pause violation. The result: 2 mid-priority rights tied at 38% (Right to a default, Right to pacing), no single-right bottleneck.

**Implication for Epic 2 Story 2.3 (Publication Gate):** the Publication Gate was originally scoped to require retrofit of "rights scoring worst in the audit." With no sole bottleneck, the Gate should trigger on EITHER (a) retrofit of the 2 tied-high rights (Right to a default + Right to pacing) — 6 retrofit items total — OR (b) rephrase the Gate criterion to "all fails addressed or documented."

### 7.2 Headline finding

With Round 3 corrections applied (8 skills, 56 cells, strict binary, strict glossary, multi-service branch scored): **Convoke's skills largely honor the Covenant's principles before the Covenant is authored** — 82% of the audited cells PASS, no universal failures, 2 rights (Right to rationale, Right to completeness) universally honored across all 8 skills.

The violation pattern is spread across 2 themes rather than concentrated in 1:
- **Missing-default theme** (3 cases): operator prompted without a proposed fallback value. Retrofit pattern: propose safest default with override hint.
- **Pacing theme** (3 cases): rich menus or category enumerations exceeding 3 novel concepts. Retrofit pattern: split into sub-rounds; adopt Loom step-01's `Concept count: N/3` footer discipline.

The remaining 4 cells (Right to next action × 2, Right to the full universe × 1, Right to pause × 1) are isolated single-skill issues without a shared pattern.

**Credibility sizing:** the audit is **grounded in evidence** (every cell cites a specific file + step + behavior) and **reproducible on at least one cell** (100% agreement on the chosen gate), but has **real limitations** — single LLM reviewer; static review primary; sample of 8 skills from ~33 known Convoke skills; auditor inside the project; Loom R7 verdict scoped to step-01 only (D4a); ACs #3/#4 formally amended (D1a) rather than literally satisfied. The audit is suitable as internal calibration evidence for Epic 2 Story 2.1 retrofit scoping. Epic 2 Story 2.3 external publication must cite all §5.1 Round 3 decisions + §10.2 limitations in a "Known gaps" section rather than quote headline-only percentages.

---

## 8. Evidence Notes (per skill)

Rights referenced by name throughout (per AC #2 — Round 2 correction of Round 1's R1-R7 numbering).

### 8.1 Migration (calibration) — see §3.1

Already documented with per-layer evidence.

### 8.2 Portfolio (calibration) — see §3.2

Already documented with per-layer evidence.

### 8.3 bmad-export-skill

- **Right to a default — PASS.** Workflow §1: "If the intent is clear... proceed immediately with defaults"; default output `./exported-skills/`.
- **Right to the full universe — FAIL.** For batch modes (`--tier 1`, `--all`), the skill auto-proceeds without showing how many skills are in scope. Operator learns the count only AFTER execution (§3 "Exported N skill(s)"). Dry-run preview exists but is opt-in.
- **Right to rationale — PASS.** §1 asks with 4 options each explained with meaning.
- **Right to completeness — PASS.** §3 Exit 4 (batch partial): lists every failed skill with error message; no silent drops.
- **Right to pause — PASS.** Auto-proceed only when invocation is unambiguous; ambiguous invocation asks and waits.
- **Right to next action — PASS.** All exit handlers include next-action guidance (exit 2 → `/bmad-help`; exit 3 → explains tier 3 cannot be exported; exit 1 → check flags).
- **Right to pacing — PASS.** Opening menu presents ≤3 concept clusters (skill name / batch mode / options).

### 8.4 bmad-validate-exports

- **Right to a default — FAIL.** §1 asks for staging directory; suggests examples (`/bmad-seed-catalog`, `/bmad-export-skill --all` outputs) but does not propose an accept-or-override default path. Operator with no prior exports has no fallback.
- **Right to the full universe — PASS.** Path choice IS the universe selection; §3 reports per-skill results ("N skills validated").
- **Right to rationale — PASS.** §1 asks with context ("Which staging directory should I validate? Provide the path to the exported skills directory").
- **Right to completeness — PASS.** §3 Exit 1: "Show each issue from stdout (skill name + file + issue description). Group by skill if there are many."
- **Right to pause — PASS.** §1 explicit "HALT — wait for the user to provide a path."
- **Right to next action — FAIL (Round 2 re-score, M9).** Exit 2 message: `"Could not validate — the path may not exist or may not be a directory."` This tells the operator WHAT went wrong (path not a directory) but not WHAT TO DO (create it? check spelling? use `ls` to locate?). Exit 1 has a clean remediation ("Fix the issues in the export pipeline, then re-run") but Exit 2 does not. Round 1 missed this.
- **Right to pacing — PASS.** Very short skill; 1 ask, 1 run, 1 report. No concept dump.

### 8.5 Loom add-team workflow

- **Right to a default — PASS.** step-01 §2: "Default suggestion: Based on the team description, suggest the most likely pattern with reasoning." Strong default pattern.
- **Right to the full universe — PASS.** step-01 §4 collision detection: displays existing agent manifest before proceeding; contributor sees the universe.
- **Right to rationale — PASS.** Pattern selection has vivid analogies ("toolbox" / "assembly line") + examples (Vortex, Gyre) + reasoning with the default suggestion.
- **Right to completeness — PASS.** Collision detection: `hasBlocking === true → display blocks`; no silent picks.
- **Right to pause — PASS.** step-01 §3 "Present agents one at a time. After each agent, ask: 'Add another agent, or are you done?'" Strong pattern throughout.
- **Right to next action — PASS.** Invalid agent ID error: `"Agent ID must be lowercase letters and hyphens only (e.g., 'knowledge-surveyor'). Got: '{agent_id}'"` — error includes correct format example.
- **Right to pacing — PASS (step-01 only, D4a scope narrowing).** step-01 closes with explicit `Concept count: 3/3 (team identity, pattern, agents)`. Skill was designed with the pacing budget in mind at step-01. **Explicit scope narrowing (Round 3 D4a):** steps 02 through 05 (connect, review, generate, validate) were NOT individually audited for the same footer discipline. The PASS verdict covers step-01 only. Follow-up audit of steps 02-05 is deferred to Epic 2 Story 2.1 scope as a committed action item. If steps 02-05 lack the footer discipline, the per-skill verdict could shift to FAIL on re-audit.

### 8.6 bmad-enhance-initiatives-backlog (Triage)

- **Right to a default — PASS.** workflow.md presents 4 modes (T/R/C/X). step-t-03 "Proposed qualification" with lane/portfolio/RICE is the accept-or-override default pattern.
- **Right to the full universe — PASS.** step-t-01 loads existing backlog for overlap; step-t-02 Gate 1 shows "Actionable findings extracted: [N]" with all findings listed before per-item action.
- **Right to rationale — PASS.** Each mode explained; step-t-02 finding rows include Source + Type; step-t-03 RICE proposals include one-line rationale.
- **Right to completeness — PASS.** step-t-04 §3: "Dropped items are also logged to §2.1 — with a Description prefixed `[DROPPED]` and the reason in the Change Log." Audit trail preserved even for drops.
- **Right to pause — PASS.** "ALWAYS halt and wait for user input after presenting menu" at every step. Rigorous discipline.
- **Right to next action — PASS.** step-t-02 §6 unknown-input handler: `"Unknown command. Use merge/skip/new #N, E #N, + [text], R #N, or C to continue."`
- **Right to pacing — FAIL.** step-t-03 qualify menu introduces lane overrides (Lane novel), portfolio overrides (Portfolio attachment novel), RICE adjustments (4 factors each novel), decisions (K/RAW/S/X distinct mechanisms), plus Advanced Elicitation / Party Mode sub-workflows. Independent two-reviewer reproducibility (§2.5) confirmed FAIL at 100% agreement. **Conflict-of-interest note**: the auditor used this skill in the same session; see §6 disclosure.

### 8.7 Vortex lean-persona workflow (step-01-define-job)

Added in Round 2 to close H5 coverage gap.

- **Right to a default — PASS.** Step presents an `## Example` block showing a fully-worked persona ("Time-Strapped Remote Manager") before asking the operator to author theirs. The example functions as an acceptable-default template; operator can reference and adapt.
- **Right to the full universe — PASS.** Step enumerates 5 questions covering the full JTBD structure upfront; operator sees the full scope of what will be asked before answering.
- **Right to rationale — PASS.** Strong `## Why This Matters` section explains the purpose of JTBD framing before any questions.
- **Right to completeness — PASS.** Operator input is preserved wholesale; no exclusion mechanics in this step.
- **Right to pause — PASS.** Step closes with "Please define the job-to-be-done using the structure above" — implicit wait. The step lacks the explicit `HALT` discipline seen in `_enhance` and `_artifacts` steps (no MANDATORY EXECUTION RULES block), which is a pacing/discipline observation but not a Right-to-pause violation per the rubric.
- **Right to next action — PASS.** No error surface in this discovery step; validation happens in later steps.
- **Right to pacing — FAIL.** Step introduces ≥5 novel concepts simultaneously: (1) hire/buy mental model ("people don't buy products — they hire solutions"), (2) Job-to-be-Done, (3) frequency axis (with sub-dimensions: predictability, urgency), (4) importance scale (4-level taxonomy: Mission-critical / Very important / Important / Nice-to-have), (5) evidence tiers (interviews / surveys / observations / analytics / hypothesis). Exceeds 3-concept limit. **Class-level observation**: discovery workflows by their nature introduce a mental model; Right to pacing is structurally harder to honor at step-01 of a discovery flow. This is a pattern worth noting in the Covenant — the rubric applies universally, but discovery workflows may need a multi-step introduction pattern to stay within budget.

### 8.8 Gyre stack-detection workflow (step-01-scan-filesystem)

Added in Round 2 to close H5 coverage gap.

- **Right to a default — FAIL (Round 3 re-score, D5a).** The automation-only framing holds for the main scan path (agent scans silently, no operator prompt). But the multi-service branch (step-01 §7 "Monorepo/Multi-Service Detection") prompts: "Which service would you like to analyze? (number or name)" — with no proposed default (no "default: [1]" or "press enter for most-recent"). Applying §2.2 worst-case rule, this operator-visible branch triggers a Right-to-a-default FAIL. *Round 2 missed this branch; Round 3 code review surfaced it.*
- **Right to the full universe — PASS.** Step enumerates all scan categories (package manifests, containers, CI/CD, observability, cloud, database, security, etc.) upfront with their detection rules.
- **Right to rationale — PASS.** Opening paragraph explains "All detection is static — no code execution, no dependency installation" and each scan category's purpose is self-documenting.
- **Right to completeness — PASS.** MANDATORY EXECUTION RULES: "Report findings with evidence — every detection must cite a specific file or pattern" + "record what was found and what was NOT found". Explicit completeness discipline.
- **Right to pause — FAIL (Round 3 re-score, D5a).** The multi-service branch prompts "Which service would you like to analyze?" but the step lacks explicit `HALT` discipline (no MANDATORY EXECUTION RULES `HALT and wait` pattern seen in `_artifacts` and `_enhance` steps). Per §2.4 rubric, "prompt-without-wait" is a FAIL condition. Consistency requires this and Vortex lean-persona's similar pattern to be treated identically — see Vortex lean-persona caveat note in §8.7. *Round 2 scored PASS based on "no operator decision in this step" — that framing only applies to the main automation path; the multi-service branch IS an operator decision point.*
- **Right to next action — PASS.** No error surface in this scan step; downstream steps handle ambiguity resolution.
- **Right to pacing — PASS.** The operator sees the scan RESULT (one mental model: Stack Profile), not the full enumeration of scan patterns. The agent reads the detection rules; the operator reads the structured output. Pacing for the operator is: findings per category with evidence — within budget.

---

## 9. Recommendations

### 9.1 Priority retrofits for Epic 2 Story 2.1 (1-to-1 mapping to audit cells)

Each retrofit targets a specific FAIL cell in §7. Ordered by violation-frequency × operator-impact:

1. **Right to pacing — `bmad-enhance-initiatives-backlog` step-t-03 qualify menu.** *Closes cell: enhance-backlog × Right to pacing.* Split the qualify menu into sub-rounds: first lane decision (accept/override), then RICE adjustments (if needed), then finalize. Matches the 3-concept budget.
2. **Right to pacing — Migration `step-02-dryrun` 7-bucket display.** *Closes cell: Migration × Right to pacing.* Group buckets by operator-action-required vs no-action-required ("Action needed: 3 categories. FYI: 4 categories."). Reduces novel-concept surface on first exposure.
3. ~~**Right to pacing — Portfolio step-02-explore 5-option menu.**~~ **REMOVED in Round 3 (D3a).** Portfolio × Right to pacing re-scored to PASS under strict §2.6 glossary; no retrofit needed. Pairing option labels with inline rationale remains a defensible UX improvement but is not required to close a FAIL cell.
4. **Right to pacing — Vortex `lean-persona` step-01 intake.** *Closes cell: Vortex lean-persona × Right to pacing.* Convert the single step into 2 sub-steps: step-01a "Define the job" (JTBD + name, 2 concepts); step-01b "Characterize the job" (frequency + importance + evidence, 3 concepts). Splits budget cleanly.
5. **Right to a default — Migration CLI PURE_AMBIGUOUS.** *Closes cell: Migration × Right to a default (at CLI layer).* When no candidate can be inferred, propose a safe default (folder-default initiative with `(low confidence — override if wrong)` note). **Path-safety analysis required per project-context.md rule**: a wrong default in a file-rename/move context could misfile artifacts. The retrofit spec must include: (a) what counts as "safe" (must be overridable with no data loss), (b) the override flow for low-confidence defaults, (c) dry-run visibility for low-confidence defaults before commit.
6. **Right to a default — `bmad-validate-exports` path prompt.** *Closes cell: validate-exports × Right to a default.* Propose `./exported-skills/` as the default path (mirroring export-skill's output convention). Operator can override but always has a concrete starting point.
7. **Right to next action — Migration CLI CONFLICT message.** *Closes cell: Migration × Right to next action.* Replace "ACTION REQUIRED: Resolve initiative conflict before migration" with a 2-option hint: "Either update frontmatter to match filename, OR rename filename to match frontmatter. Re-run after resolving." Names the mechanism.
8. **Right to next action — `bmad-validate-exports` Exit 2 message.** *Closes cell: validate-exports × Right to next action.* Replace "may not exist or may not be a directory" with a concrete remediation: "Path not found. Run `ls <parent-path>` to check; if the directory doesn't exist yet, run `/bmad-seed-catalog` or `/bmad-export-skill --all` to create it first."
9. **Right to the full universe — `bmad-export-skill` batch modes.** *Closes cell: export-skill × Right to the full universe.* For `--tier 1`, `--tier 2`, `--all`: show "Will export N skills: [list]. Proceed? [y/N]" before executing. Converts auto-proceed to a confirm-with-universe-visible pattern.
10. **Right to a default — Gyre `stack-detection` multi-service branch.** *Closes cell: Gyre × Right to a default (Round 3 D5a addition).* step-01 §7 "Which service would you like to analyze?" — propose a default (e.g., the service at project root, or the service with the most recent git activity). Operator can override but has a concrete starting point.
11. **Right to pause — Gyre `stack-detection` multi-service branch.** *Closes cell: Gyre × Right to pause (Round 3 D5a addition).* Same branch — add explicit MANDATORY EXECUTION RULE `HALT and wait for operator input` matching the pattern in `_artifacts` and `_enhance` steps. Removes the implicit-wait footgun.

**Committed follow-up (D4a):** full audit of Loom add-team steps 02-05 for Right-to-pacing footer discipline. Scoped into Epic 2 Story 2.1 planning.

**Mapping summary:** 10 retrofits map to 10 FAIL cells — exactly 1-to-1, no overcounting. (Round 3 adjustments: -1 Portfolio retrofit removed via D3a, +2 Gyre retrofits added via D5a, net +1.)

### 9.2 Patterns worth codifying in the Covenant (Story 1.4)

From the positive examples in the audit:

- **Loom add-team's `Concept count: N/3` step-footer** — ADD to each step's closing checklist. Makes Right-to-pacing compliance self-enforcing. Strong candidate for Covenant good-example.
- **Migration's 7-bucket categorization** (step-02-dryrun) — exemplifies Right to completeness (no silent drops). Ironic given scar history — but the skill wrapper IS the remediation. Cite as good-example.
- **Portfolio's "run convoke-migrate-artifacts to govern them"** — canonical Right-to-next-action format. Cite as good-example.
- **enhance-backlog's "ALWAYS halt and wait for user input after presenting menu"** — canonical Right-to-pause enforcement. Cite.
- **Gyre stack-detection's "record what was found AND what was NOT found"** — canonical Right-to-completeness pattern for scan/discovery workflows. Cite.

### 9.3 Methodology observations for future audits

- **Right-to-pacing remains the weakest rubric.** Even with the §2.6 glossary, reviewer judgment is required. For future audits: measure reproducibility on ≥3 cells covering expected-PASS, expected-FAIL, and borderline; extend the glossary as needed.
- **Layered audit (skill wrapper + underlying script) was essential.** Preserving this pattern in future audits is recommended.
- **"Remediated" vs "currently violating" is an important distinction.** Scar stories should carry the year they were observed; audits should baseline against current state. The Migration scar misclassification (story predicted wrong shape) is a case in point.
- **Discovery workflows may need a budget-aware pattern.** Vortex lean-persona's step-01 FAIL on Right-to-pacing reflects a structural tension: discovery workflows introduce a mental model, which inherently involves ≥3 concepts. The retrofit (item #4) splits the step; a Covenant pattern "Discovery steps use ≤3 novel axes; extend via sub-steps" would formalize this.

---

## 10. Audit Trail & Honest Limitations

### 10.1 Timeline

- **Round 1, Phase 1 (methodology draft):** 2026-04-18 — user approved.
- **Round 1, Phase 2 (calibration):** 2026-04-18 — surfaced the re-baseline decision; Path A chosen.
- **Round 1, Phase 3 (skill selection):** 2026-04-18 — 4 representative skills confirmed (*revised in Round 2 to 6*).
- **Round 1, Phase 4 (audit execution):** 2026-04-18 — 6 skills × 7 rights completed.
- **Round 1 code review (`bmad-code-review`):** 2026-04-18 — produced 6 HIGH + 7 MEDIUM + 6 LOW findings, triggering Round 2.
- **Round 2 rewrite:** 2026-04-18 — ran reproducibility gate (H1), defined novel-concept glossary (H2), expanded scope to 8 skills / 6 submodules (H5), re-scored with binary enforcement (H2/M9), clarified Migration scar shape (H3), replaced rights-by-number with names throughout (M1), corrected Executive Summary arithmetic (H6), added sample bias + self-audit disclosures (H4/M3), added archetype-diversity criterion (M5), disclosed empirical-lens conflict of interest (M6), mapped retrofits 1-to-1 (M7), tempered credibility claims (M2).

### 10.2 Honest limitations (tempered credibility)

1. **Single LLM reviewer.** "Murat" is one LLM acting as a persona. A second independent LLM scored one cell in the reproducibility gate (§2.5) with 100% verdict agreement — but that's a narrow cross-check, not a full audit.
2. **Inter-reviewer reproducibility measured on ONE cell.** AC #1's requirement was "on at least one skill before the methodology is locked." Met at 1 cell; ideal would be ≥3. Future audits should expand this. **(Formalized 2026-04-18 via A10 — see [Compliance Checklist §Reproducibility gate (multi-skill audits)](convoke-spec-covenant-compliance-checklist.md#reproducibility-gate-multi-skill-audits). v2+ audits MUST cover ≥3 cells spanning expected-PASS + expected-FAIL + borderline, with zero-disagreement threshold at N=3-4 and ≥80% at N≥5. v1's 1-cell gate is grandfathered under the pre-A10 methodology; re-running under A10 semantics is not required retroactively.)**
3. **Sample bias direction: likely optimistic.** Static file-review primary; only enhance-backlog was exercised live. Live exposure surfaces violations static review misses. **The 84% compliance rate is likely a ceiling — live-exercise follow-ups on 2-3 currently-PASSing skills would quantify the bias.**
4. **Auditor is inside the project.** "Murat" is a Convoke-authored persona auditing Convoke-authored skills. This is not a claim of external independence. An external audit would add credibility the current report does not claim.
5. **Sample size.** 8 skills audited out of ~33 Convoke-owned skills/workflows. Generalization to the full Convoke surface requires larger follow-up. The §1 compliance rate applies to the sample; the Covenant publication (Story 2.3) should cite this.
6. **Right-to-pacing rubric uses a Convoke-specific glossary.** Other projects applying this Covenant must author their own glossary. The rubric is portable; the glossary is not.
7. **Conflict-of-interest on skill #4** — enhance-backlog was used in the same session. Disclosed in §6; mitigated (not eliminated) by reproducibility gate agreement.
8. **Static review ≠ runtime behavior.** Evidence is primarily workflow/step file review. Dynamic behavior was inferred from prompts rather than observed live, except for skill #4.
9. **Snapshot.** Skills evolve. Findings need refresh. Recommend yearly re-audit cadence or after any Right-to-pacing-relevant UX change.

### 10.3 Round 2 addresses which findings

| Code-review finding | Round 2 action |
|---|---|
| H1 — reproducibility gate deferred | **Run** on enhance-backlog R7 with 100% agreement (§2.5) |
| H2 — binary rubric with borderline contamination; R7 glossary undefined | **Glossary added** (§2.6); all "borderline" annotations removed; Portfolio R7 re-scored as FAIL |
| H3 — Migration worst-case framing contradiction | **Scoping clarified** in §2.2 + §3.1; Migration scar re-analyzed as Right-to-next-action-shaped |
| H4 — sample bias inversion not disclosed | **Disclosed** in §1 credibility caveats + §10.2 (likely ceiling, not floor) |
| H5 — Vortex/Gyre excluded (60% submodule coverage) | **Expanded** to 8 skills / 6 submodules (100% submodule coverage) |
| H6 — Executive Summary mislabels R1 (33%) as bottleneck | **Corrected** — only Right to pacing at 50% qualifies per AC #7 |
| M1 — rights by number throughout | **Replaced** with names throughout all §§ |
| M2 — "high credibility" asserted without support | **Tempered** in §1 and §7.2 |
| M3 — self-audit caveat missing | **Added** to §1 and §10.2 |
| M5 — archetype-diversity waiver without criterion | **Criterion added** to §6 |
| M6 — empirical-lens conflict of interest | **Disclosed** in §6 |
| M7 — "six fixes" undercount | **1-to-1 mapped** in §9.1 (9 fixes for 9 fails) |
| M9 — validate-exports R6 Exit 2 missed | **Re-scored** FAIL; included in §7 matrix + §9.1 retrofit #8 |
| LOW items | Wording tightened throughout (e.g., "no skill fails more than 3 rights" replaced with precise "Max per skill: 3 (Migration)" in §7); axiom-alignment narrative softened to "pattern observation" in §1 and §7.2 without causal claims. |

### 10.4 Round 3 review (2026-04-18, resolved)

Round 3 code review surfaced that Round 2's rewrite did not fully deliver on its own claims. Round 3 patches applied inline:
- `_config` subdirectory disclosure (§6): "6 of 7" instead of "6 of 6"
- Lean-persona concept count corrected to ≥5 (§8.7), partial-credit "softens novelty" language removed
- Glossary extended (§2.6): added rename, move, copy, delete, done, cancel, confirm, review, submit
- §9.1 retrofit cell identifiers use "skill × Right to X" form instead of "skill R7" (closes residual R-numbering finding)

Round 3 decisions D1a through D5a all accepted (see §5.1). Matrix and retrofits updated accordingly. Compliance rate shifted 84% → 82% with no bottleneck right (previously claimed at 50%). This is the honest, post-Round-3 state.

Remaining Round 3 findings deferred to backlog Triage per `code-review-convergence` no-Round-4 rule. Final assessment: the audit is **suitable as internal calibration evidence** for Epic 2 Story 2.1 retrofit scoping. Epic 2 Story 2.3 (Publication) must cite all §5.1 decisions + §10.2 limitations + the 82% rate with its caveats in a "Known gaps" section rather than quote headline-only percentages.

### 10.5 Post-audit methodology extensions (2026-04-18)

After this audit was frozen, two additional methodology rules were added to the Compliance Checklist spec. Neither retroactively reopens v1 verdicts; both bind v2+ audits:

- **A10 — Reproducibility gate for multi-skill audits.** See §10.2 limitation 2 above and the [Compliance Checklist §Reproducibility gate (multi-skill audits)](convoke-spec-covenant-compliance-checklist.md#reproducibility-gate-multi-skill-audits). v1's 1-cell gate is grandfathered under the pre-A10 methodology.
- **A15 — `N/A — external-declared (<tool>)` escape hatch on OC-R6** for skills wrapping externally-owned CLIs (git, npm, docker, ...). **No cell in this audit retroactively qualifies for the new value.** The audited Layer 3 surfaces — Migration (`scripts/migrate-artifacts.js`), Portfolio (`scripts/lib/portfolio/portfolio-engine.js`), bmad-export-skill, bmad-validate-exports, Loom add-team, enhance-backlog, Vortex lean-persona, Gyre stack-detection — are all internally-authored scripts, not externally-owned CLIs. Any v2+ audit that reaches a skill wrapping git/npm/docker MUST consult A15's preconditions before using the value.

---

*End of report.*
