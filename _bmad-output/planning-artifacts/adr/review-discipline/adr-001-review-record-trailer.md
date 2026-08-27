---
initiative: convoke
artifact_type: adr
qualifier: review-discipline-review-record-trailer
created: '2026-08-27'
status: proposed
schema_version: 1
related_decision: 'T77 (backlog); code-review-convergence and commit-preparation in project-context.md'
supersedes: 'Nothing yet. If accepted, amends commit-preparation field 3 and retires T77 attempt 1 (prose parsing).'
---

# ADR-001: How a commit records which review rounds ran

**Status:** **Proposed** — awaiting operator decision on §Decision
**Related:** backlog row **T77**; `project-context.md` rules `code-review-convergence` (:159) and `commit-preparation` (:512)

> **This ADR exists because T77 could not be implemented as filed, and its replacement
> could not be implemented either.** Both failures were about *shape*, not effort, and both
> are measured below. The decision this document asks for is a convention, not a design —
> once it is made, T77 becomes ordinary Fast Lane work.

---

## Context

`code-review-convergence` states that Round 2 is triggered by **any** HIGH-severity finding in
Round 1. `commit-preparation` field 3 requires the commit Description to carry "the review status
of the change". Neither is enforced by anything.

**Three times the rule was violated, each time by an agent that had read it.**

| When | Commit | What the message said | Found by |
|---|---|---|---|
| prior session | — | Round 1's remediation contained new code; Round 2 argued unnecessary | operator asked |
| 2026-08-26 | `7b957dbf` | *"Round 1: 1 HIGH … Round 2 not triggered: the HIGH is fixed"* | operator asked |
| 2026-08-26 | `5439c8b4` | *"Round 1: 4 HIGH, all applied … Rounds: 1 complete"* | operator asked |

The first is recorded in `feedback_verification_basis` with the note *"Round 2 exists for
remediation, and skipping it nearly shipped a release blocker."* Writing it down did not prevent
the next two. When Rounds 2 and 3 were finally run on the 2026-08-26 pair, they found **four more
HIGH**, the worst being a fix that deleted 41 of 53 manifest rows while reporting *"other modules
preserved"*.

`project-context.md` had asserted that CI caught this bypass. Verified 2026-08-26: **no such gate
existed.** That sentence is now corrected to say so, and T77 tracks building one.

### Every prose-based approach was built and measured. All are theatre.

| Candidate | Result |
|---|---|
| "a done story has a Dev Agent Record" | passes **134/134** done-stories — including the one that skipped a round |
| "a commit mentions a Round" | passes **both** real skips, because both did mention rounds |
| "a `scripts/**/*.js` commit touches a test" | fails **52%** of the 46 such commits in the last 300; it is test discipline, not review discipline |
| T77 attempt 1 — assert the message is *self-consistent* with the rule | caught both real skips, 2 hits in 300 commits, zero false positives — **and was still reverted** |

Attempt 1 failed for a reason that generalises: **it discriminated on punctuation, not meaning.**
Deleting one character from `5439c8b4` — the colon in `Rounds: 1 complete` — makes the unmodified
offending commit pass. So does `no HIGH outstanding` (the phrase that offender actually used),
`one HIGH` for `1 HIGH`, and `Round 2 not needed` for `not triggered`. A reviewer enumerated **19
of 19 realistic evasions**. It also could not distinguish an author skipping a round from a commit
*describing* one, so every post-mortem self-blocked — in a job inside `publish.needs`.

The repository has been here before. `BUG-10`'s guard was withdrawn for hand-rolling a lexer in
regex, and the backlog parser is on record as *"fenced in, not correct"* after three rounds. **A
fifth regex is the wrong instrument.**

---

## Decision

**Open. Three candidates; the operator picks one.**

The question is narrow: *does a commit carry a machine-readable record of which review rounds ran,
and in what grammar?*

### Option A — a structured git trailer with counts

```
feat(T99): do the thing

Body prose, unchanged.

Review-Rounds: 1:3H 2:0H
```

Grammar: `Review-Rounds: <round>:<highs>H [<round>:<highs>H …]`, or the literal `none` with a
reason (`Review-Rounds: none (docs only)`).

- **Verified:** `git interpret-trailers --parse` reads this shape natively, so the gate parses
  a key/value pair rather than prose. No regex over English.
- Cannot be defeated by wording, because wording is not what is read.
- A commit *quoting* a trailer inside its body does not self-block — trailers are only the final
  paragraph.
- Costs the operator nothing: commit plans are pasted, so the trailer is emitted by the agent.

