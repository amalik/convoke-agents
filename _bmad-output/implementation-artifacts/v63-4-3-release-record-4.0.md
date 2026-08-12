---
initiative: convoke
artifact_type: release-record
release_target: 4.0.0
m9_pf1_gate: WAIVED-PARTIAL-SCOPE
m6_threshold_T: 4.0
pf1_battery_results_path: null
recording_method: 'D2-A scripted (`pf1-record-agent.js`, Prompt 1 only) — D2-B operator fill-in for Prompts 2-4 NOT performed'
created: '2026-08-12'
signoff_by: 'Amalik (2026-08-12) — waiver accepted in-session; release claim confirmed scoped to activation-level equivalence'
baseline_commit: 90bf3115
post_migration_commit: e8676ffe
schema_version: 1
---

# Release Record — Convoke 4.0.0 · PF1 Behavioural-Equivalence Gate

> ## ✅ SIGNED — WAIVER ACCEPTED 2026-08-12
>
> **The battery was NOT run.** No API calls were made; no judge verdict exists. This record
> documents a deliberate operator waiver of the M9 gate at partial scope — it is not, and
> must never be cited as, a PASS.
>
> If the recordings are completed later, this record is superseded: delete it and let Task 7
> author a real record from real battery output.

## M9 — PF1 gate verdict

**Decision (2026-08-12): WAIVED at partial scope.** Not PASS. Not FAIL. The gate was not executed at
its designed strength, and this record says so rather than reporting a number.

### Why the battery was not run

The recordings are **25% complete**. Verified 2026-08-11:

| Prompt | Captures | State |
|---|---|---|
| 1 | Activation greeting + menu | ✅ captured — 4 agents × 2 phases |
| 2 | First capability invocation | ⬜ placeholder |
| 3 | Follow-up question | ⬜ placeholder |
| 4 | Multi-step workflow entry | ⬜ placeholder |

All 8 files carry the literal placeholder body:

```
_(D2-B operator fill-in required — see recording-protocol.md §6.1 for manual workflow)_
```

**This is the tooling working as designed, not a defect.** `pf1-record-agent.js:168` states:
*"Prompt 1 captured; Prompts 2-4 left as placeholders for operator D2-B fill-in."* Decision 4
priced the manual half at **~2-3 hr per phase (~6 hr total)**. That work was never done.

### Why running it anyway would have been worse than not running it

Prompts 2-4 are byte-identical between baseline and post — the *same placeholder string*.
The judge would score **24 of 32 pairs** as perfect equivalence, on content that was never
recorded. The gate would report a strong PASS composed mostly of stub-vs-stub matches.

For a **release-blocking** gate, a fabricated PASS is strictly worse than an honest waiver.

## M6 — drift threshold

**T = 4.0** (unchanged). Gate thresholds as shipped in Story 4.2:
`{ passAvg: 4, investigateLowAgent: 2 }` — median ≥ 4.0 averaged across 4 agents, and no
single agent median ≤ 2. Not evaluated in this record.

## Per-agent summary

| Agent | Skill | Prompt 1 | Prompts 2-4 | Judged |
|---|---|---|---|---|
| Emma | `bmad-agent-bme-contextualization-expert` | ✅ both phases | ⬜ | no |
| Wade | `bmad-agent-bme-lean-experiments-specialist` | ✅ both phases | ⬜ | no |
| Liam | `bmad-agent-bme-hypothesis-engineer` | ✅ both phases | ⬜ | no |
| Stack Detective | `bmad-agent-bme-stack-detective` | ✅ both phases | ⬜ | no |

Recordings are **structurally valid** — all 8 parse to 4/4 keys via Story 4.2's
`parseRecording`, all carry provenance comments with timestamps and commits, and baseline
and post prompt sequences match exactly. They are well-formed and mostly empty; no
structural check catches that, which is why this was found by reading content.

**Provenance:** baseline `90bf3115` (v3.3.0) · post-migration `e8676ffe` (4.0.0-rc.1).

## Recording method

**D2-A scripted**, per the Task 1 spike (FM4-2 PASS, 2026-04-28): `claude -p --max-turns N
"/<skill>"` via `scripts/audit/pf1-record-agent.js`. The helper captures the activation
greeting only — a documented v0 limitation, not a failure. The D2-B manual fill-in for
Prompts 2-4 was never performed.

## Residual risk this waiver accepts

Coverage maps to **1 of the 5 MO7 operator-facing regression classes**:

| MO7 class | Covered? |
|---|---|
| ① persona / voice drift | ⚠️ partial — activation greeting only |
| ② menu-code changes | ⚠️ partial — greeting includes the menu |
| ③ output format / schema | ❌ not covered |
| ④ command / capability availability | ❌ not covered |
| ⑤ activation-sequence + `on_complete` hooks | ⚠️ partial |

**Accepted risk:** undetected behavioural drift in capability invocation, follow-up
handling, and multi-step workflow entry across the 3.x → 4.0 migration.

**Partial mitigations that exist independently:** I97 personality scoring covers **2 of the
4** PF1 target agents (FR21-23) — it gates merge rather than release, so it is corroborating
evidence, not a substitute. `install-scope-check.js` provides the mechanical scope assertion
from the Path B+ re-scope.

## Ship recommendation

**Conditional.** This waiver is defensible **only if 4.0's release claim is scoped to match
it.** The distinction is the whole decision:

- *"Agents activate correctly after migration"* — **supported.** Prompt 1 evidence across 4
  agents and both phases, plus I97 on 2 of them.
- *"Agents behave identically after migration"* — **not supported.** Three quarters of the
  designed evidence was never gathered.

If the CHANGELOG or announcement makes the second claim, either soften the claim or complete
the recordings.

## The alternative, priced

**Completing the gate costs ~6 hours** of operator time (Decision 4's own estimate: ~2-3 hr
per phase for the D2-B fill-in), plus rebuilding the v3.3.0 sandbox — `git worktree add
../convoke-3x v3.3.0` — for the baseline half. The scripted Prompt 1 sweep is ~10 min and is
already done.

Recorded here so a future reader sees the counterfactual that was declined, not only the
decision that was taken.

## Operator sign-off

**SIGNED 2026-08-12 by Amalik.** Task 7.4's anti-pattern guard forbids signing off an
INVESTIGATE or FAIL verdict as though it were a pass. That guard is honoured here: this is
explicitly **not** a verdict and **not** a PASS. It is a recorded decision to ship without
the gate, with the accepted risk enumerated above.

Signing this means accepting, on the record, that Convoke 4.0 ships without behavioural-
equivalence evidence for capability invocation and multi-step workflows.

```
Waived by: Amalik                on 2026-08-12
Release claim confirmed scoped to activation-level equivalence: [x] yes
```

**What this signature accepts.** Convoke 4.0 ships without behavioural-equivalence evidence
for capability invocation (MO7 ③/④) and multi-step workflow entry. The release claim is
scoped to *activation-level* equivalence — "agents activate correctly after migration" —
and must not be stated as "agents behave identically after migration" in the CHANGELOG,
announcement, or migration guide.

**Downstream obligation (Story 5B.1).** The CHANGELOG author must verify its equivalence
wording against this scope before release. This is the one place the waiver can leak into a
claim it does not support.
