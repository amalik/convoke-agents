---
initiative: convoke
artifact_type: report
qualifier: operator-covenant-self-check-emma-conversion
created: '2026-05-02'
status: pass
schema_version: 1
related_initiative: I97
related_story: i97-2-1
---

# Operator Covenant Self-Check — Emma Conversion (Story i97-2.1, Round 1)

**Status:** Draft. Self-check authored by Amelia (dev agent) during Story 2.1 implementation. **Operator confirmation required at PR review** — same-LLM-as-implementation bias means several judgments below benefit from independent operator verification.

**Source artifacts under check:**
- `_bmad/bme/_vortex/agents/contextualization-expert/SKILL.md` (converted v6.3+)
- `_bmad/bme/_vortex/agents/contextualization-expert/references/{lean-persona,product-vision,contextualize-scope,validate-context}.md` (4 capability prompts)
- `_bmad/bme/_vortex/module.yaml` (Emma's `agents:` entry)
- `_bmad/bme/_vortex/module-help.csv` (Emma's row, BMM-canonical schema)
- `.claude/skills/bmad-agent-bme-contextualization-expert/SKILL.md` (alias wrapper) — **flagged: operator-reverted post-conversion; see OC-R3 + OC-R5 sections below**

**Reference documents:**
- [Operator Covenant](convoke-covenant-operator.md) — one axiom + 7 Operator Rights (OC-R1..R7)
- [Compliance Checklist](convoke-spec-covenant-compliance-checklist.md) — per-Right checks

## OC-R0 — Enumeration precondition

The full 3-layer interaction surface for Emma post-conversion:

**Layer 1 — Slash-command activation:**
- `/bmad-agent-bme-contextualization-expert` invokes the alias wrapper at `.claude/skills/bmad-agent-bme-contextualization-expert/SKILL.md`. The wrapper loads the canonical SKILL.md and follows its `## On Activation` instructions.

**Layer 2 — Canonical agent SKILL.md (post-conversion v6.3+):**
- `## On Activation` delegates config loading to `bmad-init` skill (interactive walkthrough on missing config).
- Greets `{user_name}` with curious-clarifying persona; presents `## Capabilities` table (8 entries: 4 routed LP/PV/CS/VL + 4 meta MH/CH/PM/DA).

**Layer 3 — Capability prompts (`references/{cap}.md`):**
- Each routed code (LP, PV, CS, VL) loads a Pattern-C-friendly capability prompt (~21 lines: Identity / How It Works / Output Expectations / Activation).
- Capability prompt invokes the workflow at `_bmad/bme/_vortex/workflows/{name}/workflow.md` (workflow source unchanged per FR12).
- Workflow executes the 6-step facilitated process; emits artifact at `{output_folder}/vortex-artifacts/{type}-{slug}-{date}.md`.

**Cells answered against this enumeration:** OC-R1..R7 below. Per OC-R0, cells answered against an incomplete surface are invalid; the enumeration above is complete to the operator-facing interaction surface for Emma's converted form.

## OC-R1 — Right to scope clarity

**The operator must always know what's in scope.**

**PASS** with rationale:
- Layer 1 wrapper description: "Strategic context architect (Emma) — Vortex Framework Contextualize stream. Lean personas, product vision, scope contextualization. Refuses solutions before WHO/WHY/WHICH-problem framing is established." — surfaces what Emma does + what she refuses.
- Layer 2 `## Overview` (3-sentence) + `## Identity` + `## Communication Style` + `## Principles` (6 bullet points) explicitly bound Emma's competence and behavior.
- Layer 2 `## Capabilities` table makes the 8 menu items explicit; routed vs meta distinction visible.
- Layer 3 capability prompts each declare `## Identity` + `## Output Expectations` — operator sees what each capability produces before invoking.
- The "**CRITICAL Handling**" section in `## On Activation` explicitly reminds the operator (via Emma's instructions) what's NOT in scope: "DO NOT invent capabilities not listed", "DO NOT dive into a solution before WHO/WHY/WHICH-problem framing".

## OC-R2 — Right to priority

**The operator decides what comes first.**

**PASS** with rationale:
- The capability menu is presented but operator chooses (per Layer 2 `## On Activation` step 3: "STOP and WAIT for user input — Do NOT execute menu items automatically").
- Within each capability, the workflow source files (Layer 3) follow step-file architecture with explicit checkpoints (operator consents per step per project convention).
- Emma's "context-before-solutions" principle is enforced by Emma in conversation, but the principle does NOT override operator priority — the `**CRITICAL Handling**` line says "If the user asks for solution help with thin context, redirect to a Capabilities item that establishes context first" — *redirect*, not *refuse*. The operator can always say "do it anyway" and Emma should accept that judgment per OC-R2.
- **Same-LLM caveat:** I authored the "redirect" framing. Operator should verify at PR review that "redirect" doesn't slide into "refuse" in actual conversation. Round 1 personality preservation scoring (Task 8 handoff) will surface this.

## OC-R3 — Right to rationale on errors

**When something fails, the operator gets a clear explanation of why and how to fix it.**

**PASS** — operator-confirmed 2026-05-02 (Option A: accept walkthrough as OC-R3 implementation):
- **v5 fail-loud preservation deliberately departed from.** Pre-migration Emma had a hardcoded `<step n="2">` block emitting `❌ Configuration Error: Cannot load config file at...` with explicit recovery instructions. Post-conversion, this is replaced by delegation to `bmad-init` (interactive walkthrough on missing config).
- **Operator decision (2026-05-02):** Option A — walkthrough satisfies OC-R3. Pedagogy preferred over punition. No per-agent fail-loud block restored; no fail-loud added to bmad-init (path b deferred). Story 2.1 establishes precedent for Stories 2.2-2.7: delegate to bmad-init for config-load failures.
- **Rationale recorded:** the walkthrough teaches the operator how to set up config rather than emitting a punitive error. Both satisfy OC-R3's letter ("operator gets help"); the walkthrough is more pedagogical. Centralized in bmad-init = DRY across 7 agents (vs. per-agent fail-loud blocks × 7).
- **Carry-forward to Stories 2.2-2.7:** same delegation pattern. No per-agent fail-loud blocks needed. If multiple agents surface bmad-init init-path failures in practice, escalate as architectural issue (path c in original 3-option analysis) — but absent that signal, current state holds.
- **Latent risk acknowledged:** if bmad-init's init-path is silent or broken under some failure mode, OC-R3 would be silently violated (operator gets no diagnostic). Mitigation: opportunistic broken-config probe (delete `_bmad/bme/config.yaml`, invoke `/bmad-agent-bme-contextualization-expert`, verify init-path fires cleanly). Not blocking PR review; track as Fast-lane backlog candidate if operator hits a silent failure later.

## OC-R4 — Right to honest representation

**The agent represents the operator's intent + the codebase's actual state truthfully.**

**PASS** with rationale:
- Emma's `## Identity` says "Specialist in the Contextualize stream" — accurate; she only does Contextualize work, not other Vortex streams.
- The `## Capabilities` table represents what Emma *can* do, not aspirational; routed capabilities require actual workflow source files (verified by FR12 + the new `tests/integration/vortex-parity.test.js`).
- The wrapper description doesn't claim more than Emma delivers.
- **Module.yaml description placeholder:** the description field currently says "(Description TBD-finalize at PR review.)" — that's an honest placeholder, not aspirational fiction. Will be finalized at PR review per AC7.

## OC-R5 — Right to surface-what-matters

**Critical info isn't buried under boilerplate.**

**PASS** — operator-confirmed 2026-05-02 (Option C: format-agnostic template fix applied).

**Misattribution correction (recorded for traceability):** The original draft of this self-check stated "the wrapper update was reverted by the operator." That was wrong. The wrapper at `.claude/skills/bmad-agent-bme-contextualization-expert/SKILL.md` is **gitignored** ([.gitignore:62](../../.gitignore)) and auto-generated by [refresh-installation.js](../../scripts/update/lib/refresh-installation.js) from a template. When I rewrote it during Story 2.1 Task 6, automated tooling regenerated it on its next run — not an operator action. The system-reminder stating "intentional" referred to the regeneration's deliberateness, not an operator edit. I conflated the two and wrote the wrong attribution. Confirmed via `git ls-files` (untracked) + comparison against 12 other identical bme agent wrappers (Isla/Mila/Liam/Wade/Noah/Max + Gyre + team-factory).

**Resolution applied (2026-05-02):** Format-agnostic template fix at [refresh-installation.js:710](../../scripts/update/lib/refresh-installation.js), [:736](../../scripts/update/lib/refresh-installation.js), [:761](../../scripts/update/lib/refresh-installation.js).

```
- 3. FOLLOW every step in the <activation> section precisely
+ 3. FOLLOW the activation steps precisely
```

This wording works for both v5 `<activation>` blocks and v6.3+ `## On Activation` sections. Result:
- All 13 bme agent wrappers (Vortex 7 + Gyre 4 + team-factory + standalone bme) regenerate to format-agnostic vocab on next refresh
- Stories 2.2-2.7 do NOT need to revisit the wrapper template
- Migration window safe — works for not-yet-converted v5 agents AND for converted v6.3+ agents

**Validation:**
- Emma's wrapper regenerated successfully (line 11 now reads `FOLLOW the activation steps precisely`)
- Vortex-parity tests: 9/9 pass for Emma
- Unit tests: 681/682 pass (1 pre-existing skip, 0 fail)
- No tests assert the v5 wording

**In the canonical SKILL.md** (Layer 2): structure surfaces what matters in the natural reading order — Overview → Identity → Communication Style → Principles → Capabilities → On Activation. The `**CRITICAL Handling**` block at the end uses bold + explicit DO NOT phrasings.

**Scope-expansion note:** Per Story 2.1's POC mandate, this template fix exceeds the per-agent boundary (touches shared tooling). Justified because Emma's conversion is what surfaces the wrapper-template's stale reference to `<activation>` — fixing it in the same PR closes the OC-R5 violation Emma's conversion otherwise introduces. Story PR description should note the scope expansion.

## OC-R6 — Right to control

**The operator can interrupt, redirect, modify, or undo.**

**PASS** with rationale:
- v6.3+ outcome-based markdown doesn't encode hardcoded control-flow steps; activation is persona-driven, which means the operator can interrupt at any point and Emma will respond per persona principles rather than per fixed-step counter.
- Each capability prompt has an explicit "Activation" section that hands control back to the operator at the workflow boundary.
- The DA (Dismiss Agent) menu item is preserved — operator can exit Emma at any time.
- The `**CRITICAL Handling**` line says "DO NOT break character until the user dismisses Emma via DA or equivalent exit command" — Emma will exit on operator command, not pre-emptively.

## OC-R7 — Right to pacing

**The operator sets the pace; the agent doesn't rush through confirmation points.**

**PASS** with rationale:
- The activation flow includes `**STOP and WAIT for user input**` at Step 3 — explicit pacing checkpoint.
- Capability prompts route to workflow source files with their own step-file architecture (each step requires operator consent).
- Emma's curious-clarifying persona is itself a pacing tool — by asking WHO/WHY before WHAT, Emma slows down operators who'd otherwise rush to solution.
- The reviewer cue from rubric § "Status" (#2 — operator-preference vs principle-violation distinction) suggests Emma should adapt her pacing to operator preference. The post-conversion canonical SKILL.md doesn't explicitly encode this, but the persona content + `**CRITICAL Handling**` "redirect" framing aligns with the cue.

## Summary

| Right | Verdict | Operator confirmation needed? |
|---|---|---|
| OC-R0 (enumeration precondition) | ✓ Complete enumeration | No |
| OC-R1 (scope clarity) | ✓ PASS | No |
| OC-R2 (priority) | ✓ PASS | Yes (verify at personality scoring) |
| OC-R3 (rationale on errors) | ✓ PASS | Resolved 2026-05-02 — Option A confirmed |
| OC-R4 (honest representation) | ✓ PASS | No |
| OC-R5 (surface-what-matters) | ✓ PASS | Resolved 2026-05-02 — format-agnostic template fix applied |
| OC-R6 (control) | ✓ PASS | No |
| OC-R7 (pacing) | ✓ PASS | Yes (verify at personality scoring) |

**Both flags resolved 2026-05-02:**
1. ~~**OC-R3 trade-off**~~ → Operator chose Option A (walkthrough satisfies OC-R3). Pedagogy preferred over punition. Carry-forward: Stories 2.2-2.7 use same delegation pattern.
2. ~~**OC-R5 violation**~~ → Operator chose Option C (format-agnostic template fix). Wrapper template at [refresh-installation.js](../../scripts/update/lib/refresh-installation.js) updated; all 13 bme agent wrappers will regenerate to format-agnostic vocab. Misattribution correction recorded.

**Same-LLM caveat:** This self-check was authored by the same dev agent (Amelia) that authored the conversion artifacts. Several Right-judgments above (especially OC-R2 redirect-vs-refuse, OC-R5 surface ordering, OC-R7 pacing) benefit from independent operator verification — most likely caught by the personality scoring exercise (Task 8) which explicitly tests Emma's behavior against the calibrated rubric in a fresh session.
