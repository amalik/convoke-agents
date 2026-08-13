---
initiative: convoke
artifact_type: adr
qualifier: v63-retire-m9-pf1-behavioural-equivalence-gate
created: '2026-08-13'
status: accepted
schema_version: 1
related_initiative: v63 (BMAD v6.3 adoption / Convoke 4.0)
related_decision: 'Story 4.3 Decision 4 (Path B+ re-scope); Architecture arch:362, arch:367'
supersedes: 'FR36, FR37, FR38, M9 (the PF1 battery and its release-blocking gate) — see §Decision. NOT FR39 (drift snapshots, delivered by Story 4.4) or FR40 (external validation, Story 4.5) — both stand.'
---

# ADR-001: Retire the M9 PF1 behavioural-equivalence gate; replace with deterministic surface parity

**Status:** **Accepted** (2026-08-13, Amalik)
**Initiative:** v63 (BMAD v6.3 adoption → Convoke 4.0)
**Related Requirements:** PRD FR36, FR37, FR38; Measurable Outcome M9; Architecture arch:351, arch:362, arch:367

> **Correction (2026-08-13, pre-acceptance).** An earlier draft of this ADR named FR38 and FR39
> as the superseded set, inheriting that mapping from Story 4.3's own "FR coverage" line. Reading
> the PRD directly shows both were wrong: **FR36** ("Convoke executes a pre-release … validation
> battery (PF1)"), **FR37** (compare pre/post within threshold T) and **FR38** (failure blocks
> release) are the PF1 requirements. **FR39** is drift snapshots — delivered by Story 4.4, `done`,
> and untouched by this ADR. **FR40** is external-user validation (Story 4.5) and also stands.
> Superseding FR39 would have retired a shipped capability by clerical error.
**Related Story:** `v63-4-3-execute-pf1-validation-cycle-record-compare-and-gate` (blocked)

## Context

M9 is Convoke 4.0's release-blocking gate: prove that the 3.x → 4.0 migration did not change
agent behaviour. The mechanism (FR38) is the PF1 battery — record each agent's responses to 4
prompts before and after migration, score the pairs with an LLM judge, and gate on a median
threshold T = 4.0.

Story 4.3 has attempted to execute this gate since 2026-04-28. It has never completed. Three
adversarial review layers examined the attempt on 2026-08-13 and established the following,
all verified by execution:

**1. The instrument cannot separate signal from noise.** Story 4.3's Decision 4 introduced
`stack-detective` (Scout) as a control agent. Its source is **byte-identical** across the two
recorded commits:

```
$ git diff 90bf3115 e8676ffe -- _bmad/bme/_gyre/agents/stack-detective.md
(empty)
```

Its baseline and post-migration recordings nonetheless differ substantially — numbered list →
markdown table, "Stack Detective" → "Technology Stack Detective", added prose. The migration
did not touch that agent, so those differences are **agent run-to-run nondeterminism**. The
protocol captures each agent once per phase; `RUNS_PER_AGENT = 3` controls *judge* variance,
not *agent* variance. Measurement noise is therefore at least as large as the effect being
measured, in both directions. **The control did its job; its signal went unread for 10 weeks.**

**2. The cost is structural, not incidental.** Decision 4 prices the manual capture half at
~2-3 hr per phase (~6 hr per cycle), recurring on every release. The scripted helper
(`pf1-record-agent.js`) captures the activation greeting only, by design.

**3. The question is answerable exactly, for free.** Convoke's agents are markdown tracked in
git. "Did agent behaviour change?" is downstream of "did the agent definition change, and
how?" — which `git show` answers deterministically. The full 3.3.0 → 4.0-rc agent-surface
delta is 26 files / 531 insertions / 343 deletions, readable in twenty minutes.

An LLM-judged equivalence gate is the right instrument when the artifact is opaque — a trained
model, a compiled binary, a remote service. Convoke's agents are none of those. **PF1 imported
a technique for a problem Convoke does not have.**

## Decision

**Retire M9 as a release-blocking gate. Supersede FR36, FR37 and FR38.** Replace with deterministic
agent-surface parity, implemented as `scripts/audit/agent-surface-parity.js`.

The replacement checks, exactly and reproducibly, the operator-facing contract:

| Property | MO7 class | Method |
|---|---|---|
| Agent exists (not removed/renamed) | ④ | `git ls-tree` over `_bmad/bme/**/agents/` |
| Menu codes preserved | ② ④ | format-agnostic extraction of `[XX]` and `\| XX \|` |
| Activation still loads config | ⑤ | pattern check on the activation sequence |

Result on the actual migration:

```
✓ PASS — 12 agents, menu codes and config-load preserved.
  Proves contract parity, NOT behavioural equivalence.
```

**12 agents** versus PF1's 4, in seconds, with no API key and no manual capture. Verified to
fail correctly: a synthetic tree with one dropped menu code and one deleted agent exits 2 and
names both.

`scripts/audit/install-scope-check.js` is retained unchanged as the scope-containment control
(verified passing, exit 0).

## What this decision explicitly does NOT claim

**Deterministic parity is not behavioural equivalence.** An LLM reading identical definitions
can still phrase its greeting differently — that is precisely the variance the control agent
exposed, and no static check measures it. This ADR asserts that:

- the operator-facing **contract** (agents, menu codes, config loading) is verifiable exactly, and
- the residual behavioural question is **not measurable by the retired instrument either**, so
  retiring it forfeits no evidence Convoke actually had.

