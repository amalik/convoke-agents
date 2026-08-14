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

**1. After 10 weeks the instrument has produced nothing interpretable, and its one control was
contaminated.**

> **This section was rewritten on 2026-08-14.** It previously argued that the instrument *cannot
> separate signal from noise*, on the evidence that the control agent `stack-detective` has
> byte-identical source across the two recorded commits yet recordings that differ substantially —
> concluding those differences were agent run-to-run nondeterminism, and therefore that noise ≥
> signal. **That argument was wrong, and it was wrong in this ADR before backlog I131 ever restated
> it.** `pf1-record-agent.js` records via `claude -p /<skill>`, which loads the **generated wrapper**
> at `.claude/skills/<agent>/SKILL.md` — gitignored, produced by `refresh-installation.js`, and
> outside every diff that was run. That generator changed between the two commits (`FOLLOW every
> step in the <activation> section precisely` → `FOLLOW the activation steps precisely`, 3 sites).
> **The control carried a real migration-caused instruction delta. It was not a control.** The
> verification was done on what the repo *tracked*, not on what the agent *executed* — the same
> `.claude/skills` gitignore trap that cost a day on 2026-08-10.

What can honestly be said is narrower, and sufficient:

- The corpus is **25% complete** (Prompt 1 of 4) after 10 weeks, and Story 4.3 has not completed
  since 2026-04-28.
- The protocol captures each prompt **once per phase**; `RUNS_PER_AGENT = 3` controls *judge*
  variance, not *agent* variance. There is therefore **no noise floor** against which any
  cross-phase difference could be judged — not because noise is known to be large, but because it
  has never been measured at all.
- The one agent positioned to measure it was contaminated, so the corpus contains **no clean
  control**.
- `pf1-record-agent.js` passes no `--model` and no seed, so nothing recorded so far has a
  controlled generator.

This is a claim about the **state of the evidence**, not about the instrument's ceiling. A
properly-run PF1 might well measure something. Nothing run so far has. The decision below rests on
that, on cost, and on I130 — not on the retracted noise-floor argument.

**2. The cost is structural, not incidental.** Decision 4 prices the manual capture half at
~2-3 hr per phase (~6 hr per cycle), recurring on every release. The scripted helper
(`pf1-record-agent.js`) captures the activation greeting only, by design.

**3. The question is answerable exactly, for free — provided the whole executed surface is
covered.** Convoke's agents are markdown, and "did agent behaviour change?" is downstream of "did
the agent definition change, and how?" — which `git show` answers deterministically. The full
3.3.0 → 4.0-rc agent-surface delta is 26 files / 531 insertions / 343 deletions, readable in
twenty minutes.

The contamination in §1 is the caveat that makes this precise. What an agent executes is **two**
files: the tracked `_bmad/bme/**/agents/<id>.md`, and the generated `.claude/skills/<id>/SKILL.md`
that wraps it. The second is gitignored, so it is invisible to a diff of tracked sources — which
is exactly how a real instruction change slipped past every diff run in §1. But its **generator**
(`refresh-installation.js`) *is* tracked, so the surface remains exactly answerable as long as the
check covers the generator too. `agent-surface-parity.js` was extended to do so on 2026-08-14; a
version of it that only diffed `agents/**` would have inherited the same blind spot it was built
to replace.

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

**Deterministic parity is not behavioural equivalence.** An LLM reading identical definitions can
still phrase its greeting differently, and no static check measures that.

> **Corrected 2026-08-14 (third pass).** This sentence previously continued "— that is precisely
> the variance **the control agent exposed**". It cited the contaminated control as a live example
> of definitional noise, which contradicts §1 and the paragraph below it, both of which establish
> that the control's definitions were **not** identical. The claim above is a statement about how
> LLMs work; it needs no evidence from this corpus, and the corpus does not supply any. Logged
> here rather than silently deleted because this is the **third** time the same retracted framing
> survived a correction pass — it is unusually good at hiding in subordinate clauses.

This ADR asserts that:

- the operator-facing **contract** (agents, menu codes, config loading) is verifiable exactly, and
- the residual behavioural question **was not in fact measured by the retired instrument**, so
  retiring it forfeits no evidence Convoke actually had. (Weaker than the original wording, "not
  measurable by the retired instrument either" — that overstated what §1 supports. A correctly-run
  PF1 might measure it; the one that ran did not.)

