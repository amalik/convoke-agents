---
initiative: convoke
artifact_type: release-record
release_target: 4.0.0
m9_pf1_gate: RETIRED
m9_gate_disposition: 'Retired 2026-08-13 by ADR-001; replaced by agent-surface parity (PASS)'
surface_parity_gate: PASS
surface_parity_command: 'node scripts/audit/agent-surface-parity.js v3.3.0 HEAD'
m6_threshold_T: 4.0
pf1_battery_results_path: 'NONE — battery not executed; no results artifact exists'
recording_method: manual
recording_method_detail: 'D2-A scripted (`pf1-record-agent.js`) captured Prompt 1 only; the D2-B operator fill-in for Prompts 2-4 was never performed, so the corpus is 25% complete'
created: '2026-08-13'
signoff_by: 'Amalik (2026-08-13) — M9 retired via ADR-001; release evidence is agent-surface parity, not behavioural equivalence'
baseline_commit: 90bf3115
post_migration_commit: e8676ffe
provisional: true
provisional_basis: 'Authored against a 23/29 v6.3 story baseline (Epic 1B deferred to 4.0.1 under Path A). Requires re-confirmation if any remaining v6.3 story alters agent activation sequences, persona surface, menu codes, or output format — i.e. any of the 5 MO7 regression classes.'
supersedes: 'v1 of this record, signed 2026-08-12 and WITHDRAWN 2026-08-13 after adversarial review (see §Withdrawal)'
schema_version: 1
---

# Release Record — Convoke 4.0.0 · PF1 Behavioural-Equivalence Gate

> ## ✅ M9 RETIRED — release evidence is deterministic surface parity, not behavioural equivalence
>
> **The PF1 battery was never run and never will be for 4.0.** M9 was retired on 2026-08-13 by
> [ADR-001](../planning-artifacts/adr/v63/adr-001-retire-m9-pf1-gate.md). After 10 weeks the
> corpus was 25% complete, with no noise floor (one capture per phase) and no clean control, and
> the harness would have returned a fabricated PASS on it (backlog I130, since fixed).
>
> > **Corrected 2026-08-14.** This banner previously read "because the instrument could not
> > separate signal from noise — a control agent with byte-identical source produced differing
> > recordings." **That reasoning is withdrawn.** The control was contaminated: agents execute
> > through a *generated, gitignored* wrapper whose generator changed between the two compared
> > commits, so byte-identical **tracked** source did not mean the agent was unchanged. The
> > retirement decision is unchanged; its basis is. See ADR-001 §1.
>
> **Replacement evidence, verified 2026-08-14 (re-run after the check was extended):**
> ```
> $ node scripts/audit/agent-surface-parity.js v3.3.0 HEAD
> INFO   (wrapper): wrapper changed between v3.3.0 and HEAD:
>          - 1. LOAD the FULL agent file from …/agents/${}.md
>          - 3. FOLLOW every step in the <activation> section precisely   (x3)
>          + 1. LOAD the FULL agent file from …/agents/${}/SKILL.md
>          + 3. FOLLOW the activation steps precisely                     (x3)
> ✓ PASS — 12 agents, menu codes and config-load preserved.   [exit 0]
> ```
> **Read the INFO block as part of the evidence, not as noise.** The generated wrapper — the file
> agents actually execute — changed in two ways across 3.x → 4.0: the LOAD path moved to the
> skill-dir form, and the activation instruction was reworded. This is disclosed rather than
> buried because it is invisible to any diff of `agents/**`, and hiding there is precisely what
> contaminated PF1's control. It is an *expected* consequence of the skill-dir migration, and the
> operator-facing contract (agents present, menu codes, config load) is unaffected.
>
> This proves the operator-facing **contract** is intact. It does **not** prove behavioural
> equivalence, and Convoke 4.0 makes no such claim.

## Withdrawal of v1 (2026-08-13)

A version of this record was signed on 2026-08-12 asserting `m9_pf1_gate: WAIVED-PARTIAL-SCOPE`
and claiming *"agents activate correctly after migration — supported."* **That claim is
withdrawn.** Three independent adversarial review layers found the record unsound. What was
wrong, plainly:

| v1 claim | Reality |
|---|---|
| *"Agents activate correctly — supported"* | **Unsupported.** See §Why the corpus proves nothing. |
| *"Battery cannot be scoped to Prompt 1 without editing frozen code"* | **False.** `loadAgentRecordings`, `runJudgePairs`, `computeGate`, `writeResults` are all public exports; a consumer script needs no frozen-code change. |
| *"24 of 32 judged pairs would be stub-vs-stub"* | **Wrong arithmetic.** 4 agents × 4 prompts = **16 judged pairs**; ×3 runs = **48 API calls**. Placeholders occupy **12 pairs / 36 calls**. |
| *"~6 hr plus rebuilding the v3.3.0 sandbox"* | Sandbox rebuild is **fictitious** — the worktree still exists at `/Users/amalikamriou/convoke-3x` (`90bf3115`). |
| Operator's binding PROVISIONAL condition | **Silently dropped**, then argued away. Restored in this version's frontmatter. |
| `install-scope-check.js` cited as active mitigation | **Never run** at the time of the claim. Now executed — output below. |
| Tasks 3/5 labelled "WAIVED 2026-08-12" | **Mislabelled.** They were executed at 25% on 2026-05-31 and never finished. |

