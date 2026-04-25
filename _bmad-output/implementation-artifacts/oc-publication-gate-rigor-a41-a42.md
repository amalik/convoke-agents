# A41 + A42: Publication Gate Definitional Rigor + Covenant Epic Cell-Centric Refactor (bundled)

Status: **ready-for-dev — review-cycle budgeted for R1 + possibly R2/R3 per A39 precedent** — all 11 Pre-Author Decisions RESOLVED 2026-04-25 (operator accepted all spec-author recommendations); V-pass applied 2026-04-25 (2 critical + 4 enhancement + 5 minor patches). See Dev Notes §Pre-Author Decisions for the locked decision values + alternative readings preserved for traceability. *(Per V-pass O3: "ready-for-dev" = ready for implementation under expectation of 2-3 review rounds; pre-review polish is complete.)*

**Epic:** [P21 Convoke Operator Covenant — Epic 2](../planning-artifacts/convoke-epic-operator-covenant.md) (definitional foundation for Story 2.3 Publication Gate clearance; A39 Gyre audit waiting in provisional limbo per §7.1 A10 failure pending these resolutions)
**Origin:**
- A41 = backlog row IN-75 (deferred-from: A40 Round 2 review 2026-04-21; 5 HIGH + 4 MEDIUM findings need definitional resolution)
- A42 = backlog row IN-79 + rescoping 2026-04-25 after Round 1 review of minimal patch attempt surfaced cell-vs-right architectural incoherence
- A39 R2/R3 inputs (2026-04-25): 7 additional methodology ambiguities surfaced operationally divisive (per Coach R1 A10 disagreement + Coach R5 verdict overturn)
**Sprint:** Parallel to v6.3.3+v6.3.4 Marketplace work — pure content work; zero code-collision surface
**Namespace decision:** No new skills or `_bmad/bme/` content. Edits to existing planning-artifacts only ([convoke-epic-operator-covenant.md](../planning-artifacts/convoke-epic-operator-covenant.md), [convoke-spec-covenant-compliance-checklist.md](../planning-artifacts/convoke-spec-covenant-compliance-checklist.md)) + forward-pointer/amendment markers in sibling artifacts (oc-1-1 audit report, A24 audit report, A39 audit report). No new files.
**Safety analysis (path-safety rule):** N/A — no scripts, no destructive operations. Pure markdown editing.

## Story

As a Convoke contributor preparing P21 Epic 2 Story 2.3 Publication Gate clearance,
I want the Publication Gate's operational definitions defined with sufficient rigor that (a) the gate is mechanically evaluable from audit evidence alone, (b) the cell-vs-right retrofit semantic is unambiguous, and (c) the methodology ambiguities surfaced by A24 + A39 are resolved or explicitly committed to one reading,
so that A39 Gyre Covenant audit (currently in provisional limbo per §7.1 A10 failure + §8 disclosure-only COI mitigation) and future v4+ refresh can graduate from provisional to definitive once the gate is operationally clear, and Story 2.3 can ship under unambiguous Publication Gate semantics.

## Context & Motivation

**Why now:**
- A40 (Publication Gate coverage-breadth amendment, shipped 2026-04-21) added the ≥2-portfolio-audits requirement but explicitly deferred operational definitions to A41 — those definitions are now blocking Story 2.3 clearance.
- A24 R2 (2026-04-19) reverted R1 definitional expansions back to minimal amendment, with 9 HIGH+MED findings deferred to A41.
- A39 R1+R2+R3 (2026-04-25) surfaced 7 additional methodology ambiguities, each operationally divisive (proven via A10 Cell 1 disagreement + Coach R5 verdict overturn). A39 ships in provisional limbo specifically because A41 hasn't resolved these.
- A42's "cell-vs-right" architectural decision overlaps A41 — A41's "portfolio audit" granularity definition cannot be coherent without A42's cell-vs-right resolution. Bundle is mechanically required.

**Why bundled:**
- A42's cell-vs-right semantic affects A41's "portfolio audit" granularity AND "no regressions" baseline AND cascade termination AND A29 single-skill exemption — same architectural decision touches 4 of A41's 8 deferred operational definitions.
- Both touch the same Epic file (`convoke-epic-operator-covenant.md`) at overlapping line ranges (FR15/FR17 + Story 2.1 ACs).
- Code-collision avoidance: same as A39 — pure content work in `_bmad-output/planning-artifacts/`. v6.3 doesn't go near covenant artifacts.

## Acceptance Criteria

