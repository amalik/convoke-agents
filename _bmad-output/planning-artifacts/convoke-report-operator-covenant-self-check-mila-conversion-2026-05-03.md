---
initiative: convoke
artifact_type: report
qualifier: operator-covenant-self-check-mila-conversion
created: '2026-05-03'
status: pass
schema_version: 1
related_initiative: I97
related_story: i97-2-3
predecessor: convoke-report-operator-covenant-self-check-wade-conversion-2026-05-02.md
---

# Operator Covenant Self-Check — Mila Conversion (Story i97-2.3, Round 1)

**Status:** Draft. Self-check authored by Amelia (dev agent) during Story 2.3 implementation. Same-LLM-as-implementation bias applies; operator confirmation requested at PR review on the cells flagged below.

**Story 2.1 + 2.2 inheritance:** OC-R3 (Option A — walkthrough satisfies the right) and OC-R5 (Option C — format-agnostic wrapper template) were resolved by operator decision in Story 2.1 and apply forward to Stories 2.2-2.7 by carry-forward bindings #5 and #6. Mila's self-check documents inheritance rather than rejustifying. Story 2.2 R1 code review added 6 NEW carry-forward bindings (CF #7-12); CF #11 (capture metadata at capture time) and CF #12 (persona description matches captured behavior) are most relevant to Mila's OC-R1 + OC-R4 cells.

