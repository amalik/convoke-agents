# Per-Agent Fixup Checklist (BMB-Conversion Output Review)

This checklist is the **manual fixup contract** required by [ADR-002](../../../_bmad-output/planning-artifacts/adr/i97/adr-002-conversion-tooling-architecture.md). Every per-agent conversion PR (Epic 2 Stories 2.1–2.7 of I97) runs the BMB tooling (`bmad-agent-builder` + `bmad-workflow-builder` "convert" mode), then applies this checklist before merge.

**Context.** BMB tooling produces v6.3+ outcome-based markdown shape correctly (verified via [`spike-marketplace-packaging-delta.md`](../../../_bmad-output/implementation-artifacts/spike-marketplace-packaging-delta.md) diagnostic, 2026-04-28). However, BMB output may need manual fixup per agent — the four categories below capture the patterns we know about. Reviewers cite the specific category in PR comments rather than generic "improve UX" notes.

**Scope reuse.** This checklist is **migration-general**; the four categories apply equally to I97 (Vortex), I98 (Gyre), I99 (Team Factory). Agent-specific items (the actual menu codes, the actual workflow paths) belong in the per-agent PR template body, not in this checklist.

---

## Category 1 — Persona preservation

**What this prevents.** BMB conversion can drift on long agent personas: phrases get omitted, role-conveyance markers get rewritten, communication-style examples disappear. A persona-drifted agent passes parity tests (menu codes match) but fails the personality preservation rubric (FR23 disconfirmation: any dimension at score 1 blocks merge).

### Reviewer steps

- [ ] **Diff pre-migration `<persona>` against post-migration `## Identity` / `## Communication Style` / `## Principles` sections.** Use `diff` or visual side-by-side. Flag every phrase deletion, addition, or reword that changes:
  - Role conveyance (D1 of the rubric — "what role does this agent identify as?")
  - Communication-style markers (D2 — characteristic phrasings, tone register, recognizable openers like Liam's "💡" or Wade's "🧪")
  - Principle adherence (D3 — explicit `<principle>` items that appear pre-migration)
- [ ] **Cross-reference the 8 reviewer cues** documented in [`convoke-spec-personality-preservation-rubric.md`](../../../_bmad-output/planning-artifacts/convoke-spec-personality-preservation-rubric.md) § "Status":
  1. Meta-pattern awareness (all 7 agents demonstrate this — verify the converted agent retains it)
  2. Operator-preference vs principle-violation distinction (lean response style ≠ degraded principle adherence)
  3. Intellectual honesty as D3 component (specifically Liam — Bayesian concession example)
  4. Meta-system Vortex-role-split awareness (specifically Noah T7 — refusing-to-prescribe is the principle, not weakness)
  5. Wade's pedagogical adaptive-rigor (preserves principle while adapting framing rigor under pressure)
  6. Mila's bias-naming under deadline pressure (Story 2.3 specific cue)
  7. Isla's progressive-discovery ladder under constraint (Story 2.4 specific cue)
  8. (Reserved — see rubric for current count)
- [ ] **Run the personality harness in `mode: 'capture'`** post-conversion. Compare against the existing baseline fixture for this agent under [`tests/migration/personality-preservation/fixtures/<agent>/`](../../../tests/migration/personality-preservation/fixtures/) (all 7 agents have baselines from Story 1.2 pre-test).

### Fixup action if violated

- **Minor drift** (single phrase reworded, role label intact): manually patch the converted SKILL.md with the missing content; re-run the personality harness.
- **Major drift** (multiple persona markers missing, communication-style register changed): re-run the BMB conversion with `--preserve-persona` flag (if available); if BMB doesn't support it, escalate via `bmad-correct-course` to determine whether the gap is a BMB tooling bug (file upstream issue) or a fixup-checklist gap (amend this section in a follow-up).

---

## Category 2 — Hardcoded error-string preservation (Operator Covenant fail-loud signal per OC-R3)

**What this prevents.** v5 SKILL.md files include a hardcoded error-handling block at activation step 2 — the `🚨 IMMEDIATE ACTION REQUIRED — BEFORE ANY OUTPUT` config-validation section that emits user-visible error vocabulary like `"❌ Configuration Error: Cannot load config file at"`, `"This file is required for [Agent] to operate. Please verify:"`, `"Required fields: user_name, communication_language, output_folder"`. The v6.3+ format delegates activation to the `bmad-init` skill, but the **fail-loud user-visible behavior must remain reachable** post-migration. If `bmad-init` swallows the error or formats it differently, the converted agent silently breaks the operator's expectation set by the v5 version.

This is an **Operator Covenant OC-R3 (Right to rationale on errors)** concern, not a stylistic one.

### Reviewer steps

- [ ] **Identify the v5 fail-loud error block** in the pre-migration SKILL.md (typically activation step n=2). Capture the exact error vocabulary: title (`❌ Configuration Error`), message format, list of required fields, recovery instructions.
- [ ] **Trigger the config-not-found case** in a test fixture. The simplest path:
  ```bash
  # In an isolated tmpDir without _bmad/bme/_vortex/config.yaml present
  /bmad-bme-agent-<name>  # or whatever the converted slash-command is
  ```
