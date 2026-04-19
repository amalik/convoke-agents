---
initiative: convoke
artifact_type: retro
created: 2026-04-18
schema_version: 1
---

# Epic 1 Retrospective — Define the Convoke Operator Covenant

**Epic:** Operator Covenant Epic 1: Define the Covenant
**Period:** 2026-04-18 (single-day authored epic — doc-heavy, non-code)
**Facilitator:** Bob (Scrum Master)
**Participants:** Winston (Architect), Murat (TEA), Paige (Tech Writer), Alice (PO), Charlie (Senior Dev), Dana (QA), Elena (Junior Dev), Amalik (Project Lead)

---

## 1. Epic Summary

| Story | Title | Status | Deliverable |
|-------|-------|--------|-------------|
| oc-1-1 | Covenant Audit | done | [convoke-report-operator-covenant-audit-2026-04-18.md](../planning-artifacts/convoke-report-operator-covenant-audit-2026-04-18.md) — 46/56 cells PASS (82% compliance), no bottleneck |
| oc-1-2 | Taxonomy Extension | done | `covenant` added to `taxonomy.yaml`; `DEFAULT_ARTIFACT_TYPES` updated in merger + migrator |
| oc-1-3 | Checklist Derivation | done | [convoke-spec-covenant-compliance-checklist.md](../planning-artifacts/convoke-spec-covenant-compliance-checklist.md) — OC-R0 through OC-R7, 3-layer audit scope, parser grammar, 6 status values |
| oc-1-4 | Covenant Authoring | done | [convoke-covenant-operator.md](../planning-artifacts/convoke-covenant-operator.md) — axiom, 11-term vocabulary, §6 Seven Operator Rights, compliance protocol |
| oc-1-5 | Adoption Surface | done | 3-of-4 discovery-path coverage: repo README + new bme/README + project-context.md |

**Delivery metrics:**
- Completed: 5/5 stories (100%)
- Deliverables: 1 audit report + 1 Checklist + 1 Covenant + 3 landing-surface edits + 1 taxonomy extension
- Code review rounds: avg 2.0 per story (R1 → R2 trigger on HIGH, no R3 escalation needed)
- Deferred findings logged to initiatives backlog: 11+ intakes (IN-12 through IN-23)
- Scar-anchored: 2 founding incidents (Migration 31-item refactor; Portfolio 108/151 drops) materially re-framed during the epic

---

## 2. What Went Well

**Bob (Scrum Master):** "Let's start with the wins. This was a doc-heavy epic, but it shipped with unusual rigor."

**Alice (PO):** "The baseline audit outcome was the headline. We went in expecting to find a bottleneck Right we'd need to retrofit for. We found 82% compliance and no clear bottleneck. The epic's *premise* — that we had a systemic operator-experience debt — survived reality testing but got reshaped."

**Winston (Architect):** "The dependency cycle catch in Story 1.3/1.4 was underrated. Original ordering had 1.3 author Covenant, 1.4 derive Checklist. But the Checklist was load-bearing for 1.3's self-compliance gate — without it, 1.3 had nothing to validate against. Swapping the order (1.3 = Checklist first, 1.4 = Covenant) was a structural fix, not a cosmetic one."

**Charlie (Senior Dev):** "The convergence rule paid for itself this epic. Every story capped at Round 2 max. Compare to Story 7.3 pre-rule: 30 findings over 3 unbounded rounds. We spent bounded review time on every story and still caught all HIGH-severity issues by Round 2."

**Murat (TEA):** "Persona-switching worked. I took 1.1 (audit = risk-based assessment, my wheelhouse). Paige took 1.4 (Covenant = explanation type, her wheelhouse). Winston triaged architectural findings. Nobody was forced to work outside their lane."

**Paige (Tech Writer):** "OC-R0 landing mid-epic via A12 was the single biggest structural improvement. Before A12, the Checklist had 7 Rights that each needed 4-part docs (statement/why/example/anti-pattern) — guaranteeing ≥4 concepts per section and busting the ≤3 concept budget OC-R7 imposes. A12 added OC-R0 as an enumeration precondition, introduced 'cumulative vocabulary', and carved out illustrations from the concept count. The Covenant became *self-compliant* as a result."

**Dana (QA):** "Self-dogfooding caught things no external reviewer would have. The 'cite OC-R3, not generic Right to rationale' fix in oc-1-5 Round 1 — the rule itself telling reviewers to cite OC-Rn, then failing to cite OC-Rn in its very next sentence. That's only catchable by running the rule against itself."