Convoke 4.0 therefore ships **without** a behavioural-equivalence claim. User-facing copy was
corrected accordingly on 2026-08-13 (`CHANGELOG.md`, `docs/migration/3.x-to-4.0.md`,
`convoke-announcement-4.0-draft.md`).

## Consequences

**Positive.** The gate becomes runnable in CI on every commit rather than once per release at
~6 hr cost. Coverage triples (4 → 12 agents). The result is reproducible and reviewable.
Story 4.3 unblocks; Stories 4.5 and 5B.3 unblock (see Migration below).

**Negative, stated plainly.** Convoke loses its aspiration to *prove* behavioural equivalence.
Persona voice, output formatting, and multi-step workflow behaviour are no longer gated —
they were never actually gated, but the PRD claimed they would be. Anyone who valued that
claim should read §Alternatives, where the honest path to it is priced.

**Neutral.** The PF1 assets are not deleted. `pf1-validation-battery.js`, `pf1-record-agent.js`,
`pf1-judge-calibration.js`, the judge prompt, and the 8 recordings remain. If backlog **I131**
(repeat-capture methodology) is ever done, the harness is there — subject to **I130** being
fixed first.

> **Note added 2026-08-14 — backlog I131's quantification was RETRACTED; this ADR is unaffected.**
> A follow-up analysis (2026-08-13) attempted to put numbers on the noise floor and was demolished
> by review: its control was contaminated (the recorder loads a *generated*, gitignored wrapper
> whose generator changed between the commits), its headline "orders agents backwards" claim was an
> artifact of one metric, and its cost projection priced the wrong experiment. **None of that
> reasoning appears in this ADR, and this ADR never depended on it.**
>
> What this ADR rests on is unchanged and was independently corroborated during that same review:
> (a) the control agent's recordings diverge **at all** despite no source change — a qualitative
> fact that survives the retraction; (b) the artifact is transparent markdown, so `git show`
> answers the question exactly; (c) the deterministic replacement covers 12 agents in seconds
> versus 4 at ~6 hr. Review independently measured **menu-code divergence of 0.000 across all four
> PF1 agents** — the contract the replacement checks is demonstrably preserved.
>
> Do not cite I131's numbers anywhere. If a real noise-floor figure is ever wanted, the honest
> price is a 25-capture control study over the five byte-identical agents, with the model and
> temperature pinned — `pf1-record-agent.js` currently passes neither.

## Alternatives considered

**A — Complete the recordings (~6 hr) and run the gate.** Rejected. I131 shows this produces
*more unattributable differences*, not evidence: without repeat captures per phase there is no
noise floor to judge against. It also inherits I130, under which a partially-complete corpus
returns PASS regardless of the real scores.

**B — Fix the methodology (repeat captures + I130 harness fix), then run.** Rejected *for 4.0*,
retained as backlog I130/I131. It is the only path to a genuine behavioural claim, and if
Convoke later markets behavioural equivalence it must be done. It is not justifiable as a
blocker on a release already three months delayed, for a claim the product no longer makes.

**C — Waive M9 per-release.** Rejected, and already attempted: a waiver was signed on
2026-08-12 and withdrawn on 2026-08-13. Review found that signing a "waived" verdict evades
Task 7.4's guard rather than honouring it — AC4 defines the verdict domain exhaustively as
`PASS|INVESTIGATE|FAIL`, and arch:367's EO-8 explicitly abolished operator-discretionary
"ship-with-caveats". A recurring waiver is a standing exception to a requirement nobody intends
to meet; retiring the requirement is the honest form of the same decision.

## Migration / follow-through

Accepting this ADR requires:

1. **PRD** — mark FR36, FR37, FR38 and M9 superseded-by this ADR. **Leave FR39 and FR40 untouched.** Do not delete; the original
   requirement should stay legible alongside why it changed.
2. **Architecture** — arch:362 (Stage 4 gate) and arch:367 (EO-8 INVESTIGATE semantics) point
   at a gate that no longer exists; re-point at surface parity.
3. **Story 4.5** — Task 0.1 requires `m9_pf1_gate: PASS`. Amend to require the parity check
   passing. Currently blocks the release.
4. **Story 5B.3** — gate-1 requires Story 4.3 `done`. Story 4.3 closes as `descoped-by-ADR`
   rather than completed.
5. **Story 4.3 release record** — cite verified parity output in place of "nothing is known".
6. **CI** — add `agent-surface-parity.js` to the pipeline (base ref = last release tag).
7. **Backlog I130** — fix regardless. The fabricated-PASS trigger is live today: `parseRecording`
   rejects only empty sections, and the 87-byte placeholder passes. Retiring the gate does not
   disarm the harness.

## Evidence appendix

```
$ git diff 90bf3115 e8676ffe -- _bmad/bme/_gyre/agents/stack-detective.md
(empty — control agent source unchanged, recordings differ anyway)

$ node scripts/audit/agent-surface-parity.js 90bf3115 e8676ffe
✓ PASS — 12 agents, menu codes and config-load preserved.   [exit 0]

$ node scripts/audit/install-scope-check.js
✓ PASS — all 4 tracked files match snapshot + no scope violations   [exit 0]

Harness defect (I130), verified by execution:
  medianOf([P1,5,5,5]) === 5 for P1 ∈ {1,2,3,4,5}  →  PASS avg 5.00 in every case
```

## Operator decision

```
Accepted: 2026-08-13   by: Amalik
```

Rejecting this ADR is a coherent choice — it means committing to Alternative B and funding the
methodology fix before 4.0 ships. What is not coherent is leaving M9 in the PRD as a
requirement that is neither met nor retired.
