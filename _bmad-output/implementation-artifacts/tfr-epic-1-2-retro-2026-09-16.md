# Retrospective — Team Factory Repair (`tfr-epic-1` + `tfr-epic-2`)

**Date:** 2026-09-16 · **Scope:** both epics reviewed as one arc, at the operator's direction — `tfr-1-1`
(generate one real team without hand-patching) and `tfr-2-1` (delete the regression check that cannot fail).
Both complete 2026-09-15. **Participants:** Amalik (Project Lead), Amelia (Developer, facilitating), John
(Product Manager), Winston (Architect), Murat (Test Architect), Paige (Technical Writer).

## What the arc delivered

- **`add-team` runs end to end.** Every `run:` block pastes verbatim; walked in the documented order on a
  throwaway team, terminal gate `valid: true`, tree restored to its snapshot.
- **Rows closed:** `T136`, `T128`, `T164`, `T163`(a) (`tfr-epic-1`); `T171` with `T172`/`T173` absorbed
  (`tfr-epic-2`). `T174` rescoped, not closed.
- **Rows filed:** `T167`–`T176`, then `T177`, `T178`. Open `loom`: 15 → 22 → 21.
- **Surviving teams: zero**, by design — `tfr-epic-1`'s DoD was amended so a kept team is Forge's job.
- **Not released:** the arc is on `main`; no tag contains it.
- **Rule change:** `code-review-convergence` now requires a consumer audit at story close (`d954e90a`).

## What went well

1. **Independence beat self-review, measurably.** `tfr-1-1` R1 (self): 1 HIGH. R2 (three independent
   layers): 9. The consumer-audit layers, run after the story reached `review`, found two HIGHs every
   diff-scoped round had missed — a diff cannot show a caller nobody edited.
2. **Deletion ended loops that patching extended.** R3 deleted the audit gate rather than patching it a
   third time; `tfr-2-1` deleted `VORTEX-REGRESSION` rather than widening it and became the first repair in
   this module to lower the open row count.
3. **Execution caught what reading missed — including the record's own claims.** Task 8's first walk was
   recorded as "as a contributor would" and was not; the correction was a driver that extracts each `run:`
   block from the step files and runs them in the documented order, with a negative control.
4. **Harnesses were made to prove they ran.** A mutation run where every mutant "survived" turned out to be
   a bare directory passed to `node --test`, which runs nothing. Harnesses now refuse to report below a
   suite floor and open with a known-lethal control.
5. **Forks were decided and recorded, not absorbed.** VT narrowed; DoDs amended with the original wording
   kept beside the ruling; `T174` reopened rather than quietly absorbed; the archive stayed append-only.

## What did not

1. **The validator-that-cannot-fail class recurred at least four times** — `PERSONA-COVERAGE` counting a
   schema-guaranteed field, `VORTEX-REGRESSION`, extension happy paths that never asserted `valid`, and an
   existing-agents check that passes when every agent is removed. `tf-epic-3`'s retro raised exactly this
   ("validator-as-watchman") and made it action item 2 in March. Writing it down did not prevent it;
   mandatory mutant tables did.
2. **Premises were stated wider than they were proven.** "Nothing `add-team` writes is read by that
   validation" was true for the interactive `add-team` path only — not for the extension validators
   (R1), and not where the collision gate is skipped (R2). Each round narrowed it; none of them found it
   first time.
3. **Remediations carried their own defects.** Round 1's fixes on Tasks 4–7 introduced a fail-open filter
   and a branch order that could have led an operator to discard uncommitted work. This is the project's
   documented pattern, and it held again.
4. **Diff-scoped review is structurally blind to consumers.** `T174`, VT and the step-02 ordering defect all
   lived outside every changed hunk. Now addressed by the `code-review-convergence` amendment.
5. **The operator did not gain mastery, and said so.** Understanding accumulated in records, rows, archive
   notes, memory and rules — not in the operator's head. The operator's role was mostly arbitration between
   options an agent had already framed. The turning points came from instinct ("Code review?", "Additional
   review?", "No more review?"), not from command of the detail.

## The decision this retrospective produced

Asked what mastery would look like, the operator answered: **deciding what the Team Factory should be,
rather than which fix to apply next.** The facts made that decidable:

- The factory **ships** (`package.json` `files[]`, both manifests), yet **generation writes into
  `scripts/update/lib/agent-registry.js`** — Convoke's own source — so `docs/development.md` already records
  that it "only completes inside a clone of the Convoke repository, and nothing installs a generated team yet".
- **No installer exists for a generated team.** `scripts/` installs Vortex and Gyre agents only.
- **It has produced zero teams.** All six `_bmad/bme/` modules predate it.
- `capability-form-factor-evaluation` exists for exactly this question; the factory predates the rule and was
  never held to it.

**Operator ruling, 2026-09-16: the Team Factory is INTERNAL SCAFFOLDING for now** — Convoke's own tool for
building Convoke's teams, not a user-facing capability. Stated reason: *users are waiting for the planned new
teams*, not for the factory. The ruling is reversible ("for now") and does not by itself unship anything.

**Consequence for the backlog:** the parked-rows gate changes from *"revisit when a generated team survives"*
to **"revisit when a planned team build actually needs it"** — pull-based, not backlog-driven.

## Action items

| # | Action | Owner | Done when |
|---|---|---|---|
| 1 | Record the internal-scaffolding ruling in the backlog Change Log and `project_team_factory` memory | dev agent | Committed with this retro |
| 2 | Freeze `loom` work; restate the parked-rows gate as "when a planned team build needs it" | dev agent | Recorded in the backlog |
| 3 | File the unshipping as ONE row — `files[]`, `skill-manifest.csv`, `agent-manifest.csv`, the registry's `EXTRA_BME_AGENTS` coupling (removing the manifest row alone fails `Agent manifest missing`), and the docs sentence | dev agent | `T179` filed, not worked |
| 4 | Correct `docs/development.md` to describe the factory as internal for now | dev agent | Committed |
| 5 | Put framing questions to the operator as their own short decision, separate from findings; surface "should this exist" alongside "which fix" | Amelia | Next decision put to the operator |
| 6 | Carry-forward, still unmet: negative-case tests for validators (`tf-epic-3` action 2) — now enforced by mandatory mutant tables and the consumer-audit clause rather than by intention | dev agent | Next validator authored gets its red test first |

## Carried from `tf-epic-3`'s retrospective (2026-03-25)

| Item | Status |
|---|---|
| Adversarial code review for all stories | ✅ Both stories, multiple independent rounds |
| Continue Previous Story Intelligence | ✅ "Traps carried forward" sections in both stories |
| Negative-case tests for validation modules | ⏳ Recurred four times this arc; now enforced mechanically |

Also worth recording: `tf-epic-3`'s retro described the initiative as "fully working extension workflows".
`add-agent` does not exist (`T139`), and `tf-2-11`'s first end-to-end run found the factory broken. A
retrospective's own success claims are not evidence; use is.

## Readiness

- **Quality:** full suite green; lint, docs audit and backlog integrity clean.
- **Deployment:** unreleased, on `main`. No action — these changes ride the next release.
- **Stakeholder acceptance:** the operator's ruling above is the acceptance, and it reframes the work.
- **Blockers carried forward:** none technical. `T177` (Express Mode skips the only mechanical collision
  gate) is the row to read first whenever the factory is next touched.
- **Next work:** not the Team Factory. The planned new teams, Forge first.