**Elena (Junior Dev):** "Story 1.5's 'reality check' section is a pattern I want to steal. The ACs were written assuming 4 specific landing surfaces; 2 of them didn't exist. Instead of silently skipping them, the Dev Notes documented the substitution. Makes the AC-vs-reality gap legible."

---

## 3. What Didn't Go Well

**Bob:** "Now the harder part. Where did we struggle?"

**Murat:** "Migration scar re-interpretation was the biggest methodology miss. The epic's original framing claimed Migration's 31-item rebuild was a Right-to-completeness + Right-to-pause scar. Audit §4.2 re-classified it as Right-to-next-action. But the evidence I cited was *current* CLI conflict messages, not historical scar-era retro logs or commits. The re-interpretation was plausible but evidence-thin. Edge Hunter caught this in Round 3. Fixed via a pragmatic softening, but the narrative is weaker than it should be. IN-16 logs this for a v2 audit."

**Alice (PO):** "Vortex sampling. I audited 1 Vortex workflow (lean-persona step-01) out of ~20 Vortex workflows. A spot-check of assumption-mapping step-01 showed ~10 novel concepts in one step — much worse than the sample. Projecting 4/8 = 50% OC-R7 violation rate across Vortex from 1 sample is almost certainly an undercount. IN-13 logs a Vortex-focused re-audit — this is likely where the missing bottleneck is hiding."

**Charlie (Senior Dev):** "The Covenant document itself had multiple self-dogfood failures caught only in review: fabricated CLI error quote in §6.6 (didn't match actual output), missing definitions for 'operator' and 'resolver' (the two load-bearing nouns), and the 'commitments' vs 'Rights' vocabulary split that took until oc-1-5 Round 2 to fully resolve. All of these would have been catchable by Paige's own 4-part format if she'd audited the Covenant against the Checklist more aggressively. Authoring something and then auditing it against its own rules is genuinely hard to do well in one pass."

**Winston:** "The Covenant's canonical location is under `_bmad-output/planning-artifacts/`. That's our *output* tree — usually treated as ephemeral in other projects. Hosting a durable required-reading document there is an architectural smell Story 1.5 inherited without revisiting. Logged as a deferred item but someone should decide: is the Covenant really a planning artifact?"

**Dana (QA):** "AC #1 'cells plural' reading in oc-1-1 — the spec said 'two reviewers agree on ≥80% of cells' (plural), reproducibility gate measured 1 cell. Passed via pragmatic reading but methodologically thin. IN-15 logs ≥3 cells for v2."

**Elena:** "The 'seven commitments' vs 'seven Operator Rights' inconsistency was in 4 places and took 2 rounds of code review across 2 different stories to fully eliminate. It's a small thing, but it shows that terminology chosen in Story 1.4 wasn't re-audited in 1.5."

**Amalik (Project Lead):** [space for your reflection — add inline if desired]

---

## 4. Key Insights

1. **Expert-authored docs still need 2-3 review rounds.** Paige wrote the Covenant first-pass; Round 1 found 6 issues, Round 2 found 4 structural issues (A12 among them), Round 3 caught residuals. Doc work isn't shortcut-able by persona selection alone.
2. **Self-compliance is a trap.** Writing the compliance doc is not the same as complying with it. OC-R3 dogfood fail in oc-1-5; fabricated quote in Covenant §6.6; "commitments" vs "Rights" split. Self-audits need a separate pass, ideally by a different reviewer.
3. **Axiom-driven vocabulary matters.** "The operator is the resolver" forced a framing shift from skill-side ("commitments a skill makes") to operator-side ("Rights an operator has"). The shift wasn't fully landed until oc-1-5 Round 2. Lesson: when an axiom changes the subject of a sentence, audit every downstream document for subject-alignment.
4. **Dependency cycles surface as ordering problems.** 1.3 needs 1.4 needs 1.3 happens when stories treat their outputs as atomic rather than as mutually-informing drafts. The swap fix worked because the Checklist could be *derived* from the seven Rights without the full Covenant prose being finished.
5. **Premise survival ≠ premise confirmation.** Epic 1 expected to find a bottleneck Right requiring retrofit. Audit found no single bottleneck. The epic's strategic framing (Blue Ocean wedge) still holds, but Epic 2's retrofit story (oc-2-1) is now conditional on the Vortex-focused re-audit in IN-13. Good outcome — but not the outcome we planned for.
6. **Convergence rule is a force multiplier on doc work.** Doc reviews can spawn infinite nitpicks. Bounding Round 1 + Round 2 (HIGH trigger) + Round 3 (structural-change trigger) + no Round 4 kept every story's review budget finite and every deferred finding in the backlog where it can be RICE-scored.