**AC1 — Cell-vs-right semantic resolved + applied (A42 core decision).** Story 2.1 ACs are rewritten to use **cell-centric retrofit semantics** (per Pre-Author Decision 1 in Dev Notes). Concretely:
- "Bottleneck rights" framing replaced with "T1-firing (team × Right) cell-rows" (per A24 §5 team × Right row semantics — A24 introduced the (team × Right) cell-row trigger evaluation; **A39 extended this with explicit cell-mechanism naming (R1-G1, R1-G2, R5-G1, R5-G2)** to disambiguate distinct retrofit mechanisms within the same cell-row when the FAIL has multiple distinct surface causes — patched per V-pass C1 to correctly attribute genesis: A24 = team × Right rows; A39 = mechanism naming convention)
- Story 2.1 AC #1 ("rights violated by ≥ 50% of audited skills") superseded by "(team × Right) cell-rows where `fail_rate > 30% at N ≥ 3`" (per A30 T1 threshold definition)
- Retrofit scope = cross-product of T1-firing cells × the specific cell-mechanisms (per A39 cell-mechanism naming pattern: R1-G1 = Scout multi-service mechanism; R1-G2 = Coach Review Mode menu mechanism; R5-G1 = Coach §4 dangling-prompt mechanism; R5-G2 = Scout single-service auto-decide mechanism — NOT "fix everything that violates Right to a default")
- "No regressions" baseline = per-cell, not per-skill (a retrofit fixing cell C1 must not flip cell C2 from PASS to FAIL anywhere in the audited matrix, regardless of which skill C2 belongs to)
- Cascade termination = "no new T1-firing cells introduced by retrofit" (mechanically evaluable; finite per audit matrix)
- All 11 surface points listed in A42 backlog row (FR15 ~L82, FR17 ~L84, Epic 2 dep bullet ~L204, Epic 2 user outcomes ~L190, NFR8 ~L95, Story 2.1 title ~L382, Story 2.1 user-story body ~L384–386, Story 2.1 AC #1 ~L388–390, Story 2.1 AC #2 ~L394–396) are updated to cell-centric framing.

**AC2 — Portfolio Audit Operational Definitions** *(per V-pass L2 — section header added for structural clarity).* A41 operational definitions inline in Epic 2 Story 2.3 (or deferred to Compliance Checklist with explicit pointer). The 8 originally-deferred definitions are now operationally specified:
1. **"portfolio audit"** = a Covenant audit covering ≥1 team, with the team scope explicitly named in the audit report frontmatter or §1 scope section. A39 = Gyre portfolio audit (1 team); A24 = Vortex portfolio audit (1 team). The cross-cutting `convoke` portfolio (oc-1-1) is excluded from "portfolio audit" counting per A40 Round 2 review BH-finding (it satisfies ≥2 portfolios trivially via cross-cutting scope; defeats the breadth-evidence purpose).
2. **A10 metric** = pairwise A-vs-B blind agreement (per A39 R2 simplification; the only A10-grounded metric per oc-1-1 §2.5).
3. **"Locked methodology"** = the rubric (oc-1-1 §2.3 / §2.4 / §2.6) + Selection Discipline (A28/A29 + A41's clarifications below) version-pinned at the audit's `created` date. v4+ audits run under the version locked at their own start date; older audits stay locked at their original version (G4 mitigation gate per A24 §8.1).
4. **"No regressions" baseline** = the matrix immediately preceding the retrofit. Per-cell delta evaluated.
5. **Cascade termination** = "no new T1-firing cells introduced by retrofit" (mechanical; finite per matrix).
6. **A29 single-skill exemption** = a portfolio audit may have N=1 if (a) the team has only 1 operator-facing surface, OR (b) the audit is explicitly scoped as a calibration-case audit (oc-1-1 Migration/Portfolio pattern). Otherwise N≥3 floor applies (per existing A28/A29).
7. **L439/L451 alignment with FR17/Story 2.1** = Story 2.3 cleared/not-cleared ACs use the FR17 wording verbatim ("retrofit completion of T1-firing cells AND ≥2 portfolio audits"); no divergence.
8. **Discovery vs Production-readiness archetype distinction** (per A39 §6.6) added to A28 Step Selection rule. *(Per V-pass E4 — source/scope/baseline-exception clarified):*
   - **Source:** A39 §6.6 methodology observation (post-overturn) — surfaced when A39's vacuous-PASS pattern (4 cells at Atlas/Lens R1+R5) revealed that system-loading step-01 surfaces have systematically lower R1/R5 rubric-fire potential than operator-input-driven step-01 surfaces.
   - **Scope:** Applies to all teams whose primary workflow archetype is Production-readiness analysis (system-loading step-01 — Gyre confirmed; Forge + Helm to be classified at first audit). Does NOT apply to Discovery teams (Vortex confirmed; future Empathy-driven teams).
   - **Exact rule text:** "*A28 Step Selection v2 (post-A41): for system-loading step-01 surfaces (Production-readiness workflows), single-step rationale is methodologically weaker; **≥2 steps default-required** unless operator opts into single-step for cross-audit comparability with prior single-step audit AND documents the archetype-distinction note in the audit's §1 Scope section. Discovery workflows (operator-input-driven step-01) retain A28 v1 single-step-with-rationale acceptance.*"
   - **Baseline exception:** A39 used step-01-only with cross-audit-comparability rationale (matches A24's step-01 scoping). A39 is **grandfathered** under A28 v1 (pre-A41 methodology); v4+ Gyre refresh adopts A28 v2 (≥2 steps default). Applies forward-only per Decision 8 OC-R5 convergence pattern (G4 mitigation gate).

**AC3 — Rubric Clarifications from A39 Ambiguities** *(per V-pass L2 — section header added for structural clarity).* A39 R2/R3-surfaced ambiguities resolved in Compliance Checklist Selection Discipline section. 7 clarifications added; **for each, the spec specifies (a) which existing Checklist rule is being clarified, (b) the exact Checklist text to add or amend, (c) example application** *(per V-pass E2):*

1. **R1 rubric application to enumerated-options menus** (per A39 §9 #4 + Coach R1 A10 disagreement).
   - **Lands in:** OC-R1 row of Compliance Checklist + new "OC-R1 Application Notes" subsection under §Selection Discipline.
   - **Exact text to add (OC-R1 row clarifying note):** "*OC-R1 fires on ALL operator-decision branches in audited step including enumerated-options menus that lack default-suggestions. The Loom add-team R1 PASS pattern ('Default suggestion: based on context, suggest the most likely value with reasoning') is the compliance pattern; absence of such a suggestion in any operator-decision branch = FAIL.*"
   - **Example:** Coach R1 FAIL pattern (A39 §4.4) — `step-01-load-context.md:65-75` Review Mode menu lacks default-suggestion → FAIL. Loom add-team R1 PASS pattern (oc-1-1 §8.5) — pattern menu has explicit default-suggestion → PASS.

2. **Compound-counting for multi-field contracts** (per A39 §9 #1 + Cell 3 A10 disagreement).
   - **Lands in:** §2.6 Novel-Concept Glossary as a new "Multi-field contract enumeration" subsection.
   - **Exact text to add:** "*Multi-field contract enumerations (e.g., HC1/HC2/HC3 schema fields, GC1/GC2/GC3 contract fields) count as **1 compound concept if ≤3 visible sub-fields**; count as **N concepts if ≥4 visible sub-fields**. Hybrid rule resolves charitable-vs-strict ambiguity deterministically. Example: GC1 Stack Profile with 7 sub-fields = 7 novel concepts; HC2 with 3 fields = 1 compound concept. Reading is fixed by structure-count, not by reviewer preference.*"
   - **Example:** A39 §4.2 Atlas R7 — GC1 has 7 sub-fields → counts as 7 → strict reading prevails → Atlas R7 = FAIL under strict counting (would have been PASS under charitable). A39 §4.3 Lens R7 — GC2 has ≤3 visible sub-fields at step-01 → counts as 1 → PASS.

3. **Vacuous-PASS methodology status** (per A39 §6.6).
   - **Lands in:** New "§Selection Discipline §A41-Clarifications" subsection (after §Selection Discipline, before §Applying to a document).
   - **Exact text to add:** "*Vacuous-PASS cell = cell where the operator-decision branch the rubric tests does NOT exist at the audited step. Vacuous-PASS cells are recorded honestly in evidence notes but DO NOT count toward Publication Gate evidence breadth. T1 trigger evaluation uses **N_effective** = N_total − N_vacuous (cells per right where the rubric could fire). Auditors record both N_total and N_effective in §5 row tables; T1 fires if `fails / N_effective > 30%` AND `N_effective ≥ 3`. If N_effective < 3 for a right, T1 evaluation is deferred for that (team × Right) cell-row pending audit-scope expansion to ≥2 steps.*"
   - **Example:** A39 §5 row R1 — N_total = 4 (Scout/Atlas/Lens/Coach); 2 cells vacuous (Atlas R1, Lens R1); N_effective = 2; T1 evaluation deferred for R1 under N_effective semantics (whereas A39's published table used N_total = 4 and reported T1 fires at 50%; v4+ refresh would re-evaluate under N_effective). **Note:** A39's published T1-fires verdict stays locked under G4 mitigation; v4+ refresh applies new N_effective rule.

4. **OC-R5 strictness convergence** (per A39 §9 #2).
   - **Lands in:** OC-R5 row of Compliance Checklist with version-pinning footer.
   - **Exact text to add (OC-R5 row footer):** "*Version note: v4+ audits use OC-R5 strict reading (literal HALT marker required: 'HALT for input.', 'Wait for user input.', 'WAIT for operator input' as standalone line near prompt). Pre-v4 audits (oc-1-1, A24, A39) used oc-1-1 §2.4 R5 lenient reading (implicit-wait accepted per A24 lean-persona §8.7 precedent). Forward-only adoption per G4 mitigation gate; pre-v4 verdicts stay locked at original strictness.*"
   - **Example:** A39 §4.4 Coach R5 — under lenient reading, the §5 menu has explicit "Wait for user input." marker → PASS originally; R2 cascade overturned to FAIL on the §4 dangling-prompt mechanism (separate issue from OC-R5 strictness). Under v4+ strict reading, the §5 wait marker is sufficient (literal); the §4 dangling-prompt FAIL stands either way. Net: v4+ adoption doesn't change A39 verdicts (R2 cascade already accounted for the dangling-prompt; OC-R5 strictness convergence is forward-only methodology hardening).

5. **"Reading-dependent" vs "borderline" distinction** (per A39-D2).
   - **Lands in:** New "§Selection Discipline §A41-Clarifications" subsection.
   - **Exact text to add:** "*'Reading-dependent' verdict is structurally distinct from forbidden 'borderline' partial-credit IF AND ONLY IF: **(a)** the audit explicitly commits to one reading for the headline verdict (default: charitable reading per A24 §4.4 Notes precedent); **(b)** the audit documents the alternative reading + alternative verdict in §Notes with explicit reasoning; **(c)** the audit logs the rubric ambiguity as a §9 backlog intake for future methodology resolution. All three conditions must hold; missing any = the verdict is forbidden borderline (not reading-dependent) and must be resolved binary.*"
   - **Example:** A39 §3 footnote ² (R7 reading-dependent) — meets all 3 conditions: (a) headline commits to charitable PASS per A24 precedent; (b) §4.5 Notes documents strict reading with FAIL alternative; (c) §9 ambiguity #1 logs the compound-counting question. Compliant. Hypothetical non-compliant case: a verdict marked "borderline PASS" with no alternative documented = forbidden.

6. **A10 cell selection rule** (per A39-D4).
   - **Lands in:** §Reproducibility gate (multi-skill audits) subsection of Compliance Checklist (where A10 is currently defined).
   - **Exact text to add:** "*A10 cell composition rule (v4+): the 3-cell minimum must include **(1) one expected-PASS that is reading-dependent or borderline** (NOT a stable-PASS cell), **(2) one expected-FAIL**, **(3) one borderline cell**. Stable-PASS cells inflate agreement chance artificially and reduce gate informativeness; v3 audits that selected stable-PASS for the expected-PASS slot (e.g., A39 §7.1 Cell 2 Lens R7) are grandfathered but v4+ refresh must adopt the borderline-required rule.*"
   - **Example:** A39 §7.1 — selected Lens R7 (PASSes under both readings) as expected-PASS; reviewer agreement on Cell 2 was structurally guaranteed by selection bias. v4+ refresh of Gyre would select Atlas R7 (charitable PASS / strict FAIL) as expected-PASS to maximize informativeness.

7. **Implicit-wait + downstream-explicit-wait composition rule** (per A39 R2 Coach R5 overturn lesson) *(per V-pass E3 — wording locked to Decision 11 verbatim to prevent semantic drift)*.
   - **Lands in:** OC-R5 row of Compliance Checklist + new "OC-R5 Composition Notes" subsection.
   - **Exact text to add (verbatim from Decision 11):** "*Composition is valid ONLY IF downstream wait CONSUMES upstream prompt's response, where consumes = wait halts on operator's specific response + branches workflow. A wait that fires unconditionally regardless of the upstream prompt's response is NOT a consumption — the upstream prompt is dangling and triggers prompt-without-wait FAIL on the upstream prompt itself.*"
   - **Example:** A39 §4.4 Coach R5 (overturned in R2) — `step-01-load-context.md:60` deferred-review prompt + `:77` §5 wait. The §5 wait fires unconditionally regardless of the operator's yes/no answer to the §4 prompt; §5 does NOT consume the §4 response → no composition → §4 is dangling prompt-without-wait → R5 FAIL.

**AC4 — COI Mitigation Tier Specification** *(per V-pass L2 — section header added).* Operator-author COI mitigation tier specification (per A39 §8 + A39-D-equivalent + Pre-Author Decision 4): Compliance Checklist adds explicit COI mitigation tiers:
- **Tier-0 (disclosure-only):** Auditor names operator-author overlap in §COI Disclosure. Acceptable for internal-evidence use; NOT acceptable as Publication Gate clearance evidence.
- **Tier-1 (auditor-side blind sub-reviewers):** A10 reproducibility pass with 2+ blind LLM sub-reviewers. Acceptable for Publication Gate IF gate clears; NOT acceptable if gate fails (A39 case).
- **Tier-2 (external review):** Independent reviewer (different LLM model family, OR human peer reviewer, OR adversarial peer-review from non-Convoke practitioner) re-scores ≥3 cells with verdict-comparison. Acceptable for Publication Gate clearance regardless of A10 outcome (A10 failure is informative methodology data, not blocking).
- **Path forward for A39:** A39 currently has Tier-1-attempted-but-failed + Tier-0 mitigation. To clear Publication Gate, A39 needs Tier-2 OR a v4+ refresh that achieves Tier-1 clearance (under A41-clarified rubric).

**AC5 — Sibling-artifact forward-pointer/amendment markers added.** The **5** sibling artifacts that reference superseded framing get amendment-marker pointers (NOT full rewrites — they're historical records). *(Count corrected from 4 to 5 per V-pass C2: oc-1-1's audit *report* and oc-1-1's audit *story spec* are distinct files — the report is the published output, the spec is the implementation artifact; both reference superseded framing.)*
- [convoke-report-operator-covenant-audit-2026-04-18.md](../planning-artifacts/convoke-report-operator-covenant-audit-2026-04-18.md) §7.1 hardcoded ≥50% threshold: add forward-pointer to A41-clarified Story 2.1 cell-centric semantic.
- [convoke-report-operator-covenant-audit-vortex-2026-04-19.md](../planning-artifacts/convoke-report-operator-covenant-audit-vortex-2026-04-19.md): no rewrite needed (A24 was scoped Vortex-only and explicitly used team × Right cell semantics already); add A41 cross-reference for operational-definition source.
- [oc-1-1-covenant-audit.md](./oc-1-1-covenant-audit.md):19 stale framing: amendment marker pointing to A42 cell-centric refactor.
- [oc-gyre-covenant-audit-a39.md](./oc-gyre-covenant-audit-a39.md): no rewrite needed (A39 already uses cell-centric semantics); add A41-cleared cross-reference once shipped (status of A39 may upgrade from "provisional A10" to "v4+ refresh-eligible" or "Tier-2 mitigation eligible" depending on operator decision per Pre-Author Decision 4).
- [deferred-work.md](./deferred-work.md):186-189 stale framing: update entry to point at A41 resolution.

**AC6 — Compliance Checklist gets new "Selection Discipline §A41-Clarifications" subsection.** Net-new section in [convoke-spec-covenant-compliance-checklist.md](../planning-artifacts/convoke-spec-covenant-compliance-checklist.md) consolidating the 7 AC3 clarifications + COI mitigation tiers from AC4. Single canonical reference for v4+ audits.

**AC7 — A39 status: NO CHANGE (Pre-Author Decision 4 locked to FORWARD-ONLY 2026-04-25).** A39 status remains `done — provisional A10 + R1+R2+R3 patches`. A41 specifies forward rules only; A39's Tier-1-attempted-but-failed mitigation is NOT retroactively credited. v4+ Gyre refresh under A41-clarified rubric is the eligible-path-to-clearance. *(Patched per V-pass E1: AC7 originally framed status as "conditional on operator decision" but operator already accepted Decision 4 forward-only at L3 — AC7 was self-contradictory; locked to NO-CHANGE.)*

**AC8 — Convoke-doctor passes** on all modified planning-artifacts (no governance frontmatter changes; doctor not file-validation-strict, but smoke-check that markdown remains valid).

**AC9 — Backlog rows A41 + A42 moved to §2.5 Completed** with combined activity-log entry; A41 + A42 status `done`. Note: A39 backlog row gets cross-reference to A41 ship date (so future readers tracking A39 provisional status can find A41 resolution).

**AC10 — Code review: R1 + possibly R2/R3 per A39 precedent.** A41+A42 is a methodology-revision story; expect 5+ HIGH findings per round; convergence likely takes 2-3 rounds. Budget accordingly.

## Tasks / Subtasks

### Task Dependency Matrix

| # | Task | Depends on | Primary input | Primary output | AC ref |
|---|---|---|---|---|---|
| 0 | Operator confirms 11 Pre-Author Decisions | none | Dev Notes §Pre-Author Decisions | locked decision values for spec | AC1-AC4 |
| 1 | Update [convoke-spec-covenant-compliance-checklist.md](../planning-artifacts/convoke-spec-covenant-compliance-checklist.md) — add §A41-Clarifications + COI mitigation tiers | T0 | post-T0 decision values | new subsection in Checklist | AC3, AC4, AC6 |
| 2 | Update [convoke-epic-operator-covenant.md](../planning-artifacts/convoke-epic-operator-covenant.md) — A42 cell-centric refactor across 11 surface points | T0, T1 | post-T0 decisions + Checklist clarifications | rewritten Story 2.1 ACs + FR15/FR17/NFR8 alignment | AC1, AC2 |
| 3 | Sibling-artifact forward-pointers | T1, T2 | updated Checklist + Epic | amendment markers in 4 sibling artifacts | AC5 |
| 4 | A39 status finalization per Pre-Author Decision 4 | T1 | A41 Tier specification | A39 status update (or unchanged) | AC7 |
| 5 | Backlog A41 + A42 moves to §2.5 Completed | T1, T2, T3 | shipped artifacts | §2.5 Completed entry + activity log | AC9 |
| 6 | Run convoke-doctor smoke-check | T1, T2 | modified planning-artifacts | doctor pass / fail | AC8 |
| 7 | R1 code review (3 layers) | T1, T2, T3 | modified Epic + Checklist + sibling-artifacts | R1 findings → triage → patches | AC10 |
| 8 | R2 code review (if R1 surfaces ≥5 HIGH) | T7 | post-R1 state | R2 findings → triage → patches | AC10 |
| 9 | R3 minimal sanity-check (if R2 cascades) | T8 | post-R2 state | R3 verdict | AC10 |

### Task details

- [x] **Task 0: Operator confirms 11 Pre-Author Decisions** — RESOLVED 2026-04-25; operator accepted all 11 spec-author recommendations. Decision 1 (cell-vs-right) locked to CELL-CENTRIC. Spec scope confirmed.
- [ ] **Task 1: Update Compliance Checklist** — add new "## Selection Discipline §A41-Clarifications" subsection covering AC3 items 1-7 + AC4 COI mitigation tiers. Position: after existing §Selection Discipline, before §Applying to a document. Maintains backward compatibility (existing rules unchanged; new rules forward-only per "Locked methodology" semantics).
- [ ] **Task 2: Update Operator Covenant Epic** — A42 cell-centric refactor:
  - FR15 (~L82): "Skills identified in FR9 audit with highest violation counts are retrofitted" → "**T1-firing (team × Right) cells** identified in FR9+ audits are retrofitted at the specific cell-mechanism level"
  - FR17 (~L84): keep existing wording; A41 operational definitions inline OR pointer to Compliance Checklist §A41-Clarifications (per AC2)
  - NFR8 (~L95): "Retrofitting (FR15) prioritizes rights with highest violation counts" → "Retrofitting (FR15) prioritizes T1-firing cells; cell-mechanism distinct retrofits even within the same right (e.g., A39's R1-G1 Scout multi-service ≠ R1-G2 Coach Review Mode menu)"
  - Epic 2 user outcomes (~L190): "Existing skills with highest violation counts are brought into compliance" → "Cell-mechanism-specific retrofits ship for all T1-firing cells in audited portfolios"
  - Epic 2 dep bullet (~L204): "operational definitions deferred to A41" → "operational definitions per A41 (shipped 2026-04-XX); see Compliance Checklist §A41-Clarifications"
  - Story 2.1 title (~L382): "Retrofit Highest-Violation Skills" → "Retrofit T1-Firing Cells"
  - Story 2.1 user-story body (~L384-386): "skills identified as bottleneck violators" → "(team × Right) cells identified as T1-firing"
  - Story 2.1 AC #1 (~L388-390): "all rights violated by ≥ 50% of audited skills (i.e., 2 or more of 4 skills violate it) are listed as bottleneck rights" → "all (team × Right) cells where `fail_rate > 30% at N ≥ 3` (per A30 T1 threshold) are listed as T1-firing cells; cell-mechanism distinct retrofits per A39 cell-naming convention"
  - Story 2.1 AC #2 (~L394-396): "retrofit scope is the cross-product of bottleneck rights × the specific skills violating them" → "retrofit scope is the set of T1-firing cells × the specific cell-mechanisms violating them (per A39 R1-G1/R1-G2/R5-G1/R5-G2 naming)"
- [ ] **Task 3: Sibling-artifact forward-pointers** — add amendment-marker pointers (1-2 lines each) in 4 sibling artifacts per AC5. NOT full rewrites — historical records stay intact.
- [ ] **Task 4: A39 status finalization** — per Pre-Author Decision 4 outcome. If "A39 stays provisional pending Tier-2 / v4+ refresh" (recommended): no A39 file edit needed; A41 is the eligibility-rule reference for future Gyre refresh. If "retroactive Tier-1-attempt-credit": update A39 Status header + backlog row.
- [ ] **Task 5: Backlog A41 + A42 moves** — combined activity-log entry per A24/A39 precedent. Move both rows from §2.4 → §2.5 Completed (status `done`). Update A39 row with cross-reference to A41 ship date.
- [ ] **Task 6: Doctor smoke-check** — `npx convoke-doctor` should report 0 new errors (pre-existing add-team workflow + module version errors persist; confirm no A41+A42 file-related errors).
- [ ] **Task 7: R1 code review** — invoke `/bmad-code-review` on the modified files (Epic + Checklist + sibling-artifacts). 3 layers per A39 precedent (Blind Hunter + Edge Case Hunter + Acceptance Auditor). Triage findings; apply patches per `code-review-convergence` rule.
- [ ] **Task 8: R2 code review (conditional)** — if R1 surfaces ≥5 HIGH findings AND R1 patches are non-trivially structural, invoke R2. Per A39 precedent, methodology-revision stories typically need R2 to catch R1-patch-induced contradictions.
- [ ] **Task 9: R3 minimal sanity-check (conditional)** — if R2 surfaces verdict overturns or major cascades, run minimal R3 (single Edge Case Hunter on the cascade only) per A39 R3 pattern.

## Dev Notes

### Origin & Scoring

- **Intake:** IN-75 (A41) + IN-79 (A42 original) + A39 R2/R3 inputs (2026-04-25 — 7 additional ambiguities)
- **Backlog IDs:** A41 (RICE 1.4) + A42 (RICE 1.8) bundled per backlog "bundles-with: A41" annotation
- **Combined RICE estimate:** 1.4 + 1.8 = 3.2 (additive); load-bearing impact higher than RICE shows because **A39 ships in provisional limbo until A41+A42 ship** (every additional day delays Story 2.3 Publication Gate clearance)
- **Why this RICE survived 2026-04-25 selection:** prior session's collision-avoidance principle (no v6.3 collision) eliminated higher-RICE candidates; A41+A42 is pure markdown work with zero v6.3 overlap.

### Pre-Author Decisions (11) — RESOLVED 2026-04-25 (operator accepted all spec-author recommendations)

All 11 decisions confirmed by operator. Recommendations below are the locked decision values; alternative readings preserved for traceability. Tasks 1-9 proceed under these locks. *(Per V-pass O1: alternatives listed below were considered during spec-authoring + represent plausible readings of prior audit patterns — A24, A39 — that the spec-author actively weighed before recommending; the recommendation column is the spec-author's judgment of the highest-quality path. Trade-off column compresses to single sentence per V-pass L1.)*

| # | Decision | Spec-Author Recommendation | Alternative Reading | Trade-off |
|---|---|---|---|---|
| 1 | **Cell-vs-right semantic** (A42 core) | **CELL-CENTRIC.** Retrofit operates on (team × Right) cells with named mechanisms (R1-G1, R5-G1, etc.); aligns with A24/A39 actual practice. | RIGHT-CENTRIC: retrofit applies to whole rights regardless of team/mechanism. | Cell-centric matches actual audit data; right-centric was original Story 2.1 framing but doesn't survive the multi-team picture. |
| 2 | **A10 metric** | **PAIRWISE A-vs-B BLIND AGREEMENT.** Already used in A39 R2 simplification per oc-1-1 §2.5. | Verdict-concurrence-with-main (rejected by A39 R2 as non-A10-grounded). | Pairwise is the only A10-grounded metric; alternatives subtly weaken gate-failure framing. |
| 3 | **"Locked methodology" semantics** | **VERSION-PINNED at audit `created` date.** Audit runs under whatever rules existed at start; older audits stay locked at original version (G4 gate). | "Current at evaluation" — older audits get re-evaluated under new rules each time. | Version-pinning preserves audit reproducibility + makes G4 mitigation gate operational; "current at evaluation" creates retroactive verdict instability. |
| 4 | **A39 retroactive-vs-forward A41 application** | **FORWARD-ONLY.** A39 stays provisional pending Tier-2 mitigation OR v4+ refresh under A41-clarified rubric. A41 sets new rules; doesn't retroactively bless A39's Tier-1-attempted-but-failed mitigation. | Retroactive-credit: A39 gets credit for attempting Tier-1 mitigation in good faith; provisional status upgrades. | Forward-only preserves methodology integrity + matches G4 gate spirit; retroactive-credit risks Publication Gate erosion (every future audit could appeal for retroactive credit). |
| 5 | **Compound-counting for multi-field contracts** (A39 §9 #1) | **HYBRID: ≤3 sub-fields = 1 compound concept; ≥4 sub-fields = N concepts.** | Pure charitable (always 1) OR pure strict (always N). | Hybrid resolves both extremes deterministically; pure readings either over-count or under-count consistently. |
| 6 | **R1 rubric application to enumerated-options menus** (A39 §9 #4) | **STRICT per Loom precedent.** R1 fires on any operator-decision branch lacking a default-suggestion, including enumerated-options menus. Coach R1 FAIL stands. | Lenient: R1 fires only if some menu options would lead to unresolvable downstream state. | Strict matches oc-1-1 §8.5 Loom add-team R1 PASS pattern; lenient was Reviewer A's reading in A39 §7.1 Cell 1 disagreement. Strict closes the rubric ambiguity. |
| 7 | **Vacuous-PASS methodology status** (A39 §6.6) | **N_effective ≠ N_total.** Vacuous-PASS cells recorded honestly but excluded from Publication Gate evidence breadth. T1 evaluation uses N_effective. | Count vacuous-PASS as evidence: a team with N=4 cells where 2 are vacuous shows N=4 PASS. | N_effective preserves evidence-quality semantics; counting-vacuous inflates compliance claims (A39 R6 demonstrated this is hollow evidence). |
| 8 | **OC-R5 strictness convergence** (A39 §9 #2) | **FORWARD-ONLY adoption.** v4+ uses Compliance Checklist OC-R5 (literal HALT marker); pre-v4 verdicts stay locked at oc-1-1 §2.4 R5 (implicit-wait accepted). | Retroactive: re-score all pre-v4 audits under stricter OC-R5. | Forward-only preserves G4 gate; retroactive would invalidate oc-1-1 + A24 + A39 cells without re-running audits. |
| 9 | **"Reading-dependent" vs "borderline" distinction** (A39-D2) | **STRUCTURALLY DISTINCT IF AND ONLY IF: (a) headline commits to one reading, (b) §Notes documents alternative, (c) §9 ambiguity logged.** A24 + A39 patterns are compliant. | Treat as borderline (forbidden); ban "reading-dependent" framing. | Structural-distinction-with-conditions preserves A24+A39 precedent; banning would invalidate both audits' R7 cells. |
| 10 | **A10 cell selection rule** (A39-D4) | **EXPECTED-PASS MUST BE READING-DEPENDENT OR BORDERLINE, not stable-PASS.** Maximizes gate informativeness. | Allow stable-PASS as expected-PASS (A39's pattern). | Reading-dependent expected-PASS makes gate genuinely informative; stable-PASS inflates agreement chance artificially (A39 §7.1 Cell 2 demonstrated). |
| 11 | **Implicit-wait + downstream-explicit-wait composition rule** (A39 R2 lesson) | **VALID ONLY IF downstream wait CONSUMES upstream prompt's response.** "Consumes" = wait halts on operator's specific response + branches workflow. | Allow composition unconditionally (A24 lean-persona §8.7 precedent without consumption test). | Consumption-test prevents the Coach R5 false-composition pattern that A39 R2 caught; unconditional composition risks more verdict drift. |

**Operator decision: ACCEPTED ALL 11 RECOMMENDATIONS 2026-04-25.** Decision 1 (cell-vs-right) locked to CELL-CENTRIC; spec scope confirmed. Tasks 1-9 proceed under these locks.

### Pre-Author Hypothesis (none — A41+A42 is a methodology-revision story)

Unlike A39 (which had no pre-audit hypothesis since Gyre had never been audited), A41+A42 has **specific known target findings** to resolve: 5 HIGH + 4 MEDIUM from A40 R2 + 7 from A39 R2/R3. The story execution is mechanical resolution of named ambiguities, not exploratory.

### Downstream Consumers

- **A39 Gyre Covenant audit**: currently provisional pending A41+A42. Per Pre-Author Decision 4, A39 stays provisional; eligible for v4+ refresh under A41-clarified rubric OR Tier-2 mitigation upgrade.
- **A26 Vortex-wide HC-schema pattern audit**: A41's hybrid compound-counting rule (Decision 5) would be load-bearing for A26 — provides deterministic counting for HC-schema enumeration.
- **Future Gyre v4+ refresh**: would re-test under A41-clarified rubric; expected to achieve Tier-1 clearance if rubric ambiguities resolve cleanly.
- **Future Helm/Forge/Loom team audits**: would be third+ portfolio audits; A41's "portfolio audit" definition (Decision 1 in AC2) makes them counting-eligible.
- **Story 2.3 Publication Gate**: A41 makes the gate mechanically evaluable. After A41+A42 ship: gate clears IF Story 2.1 retrofits complete (T1-firing cells fixed) AND ≥2 portfolio audits exist (A24+A39 currently; A39 needs Tier-2 OR v4+ refresh per Decision 4).

### Anti-Patterns to AVOID

- ❌ Do NOT re-score any pre-v4 audit cells. A24 + A39 + oc-1-1 verdicts stay locked per G4 mitigation gate.
- ❌ Do NOT introduce new methodology rules outside the 11 Pre-Author Decisions. Scope creep is the exact failure mode A40 R2 caught (R1 added "tier-0/tier-1+" vocabulary that was undefined; reverted).
- ❌ Do NOT silently adopt right-centric semantics in any AC rewrite — Pre-Author Decision 1 explicitly commits to cell-centric. Drift risks reintroducing the architectural incoherence A42 exists to fix.
- ❌ Do NOT write the Compliance Checklist §A41-Clarifications subsection as a placeholder ("TBD" / "see future amendment"). The 7 AC3 + 4 AC4 items are all spec-author-recommended; either they ship or they're explicitly deferred (and removed from this spec's scope).
- ❌ Do NOT amend sibling artifacts beyond forward-pointer/amendment-marker scope. A24 audit report + oc-1-1 audit report are historical records; A41's job is to point forward, not rewrite history.
- ❌ Do NOT use partial-credit language ("borderline", "somewhat", "tends to") in the new Checklist subsection. Decision 9 explicitly distinguishes "reading-dependent" (allowed under conditions) from "borderline" (banned); A41 shipping with banned-language would be self-contradicting.

### Conflict-of-Interest Disclosure

- **Auditor (Claude in this session)**: did NOT author oc-1-1, A24, A39 audit reports OR convoke-epic-operator-covenant.md OR Compliance Checklist primary content. Authored A39 spec + this A41+A42 spec. Methodology-frame COI: same shape as A39.
- **Operator (Amalik)**: authored Convoke v3.0 module structure (including Gyre step-01 files audited in A39); authored most planning-artifacts including the convoke-epic-operator-covenant.md sections being modified; directs this audit-session-and-spec authorship. Operator-author COI: same shape as A39 + escalated by the meta-relationship (operator deciding methodology rules that govern audits of operator-authored content).
- **Mitigation:** A41+A42 is methodology-revision (not audit execution). The 11 Pre-Author Decisions are surfaced explicitly with alternatives; operator is empowered to override any recommendation. Code review (R1 + R2/R3) provides external-LLM-reviewer challenge to the recommendations.

### Output Files

```
_bmad-output/
├── planning-artifacts/
│   ├── convoke-epic-operator-covenant.md          # Modified: A42 cell-centric refactor across 11 surface points
│   ├── convoke-spec-covenant-compliance-checklist.md  # Modified: new §A41-Clarifications subsection
│   └── convoke-report-operator-covenant-audit-{2026-04-18, vortex-2026-04-19}.md  # Modified: amendment markers (1-2 lines each)
└── implementation-artifacts/
    ├── oc-1-1-covenant-audit.md                   # Modified: amendment marker at line 19
    ├── oc-gyre-covenant-audit-a39.md              # Possibly modified: Status header per Pre-Author Decision 4 outcome
    └── deferred-work.md                           # Modified: A39-D1..D4 entries cross-referenced with A41 resolutions
```

### Reference Artifacts

| Artifact | Purpose | Location |
|---|---|---|
| oc-1-1 baseline audit | §2.3 / §2.4 / §2.6 methodology source-of-truth | [convoke-report-operator-covenant-audit-2026-04-18.md](../planning-artifacts/convoke-report-operator-covenant-audit-2026-04-18.md) |
| A24 Vortex audit (precedent for cell-centric trigger semantics) | §5 team × Right row table; A29 mixed-audit framing | [convoke-report-operator-covenant-audit-vortex-2026-04-19.md](../planning-artifacts/convoke-report-operator-covenant-audit-vortex-2026-04-19.md) |
| A39 Gyre audit (downstream consumer of A41+A42) | §7.1 A10 failure + §8 COI disclosure + §9 ambiguities #1-#5 | [convoke-report-operator-covenant-audit-gyre-2026-04-25.md](../planning-artifacts/convoke-report-operator-covenant-audit-gyre-2026-04-25.md) |
| Operator Covenant + Compliance Checklist | A10 / A28 / A29 Selection Discipline definitions | [convoke-covenant-operator.md](../planning-artifacts/convoke-covenant-operator.md) + [convoke-spec-covenant-compliance-checklist.md](../planning-artifacts/convoke-spec-covenant-compliance-checklist.md) |
| P21 Epic 2 file (primary edit target) | FR15/FR17/NFR8 + Story 2.1/2.3 ACs | [convoke-epic-operator-covenant.md](../planning-artifacts/convoke-epic-operator-covenant.md) |
| A39 spec (precedent for THIS spec) | Story shape template; Pre-Author Decision pattern | [oc-gyre-covenant-audit-a39.md](./oc-gyre-covenant-audit-a39.md) |
| A40 ship note + Round 2 review | Source of A41's 5 HIGH + 4 MEDIUM deferred items | Backlog §2.5 row 2026-04-21 in [convoke-note-initiative-lifecycle-backlog.md](../planning-artifacts/convoke-note-initiative-lifecycle-backlog.md) + Change Log 2026-04-21 |
| A39 §9 ambiguities #1-#5 + R2/R3 lessons | Source of A41's 7 additional ambiguities | A39 audit report §9 + §Review Findings (R1+R2+R3) |
