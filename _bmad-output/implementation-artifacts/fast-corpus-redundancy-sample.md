# Fast Story: Sampled redundancy read — answer abort condition 1 (T90)

**Status:** ready-for-dev · **Lane:** Fast (spike — time-boxed, uncertain outcome) · **Source:** P60 plan step 1b, uncovered 2026-08-27 · **Backlog ID:** T90

**Parent:** **P60** — Knowledge & Documentation Governance.
**Governed by:** [`adr-001-cleanup-scope.md`](../planning-artifacts/adr/p60/adr-001-cleanup-scope.md) (accepted 2026-08-27).

---

## Context

P60's plan has a step **1b** — *"sampled deep read, ~30 documents chosen by the instrumented pass"* — that was cut when the baseline spike was capped to the link graph alone. The cut was right at the time. But **1b was never re-filed**, so the initiative currently has no step that answers the question it was started for.

Amalik's opening complaint was **"there are too many documents."** That is a claim about *content*. Everything delivered so far is *structure*: naming, coverage, frontmatter, 673 broken references. A corpus of ~1,500 files could be 400 documents and 1,100 restatements, and every instrument built so far would report it as well-attributed and healthy.

**Abort condition 1 is still open** and it is the only one that can still reshape P60:

> *Redundancy turns out low → "too many documents" is false, step 8b is unwarranted, and the plan ends at staleness.*

Four ADRs (OQ-1…OQ-4) are queued behind this. Ruling them first means deciding the *shape* of work that may not be warranted.

---

## Story

As a Convoke maintainer,
I want a defensible sample of the corpus read for redundancy against a threshold fixed in advance,
so that P60 either proceeds to a merge/retire pass on evidence, or stops at staleness — instead of the question being answered by impression, or not at all.

---

## The trap that is real

**This is the one step in P60 that cannot be verified by re-running anything.** A link check has an oracle; "do these two documents say the same thing" does not. Three specific failure modes:

1. **Post-hoc threshold.** Read first, decide what counts as "a lot" afterwards, and the answer is whatever the reader already believed. Hence AC1.
2. **Unfalsifiable verdicts.** "This feels redundant" cannot be checked by anyone. Hence AC3's named-subsumer requirement.
3. **The A10 trap, already suffered in this project.** The Gyre Covenant audit's reproducibility pass returned **33% pairwise agreement against a 100% gate** — two blind reviewers split on the load-bearing cell, and the result shipped "provisional" anyway. A single reader's judgement on a soft question is exactly that shape.

---

## Acceptance Criteria

**AC1 — The threshold is pre-registered, in this file, before any document is opened.**

> **PRE-REGISTERED 2026-08-27, before reading:** if **≥ 20%** of sampled documents receive a `subsumed` verdict, redundancy is real, abort condition 1 does **not** fire, and step 8b is warranted. If **< 20%**, **abort condition 1 FIRES** — P60 stops at staleness, 8b is dropped, and that is a **successful** outcome, not a failed one.

The sample is drawn from the stratum where redundancy should be *most* concentrated (AC2). A low result there is therefore strong evidence for the corpus as a whole, not weak evidence.

**Changing this number after reading invalidates the result.** If the threshold turns out to be wrong, say so, keep the original verdict, and file a second row — do not retro-fit it.

**AC2 — The sample is mechanically selected, not hand-picked.**

Two strata, ~30 documents total:

- **Stratum A — multi-occupancy cells (~24 docs).** Group `_bmad-output/planning-artifacts/` by `{initiative} × {artifact_type}` from `taxonomy.yaml`. **12 cells hold >1 file, covering 75 files** (`convoke×report` 20, `convoke×epic` 15, `convoke×note` 13, `convoke×arch` 5, `convoke×prd` 4, `convoke×spec` 4, `convoke×brief` 3, `convoke×vision` 3, …). Sample proportionally, every cell with ≥3 files represented.
- **Stratum B — the `docs/` strategy cluster (3 docs, all of them).** `KORE-Method-v0.1-Draft.md`, `Convoke-Ecosystem-v0.2-Updated-With-Gyre.md`, `lifecycle-expansion-vision.md`. Three overlapping ontologies of the same expansion, all last edited 2026-08-15, none stale. The clearest redundancy candidate in the corpus and a known open question.

The selection script and its output list go in the report, so the sample can be criticised independently of the verdicts.

**AC3 — Every verdict is checkable without a second reader.**

Each sampled document gets exactly one of:

| Verdict | Meaning | Evidence required |
|---|---|---|
| `unique` | Deleting it would make some claim unavailable | Name one claim found nowhere else |
| `subsumed` | Every material claim exists elsewhere | **Name the subsuming document(s) AND the section/line carrying each claim** |
| `overlapping` | Substantial duplication, but retains ≥1 unique claim | Name both the duplicated span and the unique claim |

**A `subsumed` verdict without a named, locatable subsumer is not a verdict** and must be recorded as `overlapping` instead. This is what makes the result auditable in place of a second reviewer.

**AC4 — A reproducibility spot-check, sized to the A10 lesson.**

Re-judge **5 of the sampled documents** blind — without consulting the first pass — and report **pairwise agreement as a number**. This does not gate the result; it *qualifies* it. If agreement is below 60%, the headline verdict must be reported as **provisional and say so in its first sentence**.

> A provisional result needs its own open row, not a note inside a closed one. A39 shipped "provisional — gate not cleared", closed, and four months later that uncleared gate was the sole blocker on the project's top initiative. If this comes back provisional, **file the row before closing this one.**

**AC5 — The report is a governed artifact and states the verdict as a sentence.**

`convoke-report-corpus-redundancy-sample-<date>.md` in `planning-artifacts/`, frontmatter carrying `initiative`, `artifact_type: report`, `created`, `schema_version: 1`, and a `status` legal under [`artifact-utils.js:763`](../../scripts/lib/artifact-utils.js#L763) (`draft`/`validated`/`superseded`/`active`) — do not invent a value.

It must contain the pre-registered threshold quoted from AC1, the selection script and sample list, a verdict table, the AC4 agreement figure, and **one sentence naming whether abort condition 1 fired.** A reader must not have to infer it from a table.

**AC6 — Nothing is mutated.**

No document is edited, renamed, moved, or archived. This step produces a decision, not a change. `git status` shows only the new report and this story.

---

## Tasks

1. Write and run the stratum-A selector; commit its output list into the report before reading anything.
2. Read stratum B first (3 docs) — they are the pre-identified candidate and the cheapest signal.
3. Read stratum A, recording one verdict per document with AC3 evidence.
4. Blind re-judge 5; compute and report pairwise agreement.
5. Write the governed report, quoting the AC1 threshold verbatim and stating the abort verdict in one sentence.
6. If the verdict is provisional, file the follow-up row **before** moving this story to review.

---

## Sequencing note

**This outranks T84 (3.6) in sequence despite scoring lower (2.4).** Position states worth, never startability — the distinction filed as **T80**. T84 is a prerequisite for step 8; T90 decides whether step 8 happens at all. Run T90 first.

## Time-box and stopping rule

Two triggers to stop and report rather than push through:

- **The sample cannot be drawn mechanically** — if the taxonomy grouping does not produce a defensible stratum, that is a finding about the taxonomy, and it belongs to OQ-2 rather than here.
- **Reading exceeds the box.** Report the documents actually read with their verdicts and state the shortfall; a partial sample that names its own gap beats a full one rushed to reach the threshold.

## Change log

| Date | Change | By |
|------|--------|-----|
| 2026-08-27 | Initial draft. Threshold pre-registered at 20% before any reading. | Winston (architect role) |