---

## 5. First-Epic Retrospective Note

**Bob:** "This was Epic 1 of the Convoke Operator Covenant initiative — no previous retro to follow through on. But the Convoke project has prior-epic retros (AG, SP, Gyre) whose action items are encoded in [project-context.md](../../project-context.md). Let's check how those carried through."

| Prior-retro action item | Rule in project-context.md | Applied in Epic 1? |
|---|---|---|
| Namespace decision required for new skills (feedback_namespace_audit.md) | `namespace-decision-for-new-skills` | ✅ Every story had a Namespace decision section |
| Convergence rule (AG Epic 7 retro) | `code-review-convergence` | ✅ All 5 stories stopped at Round 2 max, no unbounded rounds |
| Mechanical enumeration (AG Epic 7 retro) | `mechanical-research-enumeration` | ⚠️ Partial: oc-1-1's audit sample was eyeballed ("one of each") not grep-enumerated. IN-14 flags this. |
| Spec-verify referenced files (AG Epic 7 retro) | `spec-verify-referenced-files` | ✅ Story 1.5's reality-check section caught 2/4 landing surfaces didn't exist before coding began |
| Derive counts from source (SP Epic 5 retro) | `derive-counts-from-source` | ✅ "46 of 56 cells" computed from matrix, not hand-counted |

**Takeaway:** 4/5 prior-retro rules were applied cleanly. The one gap (mechanical enumeration in audit sampling) is exactly where the Vortex undercounting concern lives — the prior-retro rule would have caught it if applied strictly. Reinforces the rule's importance for Epic 2's re-audit work.

---

## 6. Epic 2 Preview — Adopt and Publish the Covenant

**Epic 2 stories (all currently deferred):**
- **oc-2-1: Retrofit Bottleneck Skills** — status: `deferred`. Conditional on oc-1-1 finding a clear bottleneck. **Current state: NOT TRIGGERED** (no bottleneck at epic scope; may re-trigger after Vortex-focused re-audit).
- **oc-2-2: Loom Add Skill Gate** — status: `deferred`. Blocked by Phase 3 Loom Add Skill workflow not yet existing. Unblocks when Loom Add Skill ships.
- **oc-2-3: Publication Strategy** — status: `deferred`. Gated by oc-2-1 completion (Publication Gate). Materially informed by the audit report's narrative.

**Dependencies on Epic 1 work:**
- Epic 2 consumes: the Covenant (oc-1-4), the Checklist (oc-1-3), the audit matrix (oc-1-1), the `covenant` artifact type (oc-1-2), the landing surfaces (oc-1-5).
- Epic 2 does NOT depend on Epic 1's findings being "bad enough to require retrofit" — if compliance is high, Epic 2 becomes a publication-only epic.

**Preparation gaps for Epic 2:**
- **P1 (critical):** Re-scope oc-2-1 trigger criteria. Does "no bottleneck" mean no retrofit? Or does the Vortex-focused re-audit (IN-13) trigger a Vortex-scoped retrofit?
- **P2 (conditional):** If IN-13 re-audit finds a Vortex bottleneck, oc-2-1 becomes concrete. Expected: Right to pacing (OC-R7) retrofits on 3-5 Vortex workflows.
- **P3 (blocked):** oc-2-2 requires Phase 3 Loom Add Skill workflow. No action needed until Loom Add Skill is scoped.
- **P4 (aligned):** oc-2-3 publication strategy can be drafted any time — the audit and Covenant are publishable as-is.

---

## 7. Action Items

| # | Action | Owner | Category | Done when |
|---|--------|-------|----------|-----------|
| A1 | Execute IN-13: Vortex-focused re-audit (4 additional Vortex workflows) | Murat | Methodology | Vortex compliance rate computed; bottleneck candidacy resolved |
| A2 | Execute IN-16: ground Migration scar re-interpretation in historical evidence (or soften classification) | Murat / Winston | Methodology | §4.2 of audit report updated with historical quote or formal softening note |
| A3 | Execute IN-15: upgrade Covenant audit v2 reproducibility gate from 1 cell to ≥3 cells | Murat | Methodology | Next audit methodology doc updated |
| A4 | Resolve 3 oc-1-5-deferred items (see deferred-work.md): bme/config.yaml inventory, docs/README pointer, Covenant canonical location | Paige / Amalik | Docs | All three patched or explicitly rejected with rationale |
| A5 | ✅ **Complete 2026-04-19.** Decided Epic 2 trigger criteria via Winston + John party-mode. Two-trigger rule (T1 concentrated + T2 systemic) locked into Epic file §"Retrofit Trigger Rule" — 70% compliance floor per Right, N ≥ 3 threshold prevents single-sample tyranny. v1 baseline correctly produces no trigger; re-evaluation happens after each audit refresh. | Alice / Amalik | Planning | ✅ Epic file updated with trigger rule |
| A6 | When Phase 3 Loom Add Skill ships, unblock oc-2-2 and scope the Checklist integration | Winston | Blocked | Scoped when Loom Add Skill exists |
| A7 | Run 1 additional decision-support archetype audit (per IN-14) to cover the COI-flagged sample in oc-1-1 | Murat | Methodology | bmad-cis-creative-problem-solver or innovation-strategy audited |