## M9 — PF1 gate verdict

**RETIRED — never run, and no longer required.** `m9_pf1_gate: RETIRED` is deliberately
*outside* the `PASS|INVESTIGATE|FAIL` enum so no consumer string-matching for a verdict can
mistake it for one. The release gate is now `surface_parity_gate: PASS`, carried as its own key.
Story 4.5 and Story 5B.3 were amended to read the new key; as written they required
`m9_pf1_gate: PASS`, which would have blocked the release permanently.

### Why the battery was not run

The recordings are **25% complete**. Prompt 1 (activation greeting) was captured for all 4
agents in both phases on 2026-05-31. Prompts 2-4 — first capability invocation, follow-up
question, multi-step workflow entry — are the literal 87-byte placeholder:

```
_(D2-B operator fill-in required — see recording-protocol.md §6.1 for manual workflow)_
```

This is the tooling behaving as designed (`pf1-record-agent.js:168` documents the Prompt-1-only
v0 limitation); the manual half, priced at ~2-3 hr per phase in Decision 4, was never done.

### Running it would have produced a meaningless PASS — for a stronger reason than v1 gave

`computeGate` consumes `medianOf([P1,P2,P3,P4])`, and `medianOf` averages the two middle
values of an even-length array. With three identical placeholders scoring 5, the sorted array
is always `[P1,5,5,5]` → median **5**, for every possible value of P1. Verified by execution:

```
P1=1 → agentMedian=5 → PASS (avg 5.00)     P1=4 → agentMedian=5 → PASS (avg 5.00)
P1=2 → agentMedian=5 → PASS (avg 5.00)     P1=5 → agentMedian=5 → PASS (avg 5.00)
P1=3 → agentMedian=5 → PASS (avg 5.00)
```

The real evidence carries **zero weight**, not merely minority weight. Even a score of 1
("outputs are from different agents") is arithmetically erased. **This is a latent harness
defect independent of this story** — any future run with a partially-complete corpus inherits
it. Filed for the backlog.

## Why the corpus proves nothing — the control agent

This is the finding that withdraws v1's central claim, and it comes from the Path B+ control
working exactly as intended.

`_bmad/bme/_gyre/agents/stack-detective.md` is **byte-identical** across the two recorded
commits:

```
$ git diff 90bf3115 e8676ffe -- '*stack-detective*'
(empty)
```

The migration did not touch that agent. Its two recordings nonetheless differ substantially —
numbered list → markdown table, "Stack Detective" → "Technology Stack Detective", added prose.
The same pattern holds for Liam, whose source changed by one line.

Each agent was captured **once per phase**, with no repeat-capture control. Agent run-to-run
nondeterminism is therefore entirely unmeasured — and the control demonstrates it is **as large
as the migration effect being measured**. Differences between baseline and post recordings
cannot be attributed to the upgrade.

**Consequence:** the corpus supports *no* equivalence claim, at any scope. It equally does not
support the opposite claim — an earlier correction to this record read the same differences as
evidence of drift, and that reading was also wrong. Nothing is measured, and as captured the
corpus cannot measure it.

## M6 — drift threshold

**T = 4.0**, unchanged. `GATE_THRESHOLDS = { passAvg: 4, investigateLowAgent: 2 }`. Not evaluated.

## Per-agent evidence

| Agent | Skill | Prompt 1 | Prompts 2-4 | Judged | Source changed 90bf3115→e8676ffe |
|---|---|---|---|---|---|
| Emma | `bmad-agent-bme-contextualization-expert` | captured | placeholder | no | yes |
| Wade | `bmad-agent-bme-lean-experiments-specialist` | captured | placeholder | no | yes |
| Liam | `bmad-agent-bme-hypothesis-engineer` | captured | placeholder | no | 1 line |
| Scout | `bmad-agent-bme-stack-detective` | captured | placeholder | no | **no — control** |

Recordings are structurally valid (8/8 parse to 4/4 keys, provenance present, baseline↔post
prompt sequences identical) and semantically 25% complete. Structural validity is why this was
found by reading content rather than by any check.

**Provenance verified genuine:** the baseline worktree at `/Users/amalikamriou/convoke-3x`
carries 12 bme skills at 3.3.0, and the baseline greetings match v3.3.0 source behaviour
("display numbered list of ALL menu items") rather than 4.0's ("present the Capabilities
table"). The baselines are real 3.x captures, not mislabelled 4.0 ones.