- [ ] **Verify the user sees the same error vocabulary post-migration.** The error must include (at minimum):
  - The phrase `Configuration Error` (or its `bmad-init`-delegated equivalent if [`bmad-init`](../../../.claude/skills/bmad-init/SKILL.md) standardizes it)
  - The path that was attempted (`_bmad/bme/_vortex/config.yaml`)
  - The list of required fields (`user_name`, `communication_language`, `output_folder`)
  - A recovery hint (verify file exists / valid YAML / contains required fields)
- [ ] **Confirm `bmad-init` activation is wired correctly** in the converted SKILL.md's `## On Activation` section. Activation should delegate to `bmad-init` rather than encode hardcoded `<step>` orchestration.

### Fixup action if violated

- If `bmad-init` already standardizes the error vocabulary acceptably: nothing to do; the converted agent inherits it.
- If `bmad-init` produces a less-fail-loud error (e.g., a generic "config error" without the 3-field list): manually add a custom error-handling section in the converted SKILL.md's `## On Activation` (preserve v5 vocabulary), or escalate to upstream BMM to enrich `bmad-init`'s default error messaging.
- If the error path doesn't fire at all post-migration (`bmad-init` swallowed it silently): this is a fail-loud regression and **blocks merge**. Diagnose whether `bmad-init` requires explicit invocation, then patch.

---

## Category 3 — Capability menu code preservation

**What this prevents.** A converted agent that adds, removes, or renames menu codes silently breaks every operator workflow + every existing slash-command pointer. Menu codes are part of the public API of each agent.

### Reviewer steps

- [ ] **Extract pre-migration menu codes.** From the pre-migration SKILL.md `<menu>` block, capture the set of menu codes (the `[XX]` bracketed prefixes). Example for Emma: `{ MH, CH, LP, PV, CS, VL, PM, DA }`.
- [ ] **Extract post-migration menu codes.** From the converted SKILL.md `## Capabilities` table, capture the `Code` column values.
- [ ] **Assert lexical equality of the code-set** (order doesn't matter; presence does):
  ```bash
  # Pseudo-shell — adapt to whatever extraction tool you use
  diff <(extract-v5-codes pre-migration.md | sort) <(extract-v63-codes post-migration.md | sort)
  ```
  Output must be empty.
- [ ] **For each menu code, verify the routed workflow path is unchanged** (per Category 4 below; the two checks are paired).

### Fixup action if violated

- **Code added.** The convert step introduced a new capability that didn't exist pre-migration. Decide whether the new capability is intentional (then update the per-agent PR description and parity test expectations) or accidental (remove from the converted SKILL.md). Default: remove unless the operator approved the addition.
- **Code removed.** The convert step dropped a capability. Restore it in the converted SKILL.md `## Capabilities` table; ensure the corresponding `references/<workflow-name>.md` capability prompt is also present (per Category 4).
- **Code renamed.** Rare but plausible. Restore the original code; if the rename was justified (typo fix in v5), file a separate post-I97 cleanup story rather than land it inside the conversion.

---

## Category 4 — Workflow file path preservation per FR12

**What this prevents.** FR12 mandates that workflow source files at `_bmad/bme/_vortex/workflows/<name>/workflow.md` and step files **remain unchanged** in I97. Only the agent-internal `references/<workflow-name>.md` capability prompts are derived (new). A conversion that relocates, renames, or rewrites a workflow source file violates FR12 and breaks every test that touches that workflow.

### Reviewer steps

- [ ] **List the agent's pre-migration workflow paths.** Extract the `exec="{project-root}/_bmad/bme/_vortex/workflows/<name>/workflow.md"` values from the pre-migration `<menu>` block.
- [ ] **Verify each workflow path still exists post-migration:**
  ```bash
  for path in $(extract-workflow-paths pre-migration.md); do
    test -f "$path" || echo "MISSING: $path"
  done
  ```
  Expected output: empty. Any `MISSING:` line is a violation.
- [ ] **Diff each workflow source file against pre-migration:**
  ```bash
  git diff main -- _bmad/bme/_vortex/workflows/
  ```
  Expected output: empty (no workflow source modifications in this PR per FR12).
- [ ] **Verify each capability prompt at `references/<workflow-name>.md` routes to the correct workflow path.** The capability prompt should *invoke* the workflow (via `Load \`./references/<cap>.md\`` convention then handing off to the workflow), not duplicate the workflow's content.

### Fixup action if violated

- **Workflow source file modified.** Restore from `main` (`git checkout main -- _bmad/bme/_vortex/workflows/<name>/workflow.md`). The conversion should never touch workflow source.
- **Workflow source file moved/renamed.** Restore original location. If the move was intentional (e.g., the workflow naming is genuinely wrong), file a separate post-I97 story. Do not bundle workflow rewriting into a per-agent conversion PR.
- **Capability prompt duplicates workflow content** (not invokes it). Rewrite the capability prompt to be Pattern-C-friendly per FR10 (Identity + How It Works + Output Expectations + Activation sections only — the actual workflow logic stays in the workflow source file).

---

## Sign-off

When all four categories pass for the agent under review, the reviewer adds a comment in the per-agent PR:

```
✅ Fixup checklist applied — Category 1 (persona): clean / Category 2 (fail-loud OC-R3): preserved / Category 3 (menu codes): identity confirmed / Category 4 (FR12 workflow source): unchanged + capability prompts route correctly.
```

If any category surfaces a violation that the dev couldn't fix in-PR (rare — typically a BMB tooling gap or upstream `bmad-init` issue), escalate via `bmad-correct-course` and link the escalation in the PR.