**Coverage is only as wide as the surface the check reads.** The drift that contaminated §1's
control was real, migration-caused, and invisible to a diff of `agents/**` — because it lived in
the generated wrapper. `agent-surface-parity.js` now diffs the wrapper generator as well, but the
general lesson stands and applies to any future gate: **diff what the agent executes, not what the
repo tracks.**

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
`pf1-judge-calibration.js`, the judge prompt, and the 8 recordings remain. If a repeat-capture
methodology is ever pursued, the harness is there, and **I130 is already fixed** (2026-08-13), so
it will not fabricate a PASS on a partial corpus. Two caveats for whoever picks it up: the 8
recordings are 25% filled and **cannot** be completed into evidence, because the corpus has no
clean control (§1); and `pf1-record-agent.js` pins neither model nor seed, so any study must fix
both and must diff the **generated wrapper**, not just the tracked agent source. *(This paragraph
previously said "subject to I130 being fixed first" and cited backlog I131 as the follow-on work;
I130 landed the same day, and I131 was retracted — corrected 2026-08-14.)*

> **Note added 2026-08-14, corrected the same day — backlog I131 was RETRACTED, and this ADR was
> NOT unaffected.**
>
> A follow-up analysis (2026-08-13) attempted to put numbers on the noise floor and was demolished
> by review: its control was contaminated, its headline "orders agents backwards" claim was an
> artifact of one metric, and its cost projection priced the wrong experiment.
>
> **The first version of this note claimed "none of that reasoning appears in this ADR, and this
> ADR never depended on it." That was false**, and a second review caught it within a day. The
> contaminated-control argument was **this ADR's own Context §1** — I131 restated it, it did not
> introduce it. The note also listed as a "surviving fact" that *the control agent's recordings
> diverge despite no source change*, which the contamination finding in the very same paragraph
> directly refutes: the generated wrapper **did** change. Retracting I131 while preserving its
> central error in the document that retracts it is precisely the failure mode both retractions
> exist to correct.
>
> **Context §1 and Alternatives §A have been rewritten accordingly.** The decision is unchanged;
> its stated basis is not. What actually carries it:
>
> - the corpus is 25% complete after 10 weeks, with no noise floor and no clean control (§1);
> - **I130** — a partially-complete corpus returns a fabricated PASS regardless of real scores;
> - ~6 hr of manual capture per release, recurring (§2);
> - the executed surface is exactly diffable once the generated wrapper's generator is covered (§3);
> - the replacement covers 12 agents in seconds versus 4 at ~6 hr, verified to fail correctly.
>
> Independently re-measured during review: **menu codes preserved across all four PF1 agents** —
> the contract the replacement checks is demonstrably intact.
>
> Do not cite I131's numbers anywhere. If a real noise-floor figure is ever wanted, the honest
> price is a 25-capture control study over the five byte-identical agents, with the model and
> temperature pinned — `pf1-record-agent.js` currently passes neither, and any such study must
> diff the **generated wrapper**, not just the tracked agent source.

## Alternatives considered

**A — Complete the recordings (~6 hr) and run the gate.** Rejected. Completing Prompts 2-4 adds
captures but not *interpretability*: the protocol still records each prompt once per phase, so
there is still no noise floor to judge any difference against, and the corpus still contains no
clean control (§1). It also inherits I130, under which a partially-complete corpus returns PASS
regardless of the real scores. (This paragraph previously cited backlog **I131** as its authority;
that analysis was retracted on 2026-08-14 and the citation is removed. The reasoning above stands
on the protocol's own design, which is inspectable in `pf1-record-agent.js`, not on I131.)

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
7. **Backlog I130 — DONE 2026-08-13, same day this ADR was written.** ~~The fabricated-PASS
   trigger is live today: `parseRecording` rejects only empty sections, and the 87-byte
   placeholder passes.~~ It was fixed 15 seconds after this ADR's first commit and the present
   tense was never updated — corrected 2026-08-14 after review flagged it as stale. The
   `UNFILLED_PLACEHOLDER` guard now rejects a partially-filled corpus with exit 5; verified by
   executing `parseRecording` against all 8 live recordings, which throw rather than PASS.
   Retiring the gate does not disarm the harness, which is why this was fixed regardless.

## Evidence appendix

```
$ git diff 90bf3115 e8676ffe -- _bmad/bme/_gyre/agents/stack-detective.md
(empty)
  ^ This was read as "the control agent did not change". It does not show that, and the
    inference was withdrawn on 2026-08-14. It shows only that the TRACKED source is identical.
    The agent executes through a generated, gitignored wrapper whose generator DID change:

$ git diff 90bf3115 e8676ffe -- scripts/update/lib/refresh-installation.js | grep '^[-+].*FOLLOW'
-3. FOLLOW every step in the <activation> section precisely
+3. FOLLOW the activation steps precisely      (x3 sites)

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
