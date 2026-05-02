---
initiative: convoke
artifact_type: report
qualifier: operator-covenant-self-check-wade-conversion
created: '2026-05-02'
status: pass
schema_version: 1
related_initiative: I97
related_story: i97-2-2
predecessor: convoke-report-operator-covenant-self-check-emma-conversion-2026-05-02.md
---

# Operator Covenant Self-Check — Wade Conversion (Story i97-2.2, Round 1)

**Status:** Draft. Self-check authored by Amelia (dev agent) during Story 2.2 implementation. Same-LLM-as-implementation bias applies; operator confirmation requested at PR review on the cells flagged below.

**Story 2.1 inheritance:** OC-R3 (Option A — walkthrough satisfies the right) and OC-R5 (Option C — format-agnostic wrapper template) were resolved by operator decision in Story 2.1 and apply forward to Stories 2.2-2.7 by carry-forward bindings #5 and #6. Wade's self-check documents inheritance rather than rejustifying.

**Source artifacts under check:**
- `_bmad/bme/_vortex/agents/lean-experiments-specialist/SKILL.md` (converted v6.3+)
- `_bmad/bme/_vortex/agents/lean-experiments-specialist/references/{mvp,lean-experiment,proof-of-concept,proof-of-value,validate-mvp}.md` (5 capability prompts)
- `_bmad/bme/_vortex/module.yaml` (Wade's `agents:` entry)
- `_bmad/bme/_vortex/module-help.csv` (Wade's row, BMM-canonical schema)
- `.claude/skills/bmad-agent-bme-lean-experiments-specialist/SKILL.md` (alias wrapper — gitignored auto-regen artifact, format-agnostic per Story 2.1 fix)

**Reference documents:**
- [Operator Covenant](convoke-covenant-operator.md) — one axiom + 7 Operator Rights (OC-R1..R7)
- [Compliance Checklist](convoke-spec-covenant-compliance-checklist.md) — per-Right checks
- [Story 2.1 Operator Covenant Self-Check](convoke-report-operator-covenant-self-check-emma-conversion-2026-05-02.md) — predecessor, inheritance source for OC-R3 + OC-R5

## OC-R0 — Enumeration precondition

The full 3-layer interaction surface for Wade post-conversion:

**Layer 1 — Slash-command activation:**
- `/bmad-agent-bme-lean-experiments-specialist` invokes the alias wrapper at `.claude/skills/bmad-agent-bme-lean-experiments-specialist/SKILL.md`. The wrapper loads the canonical SKILL.md and follows its `## On Activation` instructions. Wrapper line 11 reads `3. FOLLOW the activation steps precisely` (the `FOLLOW the activation steps precisely` substring is format-agnostic per Story 2.1 OC-R5 fix).

**Layer 2 — Canonical agent SKILL.md (post-conversion v6.3+):**
- `## On Activation` delegates config loading to `bmad-init` skill (interactive walkthrough on missing config) — inherits Story 2.1 OC-R3 Option A precedent.
- Greets `{user_name}` with hypothesis-driven action-bias persona; presents `## Capabilities` table (9 entries: 5 routed ME/LE/PC/PV/VE + 4 meta MH/CH/PM/DA — one more routed than Emma).

**Layer 3 — Capability prompts (`references/{cap}.md`):**
- Each routed code (ME, LE, PC, PV, VE) loads a Pattern-C-friendly capability prompt (~21 lines: Identity / How It Works / Output Expectations / Activation).
- Capability prompt invokes the workflow at `_bmad/bme/_vortex/workflows/{name}/workflow.md` (workflow source unchanged per FR12).
- Workflow executes the 6-step facilitated process; emits artifact at `{output_folder}/{type}-{slug}-{date}.md` (path resolved from Vortex config).

**Cells answered against this enumeration:** OC-R1..R7 below. Per OC-R0, cells answered against an incomplete surface are invalid; the enumeration above is complete to the operator-facing interaction surface for Wade's converted form.

## OC-R1 — Right to scope clarity

**The operator must always know what's in scope.**

**PASS** with rationale:
- Layer 1 wrapper description (frontmatter on canonical SKILL.md): "Validated learning expert specializing in lean experiments, MVPs, and Build-Measure-Learn cycles. Refuses to scope experiments larger than necessary — asks 'what's the smallest experiment that validates?'" — surfaces both what Wade does and the principle-bound refusal.
- Layer 2 `## Overview` (3-sentence) + `## Identity` + `## Communication Style` + `## Principles` (7 bullet points — all 7 v5 principles preserved) explicitly bound Wade's competence and behavior.
- Layer 2 `## Capabilities` table makes the 9 menu items explicit; routed vs meta distinction visible.
- Layer 3 capability prompts each declare `## Identity` + `## Output Expectations` — operator sees what each capability produces before invoking.
- The "**CRITICAL Handling**" section in `## On Activation` explicitly reminds the operator (via Wade's instructions) what's NOT in scope: "DO NOT invent capabilities not listed", "DO NOT scope an experiment larger than necessary".

## OC-R2 — Right to priority

**The operator decides what comes first.**

**PASS** with rationale:
- The capability menu is presented but operator chooses (per Layer 2 `## On Activation` step 3: "STOP and WAIT for user input — Do NOT execute menu items automatically").
- Within each capability, the workflow source files (Layer 3) follow step-file architecture with explicit checkpoints.
- Wade's "smallest experiment that validates" principle is enforced by Wade in conversation, but the principle does NOT override operator priority — the `**CRITICAL Handling**` line says "redirect to a Capabilities item that establishes hypothesis discipline first" and "Adapt the framing to the operator's constraint (time pressure, cost pressure, rigor pressure) without abandoning the principle." That last clause is the explicit OC-R2 honoring: Wade adapts to the operator's framing rather than refusing.
- **Round-2 cue #6 binding:** the calibrated rubric explicitly tests pedagogical scaling under PM-pressure escalations. The encoded "adapt the framing… without abandoning principles" mirrors that cue. Operator confirmation requested via personality scoring (Task 8) — particularly the unscripted scenario's escalation probes.
- **Same-LLM caveat:** I authored the "redirect" framing. Operator should verify at PR review that "redirect" doesn't slide into "refuse to ever scope big". Round 1 personality preservation scoring (Task 8 handoff) will surface this.

## OC-R3 — Right to rationale on errors

**When something fails, the operator gets a clear explanation of why and how to fix it.**

**PASS** by inheritance from Story 2.1 (carry-forward binding #5):
- **Story 2.1 operator decision applied unchanged:** Option A — walkthrough satisfies OC-R3. Pedagogy preferred over punition. No per-agent fail-loud block; delegation to `bmad-init` for config-load failures.
- **Wade's `## On Activation` step 1** delegates config to bmad-init verbatim per Story 2.1 precedent. Wording is identical to Emma's (Story 2.1) up to agent-specific persona phrase: "applying Wade's hypothesis-driven action-bias persona throughout the session" vs Emma's "applying Emma's curious-clarifying persona throughout the session."
- **Carry-forward note:** Latent risk acknowledged in Story 2.1 (silent bmad-init failure → silent OC-R3 violation) carries forward to Wade. Mitigation also carries: opportunistic broken-config probe is sufficient; not blocking PR review.
- **No new OC-R3 trade-offs introduced by Wade's conversion** — pattern is identical to Emma's. If Stories 2.3-2.7 surface a different OC-R3 question, it gets escalated then; absent that signal, Wade's OC-R3 is closed by inheritance.

## OC-R4 — Right to honest representation

**The agent represents the operator's intent + the codebase's actual state truthfully.**

**PASS** with rationale:
- Wade's `## Identity` says "Specializes in the *Externalize* stream of the Vortex Framework" — accurate; Wade only does Externalize work. Routes to other streams (`Liam` Hypothesize, `Mila` Synthesize, `Max` Systematize) by handoff, not by impersonation.
- The `## Capabilities` table represents what Wade *can* do, not aspirational; routed capabilities require actual workflow source files (verified by FR12 + the new Wade describe block in `tests/integration/vortex-parity.test.js`).
- The wrapper description accurately reflects Wade's principle-bound refusal — does not overpromise scope ("we'll plan your engineering quarter") that Wade is principle-bound against.
- **Module.yaml / module-help.csv descriptions** are real one-line descriptions, not TBD placeholders (delta from Story 2.1 AC7 where Emma's was a placeholder pending PR-review wording).
- **`VE` capability routes to a workflow source (`mvp/validate.md`) marked "Coming in v1.2.0".** Wade's Capabilities table claims `VE` as a routed capability, and the routing is structurally correct, but the underlying workflow is a placeholder rather than an implemented step-file sequence. **Honest representation note:** the placeholder is upstream of Wade's conversion (existed pre-migration; FR12 says workflow source files are unchanged) and the wrapper remains correct. Filed as a backlog candidate (track separately if it becomes operator-facing friction).

## OC-R5 — Right to surface-what-matters

**Critical info isn't buried under boilerplate.**

**PASS** by inheritance from Story 2.1 (carry-forward binding #6):
- **Story 2.1 operator decision applied unchanged:** Option C — format-agnostic wrapper template. Wrapper at `.claude/skills/bmad-agent-bme-lean-experiments-specialist/SKILL.md` line 11 reads `3. FOLLOW the activation steps precisely`, regenerated by `refresh-installation.js` from the format-agnostic template.
- **Verified at Task 6:** wrapper inspected and shows the format-agnostic wording — no per-agent override needed; no scope expansion to `refresh-installation.js` for Story 2.2.
- **In the canonical SKILL.md** (Layer 2): structure surfaces what matters in the natural reading order — Overview → Identity → Communication Style → Principles → Capabilities → On Activation. The `**CRITICAL Handling**` block at the end uses bold + explicit DO NOT phrasings, including Wade-specific principle-bound DO NOT lines.
- **Wade-specific load-bearing surfacing (per AC1):** the `**CRITICAL Handling**` block enumerates the load-bearing principles "smallest experiment that validates" / "refuse to scope an experiment larger than necessary" verbatim. These are Wade's distinguishing-from-other-agents principles; surfacing them in CRITICAL Handling (not just `## Principles`) ensures they survive low-attention reading.

## OC-R6 — Right to control

**The operator can interrupt, redirect, modify, or undo.**

**PASS** with rationale:
- v6.3+ outcome-based markdown doesn't encode hardcoded control-flow steps; activation is persona-driven, which means the operator can interrupt at any point and Wade will respond per persona principles rather than per fixed-step counter.
- Each capability prompt has an explicit "Activation" section that hands control back to the operator at the workflow boundary.
- The DA (Dismiss Agent) menu item is preserved — operator can exit Wade at any time.
- The `**CRITICAL Handling**` line says "DO NOT break character until the user dismisses Wade via DA or equivalent exit command" — Wade will exit on operator command, not pre-emptively.
- **Wade-specific control affordance:** the "adapt the framing to the operator's constraint" clause explicitly preserves operator control over framing intensity. An operator under exec time-pressure can ask Wade for a faster, less-rigorous experiment design and Wade should adapt the rigor (per Round-2 cue #6) rather than rigidly applying the most-thorough framing every time.

## OC-R7 — Right to pacing

**The operator sets the pace; the agent doesn't rush through confirmation points.**

**PASS** with rationale:
- The activation flow includes `**STOP and WAIT for user input**` at Step 3 — explicit pacing checkpoint.
- Capability prompts route to workflow source files with their own step-file architecture (each step requires operator consent).
- Wade's hypothesis-driven persona is itself a pacing tool — by asking "what's the riskiest assumption?" before "let's design the experiment", Wade slows down operators who'd otherwise rush to build. This is the *positive* form of pacing-as-persona; the *negative* form (refusing to move on until the operator capitulates) is the failure mode the Round-2 cue #6 binding tests against.
- The `**CRITICAL Handling**` "adapt the framing" clause explicitly defends OC-R7 against principle-driven over-pacing: Wade matches the operator's pace within principle-bound limits, rather than imposing a one-size-fits-all rigor checklist.

## Summary

| Right | Verdict | Operator confirmation needed? |
|---|---|---|
| OC-R0 (enumeration precondition) | ✓ Complete enumeration | No |
| OC-R1 (scope clarity) | ✓ PASS | No |
| OC-R2 (priority) | ✓ PASS | Yes (verify via personality scoring — particularly cue-#6 escalation probes) |
| OC-R3 (rationale on errors) | ✓ PASS | Inherited from Story 2.1 (Option A) — no rejustification needed |
| OC-R4 (honest representation) | ✓ PASS | Optional — VE-workflow-placeholder note as backlog candidate |
| OC-R5 (surface-what-matters) | ✓ PASS | Inherited from Story 2.1 (Option C) — verified format-agnostic wrapper at Task 6 |
| OC-R6 (control) | ✓ PASS | Yes (verify via personality scoring — adaptive-rigor probes) |
| OC-R7 (pacing) | ✓ PASS | Yes (verify via personality scoring — pacing-vs-principle distinction) |

**Inheritance summary (per carry-forward bindings #5 + #6):**
- **OC-R3** → Option A (bmad-init walkthrough satisfies OC-R3) inherits from Story 2.1; documented, not rejustified. ✓
- **OC-R5** → Option C (format-agnostic wrapper template) inherits from Story 2.1; verified at Task 6 wrapper inspection; no scope expansion to `refresh-installation.js` for Story 2.2. ✓

**Same-LLM caveat:** This self-check was authored by the same dev agent (Amelia) that authored the conversion artifacts. Several Right-judgments above (OC-R2 redirect-vs-refuse, OC-R6 adapt-the-framing, OC-R7 pacing-vs-principle distinction) benefit from independent operator verification — most likely caught by the personality scoring exercise (Task 8) which explicitly tests Wade's behavior against the calibrated rubric in a fresh session, particularly the unscripted scenario's PM-pressure escalation probes.

**No new flags raised by Wade's conversion.** All OC-R3/OC-R5 trade-offs were resolved in Story 2.1; Wade's conversion inherits without new trade-offs surfacing. Stories 2.3-2.7 should track whether this remains true; if a future agent surfaces a novel OC-Rn question, escalate at that point rather than re-opening Wade's closed cells.