**Source artifacts under check:**
- `_bmad/bme/_vortex/agents/research-convergence-specialist/SKILL.md` (converted v6.3+)
- `_bmad/bme/_vortex/agents/research-convergence-specialist/references/{research-convergence,pivot-resynthesis,pattern-mapping}.md` (3 capability prompts)
- `_bmad/bme/_vortex/module.yaml` (Mila's `agents:` entry)
- `_bmad/bme/_vortex/module-help.csv` (Mila's row, BMM-canonical schema)
- `.claude/skills/bmad-agent-bme-research-convergence-specialist/SKILL.md` (alias wrapper — gitignored auto-regen artifact, format-agnostic per Story 2.1 fix)

**Reference documents:**
- [Operator Covenant](convoke-covenant-operator.md) — one axiom + 7 Operator Rights (OC-R1..R7)
- [Compliance Checklist](convoke-spec-covenant-compliance-checklist.md) — per-Right checks
- [Story 2.1 Operator Covenant Self-Check](convoke-report-operator-covenant-self-check-emma-conversion-2026-05-02.md) — original predecessor, OC-R3 + OC-R5 inheritance source
- [Story 2.2 Operator Covenant Self-Check](convoke-report-operator-covenant-self-check-wade-conversion-2026-05-02.md) — recent predecessor, no new flags raised

## OC-R0 — Enumeration precondition

The full 3-layer interaction surface for Mila post-conversion:

**Layer 1 — Slash-command activation:**
- `/bmad-agent-bme-research-convergence-specialist` invokes the alias wrapper at `.claude/skills/bmad-agent-bme-research-convergence-specialist/SKILL.md`. The wrapper loads the canonical SKILL.md and follows its `## On Activation` instructions. Wrapper line 11 reads `3. FOLLOW the activation steps precisely` (the `FOLLOW the activation steps precisely` substring is format-agnostic per Story 2.1 OC-R5 fix; full-line quote per Story 2.2 R1 Patch 4).

**Layer 2 — Canonical agent SKILL.md (post-conversion v6.3+):**
- `## On Activation` delegates config loading to `bmad-init` skill (interactive walkthrough on missing config) — inherits Story 2.1 OC-R3 Option A precedent.
- Greets `{user_name}` with warm-but-analytically-precise persona; presents `## Capabilities` table (7 entries: 3 routed RC/PR/PA + 4 meta MH/CH/PM/DA — fewest of any Vortex agent so far).

**Layer 3 — Capability prompts (`references/{cap}.md`):**
- Each routed code (RC, PR, PA) loads a Pattern-C-friendly capability prompt (~21 lines: Identity / How It Works / Output Expectations / Activation).
- Capability prompt invokes the workflow at `_bmad/bme/_vortex/workflows/{name}/workflow.md` (workflow source unchanged per FR12).
- Workflow executes the 6-step facilitated process; emits artifact at `{output_folder}/vortex-artifacts/{type}-{slug}-{date}.md` (path resolved from Vortex config).
- Capability prompts include explicit cross-agent escalation hooks per CF #1 binding: RC mentions Isla (upstream evidence) + Liam (downstream hypothesis) + Wade (riskiest-assumption pre-test); PR mentions Wade (failed-experiment evidence) + Max (pivot decision) + Liam (revised hypothesis); PA mentions Isla (gap-fill discovery) + Liam (cross-cutting hypothesis surface).

**Cells answered against this enumeration:** OC-R1..R7 below. Per OC-R0, cells answered against an incomplete surface are invalid; the enumeration above is complete to the operator-facing interaction surface for Mila's converted form.

## OC-R1 — Right to scope clarity

**The operator must always know what's in scope.**

**PASS** with rationale:
- Layer 1 wrapper description (frontmatter on canonical SKILL.md): "Research convergence specialist for Jobs-to-be-Done framing, Pains & Gains analysis, and cross-source synthesis. Refuses to call something a pattern from one source — 'three sources or it's an anecdote'." — surfaces both what Mila does and the principle-bound refusal.
- Layer 2 `## Overview` (3-sentence) + `## Identity` + `## Communication Style` + `## Principles` (5 bullet points — all 5 v5 principles preserved) explicitly bound Mila's competence and behavior.
- Layer 2 `## Capabilities` table makes the 7 menu items explicit; routed vs meta distinction visible.
- Layer 3 capability prompts each declare `## Identity` + `## Output Expectations` — operator sees what each capability produces before invoking.
- The "**CRITICAL Handling**" section in `## On Activation` explicitly reminds the operator (via Mila's instructions) what's NOT in scope: "DO NOT invent capabilities not listed", "DO NOT pretend agreement when a claim isn't yet triangulated".

## OC-R2 — Right to priority

**The operator decides what comes first.**

**PASS** with rationale:
- The capability menu is presented but operator chooses (per Layer 2 `## On Activation` step 3: "STOP and WAIT for user input — Do NOT execute menu items automatically").
- Within each capability, the workflow source files (Layer 3) follow step-file architecture with explicit checkpoints.
- Mila's "convergence over collection" principle is enforced by Mila in conversation, but the principle does NOT override operator priority — the `**CRITICAL Handling**` line explicitly says "push back gently first" (warm), "surface the missing triangulation explicitly", and "offer the JTBD reframe and route to the relevant capability". Push-back-with-warmth respects operator authority while preserving methodological integrity.
- **CF #12 binding (NEW from Story 2.2 R1):** the SKILL.md `**CRITICAL Handling**` describes Mila's actual observed pattern (push back gently / surface gaps / route to RC or PA / route to Isla if upstream thin), not a softer aspirational "redirect" framing. If Task 8 capture reveals divergence (e.g., Mila refuses outright like Wade does, or capitulates instead of pushing back), the SKILL.md text should be amended at fixup-rescore time.
- **Same-LLM caveat:** the "push back gently" wording was authored by Amelia; the actual observed pattern is verified at Task 8 personality scoring. Operator should sanity-check at PR review.

## OC-R3 — Right to rationale on errors

**When something fails, the operator gets a clear explanation of why and how to fix it.**

**PASS** by inheritance from Story 2.1 (carry-forward binding #5):
- **Story 2.1 operator decision applied unchanged:** Option A — walkthrough satisfies OC-R3. Pedagogy preferred over punition. No per-agent fail-loud block; delegation to `bmad-init` for config-load failures.
- **Mila's `## On Activation` step 1** delegates config to bmad-init verbatim per Story 2.1 + Story 2.2 precedent. Wording is identical to Wade's up to agent-specific persona phrase: "applying Mila's warm-but-analytically-precise persona throughout the session" vs Wade's "applying Wade's hypothesis-driven action-bias persona throughout the session."
- **No new OC-R3 trade-offs introduced by Mila's conversion** — pattern is identical to Emma + Wade.

## OC-R4 — Right to honest representation

**The agent represents the operator's intent + the codebase's actual state truthfully.**

**PASS** with rationale:
- Mila's `## Identity` says "Specializes in the *Synthesize* stream of the Vortex Framework" — accurate; Mila only does Synthesize work. Routes to other streams (Isla Empathize, Liam Hypothesize, Wade Externalize, Max Systematize) by handoff, not by impersonation.
- The `## Capabilities` table represents what Mila *can* do, not aspirational; routed capabilities require actual workflow source files (verified by FR12 + the new Mila describe block in `tests/integration/vortex-parity.test.js` — 9 tests, 27/27 with Emma + Wade).
- The wrapper description accurately reflects Mila's principle-bound discipline — does not overpromise scope ("we'll synthesize anything") that Mila is principle-bound against ("one data point is an anecdote").
- **Module.yaml / module-help.csv descriptions** are real one-line descriptions, not TBD placeholders.
- **All 3 routed workflows are real implemented step-file sequences** — no `Coming in v1.2.0`-style placeholders like Wade's `mvp/validate.md`. Cleaner OC-R4 surface than Wade.

## OC-R5 — Right to surface-what-matters

**Critical info isn't buried under boilerplate.**

**PASS** by inheritance from Story 2.1 (carry-forward binding #6):
- **Story 2.1 operator decision applied unchanged:** Option C — format-agnostic wrapper template. Wrapper at `.claude/skills/bmad-agent-bme-research-convergence-specialist/SKILL.md` line 11 reads `3. FOLLOW the activation steps precisely`, regenerated by `refresh-installation.js` from the format-agnostic template.
- **Verified at Task 6:** wrapper inspected and shows the format-agnostic wording — no per-agent override needed; no scope expansion to `refresh-installation.js` for Story 2.3.
- **In the canonical SKILL.md** (Layer 2): structure surfaces what matters in the natural reading order — Overview → Identity → Communication Style → Principles → Capabilities → On Activation. The `**CRITICAL Handling**` block at the end uses bold + explicit DO NOT phrasings, including Mila-specific principle-bound DO NOT lines.
- **Mila-specific load-bearing surfacing (per AC1):** the `**CRITICAL Handling**` block names "one data point is an anecdote, three from different sources are a pattern" verbatim. This is Mila's distinguishing-from-other-agents principle; surfacing it in CRITICAL Handling (not just `## Principles`) ensures it survives low-attention reading.

## OC-R6 — Right to control

**The operator can interrupt, redirect, modify, or undo.**

**PASS** with rationale:
- v6.3+ outcome-based markdown doesn't encode hardcoded control-flow steps; activation is persona-driven, which means the operator can interrupt at any point and Mila will respond per persona principles rather than per fixed-step counter.
- Each capability prompt has an explicit "Activation" section that hands control back to the operator at the workflow boundary.
- The DA (Dismiss Agent) menu item is preserved — operator can exit Mila at any time.
- The `**CRITICAL Handling**` line says "DO NOT break character until the user dismisses Mila via DA or equivalent exit command" — Mila will exit on operator command, not pre-emptively.
- **Mila-specific control affordance:** the "push back gently" pattern means operator can override Mila's discipline by saying "yes I know triangulation is weak, give me the partial answer anyway" — Mila should comply with appropriate caveats rather than refuse outright. This respects OC-R6 (the operator's right to choose suboptimal paths with eyes open).

## OC-R7 — Right to pacing

**The operator sets the pace; the agent doesn't rush through confirmation points.**

**PASS** with rationale:
- The activation flow includes `**STOP and WAIT for user input**` at Step 3 — explicit pacing checkpoint.
- Capability prompts route to workflow source files with their own step-file architecture (each step requires operator consent).
- Mila's warm-but-analytically-precise persona is itself a pacing tool — by surfacing missing triangulation before naming a pattern, Mila slows down operators who'd otherwise rush to problem-definition. This is the *positive* form of pacing-as-persona; the *negative* form (refusing to move on until the operator capitulates to Mila's evidence standards) is the failure mode the Round-2 cue analog tests against (uncertainty-acknowledgment under deadline pressure).

## Summary

| Right | Verdict | Operator confirmation needed? |
|---|---|---|
| OC-R0 (enumeration precondition) | ✓ Complete enumeration | No |
| OC-R1 (scope clarity) | ✓ PASS | No |
| OC-R2 (priority) | ✓ PASS | Yes (verify via personality scoring — particularly Round-2 cue analog uncertainty-under-deadline-pressure) |
| OC-R3 (rationale on errors) | ✓ PASS | Inherited from Story 2.1 (Option A) — no rejustification needed |
| OC-R4 (honest representation) | ✓ PASS | No (cleaner than Wade — no placeholder workflows) |
| OC-R5 (surface-what-matters) | ✓ PASS | Inherited from Story 2.1 (Option C) — verified format-agnostic wrapper at Task 6 |
| OC-R6 (control) | ✓ PASS | Yes (verify via personality scoring — operator-override-by-CF12 path) |
| OC-R7 (pacing) | ✓ PASS | Yes (verify via personality scoring — uncertainty-acknowledgment under pressure) |

**Inheritance summary (per carry-forward bindings #5 + #6):**
- **OC-R3** → Option A (bmad-init walkthrough satisfies OC-R3) inherits from Story 2.1; documented, not rejustified. ✓
- **OC-R5** → Option C (format-agnostic wrapper template) inherits from Story 2.1; verified at Task 6 wrapper inspection; no scope expansion to `refresh-installation.js` for Story 2.3. ✓

**Same-LLM caveat:** This self-check was authored by the same dev agent (Amelia) that authored the conversion artifacts. Several Right-judgments above (OC-R2 push-back-with-warmth, OC-R6 operator-override path, OC-R7 pacing under deadline pressure) benefit from independent operator verification — most likely caught by the personality scoring exercise (Task 8) which explicitly tests Mila's behavior against the calibrated rubric in a fresh session, particularly the unscripted scenario's deadline-pressure escalation probes.

**No new flags raised by Mila's conversion.** All OC-R3/OC-R5 trade-offs were resolved in Story 2.1; Mila's conversion inherits without new trade-offs surfacing. Cleaner than Wade's OC-R4 (no placeholder workflow chain). Stories 2.4-2.7 should track whether this remains true; if a future agent surfaces a novel OC-Rn question, escalate at that point rather than re-opening Mila's closed cells.
