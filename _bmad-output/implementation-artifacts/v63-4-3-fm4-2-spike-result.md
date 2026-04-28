---
initiative: convoke
artifact_type: spike-result
qualifier: v63-4-3-fm4-2-spike-result
created: '2026-04-28'
schema_version: 1
parent_story: v63-4-3-execute-pf1-validation-cycle-record-compare-and-gate
spike_id: DS1
fm_id: FM4-2
outcome: PASS
recommendation: D2-A
---

# Story 4.3 — DS1 Spike Result: FM4-2 CLI Scriptability

## Outcome: **PASS** → Decision 2 path = **D2-A (scripted recording)**

## Time taken

~10 minutes (well within 30-min hard cap per Decision 5).

## CLI invocation tested (verbatim)

**Working form (slash-command-as-prompt-argument):**

```bash
claude -p --max-turns 5 "/<skill-name>"
```

**Tested invocations + observed behavior:**

### Test 1: `claude --help` flag verification

```bash
claude --help 2>&1 | grep -iE "\-\-print|^\s*\-p[, ]|non-interactive" | head -10
```

**Output (truncated to relevant lines):**

```
Claude Code - starts an interactive session by default, use -p/--print for non-interactive output
  -p, --print    Print response and exit (useful for pipes). Note: The workspace trust dialog is skipped when Claude is run with the -p mode. Only use this flag in directories you trust.
```

**Result:** ✅ `-p / --print` flag exists; non-interactive mode supported. Claude Code version: `2.1.14`. Path: `/opt/homebrew/bin/claude`.

### Test 2: Carson invocation (`bmad-cis-agent-brainstorming-coach`)

```bash
claude -p --max-turns 5 "/bmad-cis-agent-brainstorming-coach"
```

**Output (first 500 chars):**

```
Hey there, friend! Carson here — your breakthrough brainstorming buddy and chief enthusiast for wild ideas!

I've loaded up the Convoke project context and I'm all warmed up and ready to help you generate some AMAZING ideas. You know what I love most about brainstorming? Every idea is a stepping stone — even the "bad" ones are just launchpads for brilliant breakthroughs!

Quick reminder: you can invoke the `bmad-help` skill anytime if you need guidance on what to do next.

Here's what we can cook up together:
...
```

**PASS criteria check (per spec Task 1.1.2):**
- Output contains "Carson": ✅ ("Carson here")
- Persona-authored language/tone: ✅ ("breakthrough brainstorming buddy", "chief enthusiast", exclamation-marked enthusiasm)
- "brainstorming" capability: ✅ (multiple references)
- Capability menu rendered: ✅ (`| Code | Description | Skill |` table with `BS` row)
- Output is parseable (clean text, no tool-trace pollution): ✅

### Test 3: Winston invocation (`bmad-agent-architect`) — reproducibility

```bash
claude -p --max-turns 5 "/bmad-agent-architect"
```

**Output (first 500 chars):**

```
Good afternoon. I'm Winston, your System Architect.

I've loaded the project context and see you're working on Convoke — an extension of the BMAD Method. The context reveals a well-governed project with clear conventions around test isolation, version management, path safety, and skill development lifecycles. I appreciate the emphasis on pragmatic architecture decisions grounded in real trade-offs.

How can I help you today? Here are my capabilities:
...
```

**Reproducibility check:**
- Different agent (Winston vs Carson): ✅
- Different persona tone (calm/pragmatic vs enthusiastic): ✅ (matches manifest persona definitions)
- Same overall structural shape (greeting + intro + capability table): ✅
- Both invocations succeeded with same flag form (`claude -p --max-turns 5 "/<skill>"`): ✅

## Spec deviation discovered (CM-1 refinement)

**The spec's Task 1.1.2 specified `echo "/<skill>" | claude -p "Activate..."` (stdin pipe form).** This form **DOES NOT WORK** — produces `Error: Reached max turns (1)` and `Error: Reached max turns (3)` regardless of `--max-turns` value, because Claude Code's slash-command parsing does not accept slash commands on stdin in `-p` mode.