## Mechanical control — executed 2026-08-13

Unlike v1, which cited this without running it:

```
$ node scripts/audit/install-scope-check.js
✓ PASS — all 4 tracked files match snapshot + no scope violations
  Convoke migration scope is mechanically verified within _bmad/bme/ + version metadata.
  This substitutes for the original PF1 spec's 4-BMAD-agent LLM-judged control validation.
exit 0
```

This is the **only** verified evidence in this record. It proves migration scope containment —
that Convoke's changes stayed within `_bmad/bme/` plus version metadata. It does **not** prove
behavioural equivalence.

## Residual risk

**All five MO7 operator-facing regression classes are unverified**, not merely the three v1
admitted. v1's table marked ① ② ⑤ as "partial"; that word was doing work it hadn't earned —
possessing raw bytes is not verification, and the control shows those bytes are confounded.

| MO7 class | Status |
|---|---|
| ① persona / voice drift | unverified |
| ② menu-code changes | unverified *(observation: menu codes appear preserved across all 4 agents — unjudged)* |
| ③ output format / schema | unverified |
| ④ command / capability availability | unverified |
| ⑤ activation-sequence + `on_complete` | unverified |

**Independent partial mitigations:** `install-scope-check.js` (scope containment, verified
above); I97 personality scoring covers 2 of the 4 agents — Emma (`i97-2-1` done) and Wade
(`i97-2-2` done); Liam is `backlog` and Scout has no I97 story. I97 gates merge, not release.

## Ship recommendation

**No equivalence claim is supported.** 4.0 may still ship — that is an operator risk decision —
but it must ship without asserting behavioural equivalence anywhere user-facing.

**Corrective action already taken (2026-08-13):** the claim had already leaked into shipped
content and was corrected at four surfaces — `CHANGELOG.md:18` and `:24` (streamed to every
upgrading user by `convoke-update`), `docs/migration/3.x-to-4.0.md:42`, and
`convoke-announcement-4.0-draft.md:22`, the canonical voice source the CHANGELOG derives from,
where a durable claim-guard note is now pinned. v1 had routed this obligation to Story 5B.1,
which closed on 2026-04-27 and could never have executed it.

## Known downstream blockers this record does not resolve

1. **Story 4.5 Task 0.1** requires `m9_pf1_gate: PASS` **and** Story 4.3 status `done`. Neither
   holds. 4.5 will HALT at its own pre-flight.
2. **Story 5B.3 gate-1** requires 4.3 `done`; dev-story Step 9 cannot reach `done` while
   Tasks 3/5/6 are unchecked.
3. **The fabricated-PASS trigger is still loaded.** `parseRecording` rejects only *empty*
   sections (`body.length === 0`); the 87-byte placeholder passes. Anyone with an API key can
   still run the battery and get a PASS from stub-vs-stub pairs.

These need explicit resolution before 4.0 ships. They are recorded here rather than left for a
future operator to discover.

## The alternative, priced honestly

**~6 hours** of operator time for the D2-B fill-in across both phases (Decision 4's estimate).
**The v3.3.0 sandbox already exists** — `/Users/amalikamriou/convoke-3x` at `90bf3115`, 12 bme
skills installed — so no rebuild is needed; v1 inflated the price with a step that isn't
required.

**Completing the recordings would not by itself fix the corpus.** The control-agent finding
means repeat captures per phase are also needed to separate agent variance from migration
effect. Without that, more prompts yield more unattributable differences.

## Decision taken (2026-08-13)

**M9 retired via ADR-001, accepted by Amalik.** The options below were the choice; the first
was declined, the third was taken. Retained so the reasoning stays legible.

This record was **unsigned** until that decision. v1 was signed, and review found that signing a
"waived" verdict evaded Task 7.4's guard rather than honouring it: AC4 defines the verdict
domain exhaustively as `PASS|INVESTIGATE|FAIL`, EO-8 explicitly abolished operator-discretionary
"ship-with-caveats", and INVESTIGATE — a *measured* adverse outcome — is barred from sign-off.
No-measurement is barred more strongly than adverse measurement, not less.

The operator's options, without a recommendation embedded in the artifact:

- **Ship without the gate**, accepting that no equivalence claim is made anywhere.
- **Complete the corpus** (~6 hr + repeat captures) and run the gate for a real verdict.
- **Formally retire the M9 gate** for 4.0 via a PRD/architecture amendment, rather than waiving
  it story-side — which is where a decision of this weight belongs.

```
Decision: RETIRE M9 (ADR-001)   by: Amalik   on: 2026-08-13
```

**What this signature accepts.** Convoke 4.0 ships with **contract parity verified** (12 agents,
menu codes, config-load) and **no behavioural-equivalence claim**. Persona voice, output
formatting and multi-step workflow behaviour are not gated — and were never actually gated, only
claimed. User-facing copy was corrected on 2026-08-13 to match.