---

## 8. Readiness Assessment

| Dimension | Status | Notes |
|---|---|---|
| Testing & Quality | N/A | No code ships in this epic; all 5 stories are doc deliverables. Self-compliance was the quality gate (Covenant vs Checklist); 82% compliance verified. |
| Deployment | ✅ Live | All artifacts live in repo as of 2026-04-18. Landing surfaces render on github.com immediately. |
| Stakeholder Acceptance | Pending | Covenant has not been circulated externally. Epic 2's publication strategy (oc-2-3) is the explicit stakeholder-acceptance vehicle. |
| Technical Health | ✅ Clean | No code debt, no failing tests. `_bmad/bme/README.md` is new; no existing surfaces were broken. |
| Unresolved Blockers | None | 3 deferred items logged to deferred-work.md (non-blocking). |

**Verdict:** Epic 1 is genuinely done. Epic 2 is correctly deferred — blocked by IN-13 (re-audit) and Phase 3 Loom, not by Epic 1 loose ends.

---

## 9. Significant Discoveries

**None that require Epic 2 re-planning.**

One notable reframe: Epic 2's oc-2-1 retrofit was scoped assuming oc-1-1 would find a clear bottleneck. Audit found compliance ≥70% on every Right (no bottleneck). This doesn't invalidate oc-2-1 — it shifts the retrofit *locus* from "a single bottleneck Right across the whole ecosystem" to "likely a team-specific concentration (Vortex for OC-R7)". The scope change is minor and handled by A5 above.

---

## 10. Closure

**Bob:** "Epic 1 shipped what it set out to ship: the Covenant, its Checklist, its audit baseline, and its adoption surfaces. The unexpected finding — no clear bottleneck — reshaped Epic 2 rather than blocking it. Methodology improvements (IN-13, IN-15, IN-16) are logged for v2. The Covenant is now the canonical answer to 'what makes a Convoke skill a Convoke skill?' Good epic."

**Alice:** "This was a writing epic that shipped with engineering discipline. Three rounds of code review on a documentation deliverable is unusual — and justified by the self-compliance trap."

**Charlie:** "The convergence rule stayed intact across 5 stories. That's the clearest signal that the AG Epic 7 retro's work generalized."

**Murat:** "Looking forward to IN-13. I think Vortex is the real bottleneck story we missed."

**Paige:** "Proud of the Covenant. It survived its own Checklist."

**Winston:** "Clean architectural boundary: the Covenant is an axiom + rights, the Checklist is a spec, the audit is a report. Three artifact types, three roles. No conflation."

**Amalik (Project Lead):** [add your final reflection if desired]

---

## 11. References

- Epic file: [convoke-epic-operator-covenant.md](../planning-artifacts/convoke-epic-operator-covenant.md)
- Stories: [oc-1-1](oc-1-1-covenant-audit.md), [oc-1-2](oc-1-2-taxonomy-extension.md), [oc-1-3](oc-1-3-checklist-derivation.md), [oc-1-4](oc-1-4-covenant-authoring.md), [oc-1-5](oc-1-5-adoption-surface.md)
- Deliverables: [audit report](../planning-artifacts/convoke-report-operator-covenant-audit-2026-04-18.md), [Checklist](../planning-artifacts/convoke-spec-covenant-compliance-checklist.md), [Covenant](../planning-artifacts/convoke-covenant-operator.md)
- Deferred findings: [deferred-work.md](deferred-work.md) (oc-1-5 section) + initiatives backlog IN-12 through IN-23
- Project rules applied: [project-context.md](../../project-context.md) — notably `code-review-convergence`, `namespace-decision-for-new-skills`, `covenant-compliance-for-convoke-skills` (new this epic)