### Option B — one trailer per round

```
Review-Round-1: 3 HIGH, applied
Review-Round-2: 0 HIGH
```

- More readable in `git log`; more lines to get right.
- Same parsing properties as A.

### Option C — no trailer; the operator remains the control

- Status quo. `commit-preparation` field 3 keeps requiring review status in prose, unenforced.
- **This deserves to be a live option, not a straw man.** Every one of the three skips was caught
  by the operator asking, and nothing else has ever caught one. On today's evidence, the operator
  is the only control with a non-zero hit rate.
- Cost: it does not scale past the operator's attention, and the failure is silent when it lapses.

---

## What this decision explicitly does NOT claim

- **No trailer proves a review happened.** A commit is a claim; a gate reads claims. Option A
  makes the claim *structured*, so the convergence rule can be checked against it — that is all.
  An author who writes `Review-Rounds: 1:0H` after a round that found three HIGH defeats any
  version of this, and no mechanism proposed here detects it.
- **It does not replace the chokepoint.** The commit-plan handoff remains the primary control.
- **It is forward-only.** No historical commit carries a trailer, so any gate must scope to the
  pushed or PR range, and must treat an absent trailer on an old commit as out of scope.

---

## Consequences

**If A or B is accepted:**

- `commit-preparation` field 3 is amended: the Description keeps its prose, and the review status
  moves to a trailer. Every commit plan I hand over includes it.
- T77 becomes mechanical Fast Lane work: parse the trailer with `git interpret-trailers`, assert
  `code-review-convergence` against the parsed counts, wire to the `agent-surface-parity` job.
  No prose parsing, no self-blocking, no wording puzzle.
- A short adoption window where most commits have no trailer — the gate must warn, not fail, on
  absence until the convention is established, or it is red on arrival and therefore ignored.
  (That is the mistake T77 attempt 1's story arm deliberately avoided, and the reason its
  `baseline_commit` scoping worked.)

**If C is accepted:**

- T77 is closed as *rejected-by-decision* rather than left open, with this ADR as the receipt.
- `project-context.md`'s enforcement bullet stands as corrected: chokepoint only, no backstop,
  operator is the last line. That is at least honest, which the pre-2026-08-26 version was not.

---

## Alternatives considered

**A `commit-msg` git hook.** Catches the problem before the commit exists, which is strictly
better than catching it in CI. Rejected as the primary mechanism because the operator commits
through GitHub Desktop and hooks must be installed per clone — it cannot be relied on, though it
would compose well with A as a local convenience.

**A single verdict trailer** (`Review: converged-at-2`). Simpler, but it carries no finding
counts, so the convergence rule — which keys on *how many HIGH* Round 1 found — cannot be checked
against it. Rejected: it would be a trailer that asserts nothing, which is the defect this whole
row exists to correct.

**Enforcing test-touch on `scripts/**/*.js`.** Named in the original `project-context.md`
sentence. Measured at 52% historical failure and orthogonal to review discipline. Worth doing on
its own merits as a separate row; it does not belong here.

---

## Evidence appendix

All figures re-derived 2026-08-27 against the working tree, not recalled.

| Claim | Command |
|---|---|
| 134/134 done-stories carry a Dev Agent Record | walk `sprint-status.yaml` `development_status`, filter `done`, exclude epics/retros, test each story file |
| 52% of 46 commits | `git log --format=%H -300`, keep those touching `^scripts/.*\.js$`, count those touching no `^tests/` |
| 2 hits in 300 for attempt 1 | `node scripts/audit/review-record-check.js --last 300` (script reverted; figure recorded from the run) |
| one-character bypass | `checkMessage(realMessage.replace('Rounds: 1 complete','Rounds 1 complete'))` → `{ok:true}` |
| `git interpret-trailers` parses the shape | `printf '…\n\nReview-Rounds: 1:3H 2:0H\n' \| git interpret-trailers --parse` → `Review-Rounds: 1:3H 2:0H` |

> **A note on this appendix's own history.** T77 attempt 1 shipped a `project-context.md` rewrite
> whose five measurements included four that did not reproduce — `documentation-claims-must-be-derived`
> violated inside the bullet citing it. Every number above was re-derived before being written here,
> and the commands are given so the next reader can check rather than trust.

---

## Operator decision

**Pending.** Record the choice below, then set `status: accepted` in the frontmatter and
amend `commit-preparation` if A or B.

- [ ] **A** — `Review-Rounds: 1:3H 2:0H`
- [ ] **B** — one trailer per round
- [ ] **C** — no trailer; close T77 as rejected-by-decision