**The working form is** `claude -p --max-turns 5 "/<skill-name>"` — slash command as the prompt argument directly, no stdin pipe.

**Inversion handler outcome (per Decision 1):** The spec's V-pass-CM-1-fix anticipated that `claude -p` is the right flag (vs `--skill` / `--no-interactive`). That holds. But the V-pass empirical preview tested `echo 'hi' | claude -p "say hello"` (text-as-stdin, prompt-as-arg), not the slash-command form. The slash-command-on-stdin form fails. This deviation is documented here and propagates to Task 2's recording-protocol.

**Implication for D2-A automation:** The new `scripts/audit/pf1-record-agent.js` helper (Task 1.5 of Decision 2 D2-A path) MUST use `claude -p --max-turns N "/<skill>"` form (slash-command-as-prompt-arg), NOT a stdin pipe. The `--max-turns 5` setting is empirically sufficient for activation greeting capture; may need adjustment for deeper prompts (Prompt 2-4 capture).

## Recommendation: **D2-A (scripted via `scripts/audit/pf1-record-agent.js`)**

Per spec Decision 2:
- **D2-A path estimated wall-clock:** ~30 min total for 5 agents × 4 prompts = 20 invocations. Each `claude -p "/<skill>"` call observed at ~5-15s real time (Carson + Winston both completed in <60s including the activation overhead). 20 × ~15s = 300s = 5 min for invocations + protocol overhead = ~30 min total. Well within Decision 5's 3hr hard cap for D2-A.
- **D2-A automation script outline:**
  ```js
  // scripts/audit/pf1-record-agent.js (sketch — Task 1.5 of D2 path)
  const SKILLS = [
    'bmad-agent-bme-contextualization-expert', // Emma
    'bmad-agent-pm',                            // John
    'bmad-agent-architect',                     // Winston
    'bmad-cis-agent-brainstorming-coach',       // Carson (CM-3 fix; NOT bmad-brainstorming)
    'bmad-tea',                                 // Murat
  ];
  const PROMPTS = [
    /* Prompt 1 — Activation greeting */ '/<skill>',
    /* Prompt 2-4 */ ... /* see Task 2 protocol */
  ];
  // For each (skill, prompt): exec(`claude -p --max-turns 5 "${promptText}"`)
  // Capture stdout, write to {phase}/{skill}-{baseline|post}.md with digit-only `## Prompt N` headers
  ```

## Operator override notes

- **Cost note:** Each `claude -p` invocation is a separate Claude API call. For 5 agents × 4 prompts × 2 phases (baseline + post-migration) = **40 LLM calls total**. Operator should be aware of token budget when running the full recording cycle.
- **Concurrency:** `claude -p` invocations from parent Claude Code session work cleanly (verified above). No nested-session auth issues observed. If operator runs the recording outside Claude Code (e.g., direct shell), behavior should be equivalent.
- **`--max-turns` tuning:** `5` worked for activation greeting (Prompts 1). May need to bump higher for deeper-workflow prompts (Prompts 3-4) where the agent walks through multi-step capability invocation. Recording protocol (Task 2) will note this; recording helper script (Task 1.5 of D2 path) should default to `--max-turns 10` for safety.

## Status

- DS1 spike: **CLOSED — PASS**
- Decision 2 path: **D2-A** (scripted via NEW `scripts/audit/pf1-record-agent.js`)
- Inversion handler triggered: NO (V-pass-anticipated `claude -p` flag is correct; only the stdin-vs-prompt-arg form was a refinement)
- Hand off to Task 2: recording protocol authoring with the `claude -p --max-turns 5+ "/<skill>"` form documented

## References

- Story 4.3 — `_bmad-output/implementation-artifacts/v63-4-3-execute-pf1-validation-cycle-record-compare-and-gate.md` (Task 1 + Decision 1 + Decision 2)
- Architecture FM4-2 spec — `_bmad-output/planning-artifacts/convoke-arch-bmad-v6.3-adoption.md:489-498` (per story spec references)
- BMAD agent manifest — `_bmad/_config/agent-manifest.csv` (canonical skill IDs for all 5 PF1 agents)
