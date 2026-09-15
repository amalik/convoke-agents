---
initiative: convoke
artifact_type: epic
qualifier: team-factory-repair
created: '2026-09-14'
status: complete
completedAt: '2026-09-15'
schema_version: 1
related_initiative: 'P14 Team Factory / Loom'
qualifier_role: operator-authored
---

# Epic: Team Factory Repair (`tfr`)

**Created 2026-09-14 by operator ruling.** Incident-driven mini-epic, following the `lint-epic-1` / `cov-epic-1` / `i97-bug-epic-1` / `ci-hygiene-epic-1` precedent.

## Why this exists rather than a fourth story in `tf-epic-2`

`tf-epic-2`'s scope is *"Guided Workflow — Factory Discovery & Generation."* Stories 2.1–2.10 built that workflow and it is done. `tf-2-11` **validated** it — the first end-to-end run, 140 days after the story was filed — and `tf-2-12` and `tf-2-13` are **repairs that validation found**. Repair is a different body of work from build, with its own arc: it began with a pilot, it has produced three stories, and fifteen rows still point at the same module.

Two alternatives were considered and declined:

- **Reopen `tf-epic-2-retrospective`.** Rejected: a retrospective is a point-in-time record, and this project's consistent norm is **record forward, never rewrite** — the same reason `tf-2-11`'s stale "Deferred 2026-04-22" note was left standing with a correction beside it rather than edited away.
- **Keep appending to `tf-epic-2`.** Rejected: that is the shape `T139` documents — an epic reading `done`, with a completed retrospective, while work continues under it.

## The scoping pass, and what it found

**The remediation is not converging.** `tf-2-12` fixed seven things and produced three residue rows; `tf-2-13` fixed seven and produced four. Closing three stories tonight took the open `loom` count from 13 to 15.

`project-context.md` `code-review-convergence` names this shape for a function:

> **When a fix keeps leaking in the same place, suspect OVER-BUILD, and prefer deletion to a further rewrite.**

It reads the same at module scale. **The Team Factory has produced zero surviving teams** — `_vortex`, `_gyre` and `_team-factory` all predate it, and `tf-2-11`'s pilot team was deleted by its own AC8. So this epic does **not** take all fifteen rows. It takes the ones that block a contributor generating one real team, and it states a gate for the rest.

**Footnote on "fifteen", added 2026-09-14.** The figure was right and the backlog was not: it held **sixteen** open `loom` rows, the extra being `BUG-3` (2.8, filed 2026-04-23, parked) — `convoke-doctor` reporting `_team-factory` missing its `add-team` workflow. Checked rather than assumed: the workflow directory holds 6 files, `config.yaml` declares `workflows: [add-team]`, and `node scripts/convoke-doctor.js` prints `✓ _team-factory workflows — 1 workflows present`. The row had been fixed by a commit with no reason to name a row filed before it — `staleness-preflight-for-backlog-pickup`'s qualification-arm blind spot, second instance after `T57`. **`BUG-3` is closed into §2.5 and the count is now fifteen for the right reason.** Derive it, never quote it: `grep -cE "\| loom \| Open \|" convoke-note-initiative-lifecycle-backlog.md`.

### Epic scope — blocks generating one real team (4)

| Row | | Why it blocks |
|---|---|---|
| `T136` | 6.0 | The `run:` blocks cannot be pasted verbatim with real data — JSON terminates the `node -e` shell string. A human or LLM driver cannot execute the documented flow at all. The remaining half of `T130`'s goal. |
| `T164` | 5.0 | Persona wiring and registry bookkeeping can both be skipped silently, so generation reports success and produces a hollow team — the failure `T131` was closed to remove. |
| `T163`(a) | 5.0 | The two containment guards disagree: a spec that passes `parseSpec` dies at §5a-ii with "fix before continuing". |
| `T128` | 5.0 | The terminal gate delegates to an *installation* validator against a *source* tree, so step-05 can never return true where teams are actually built. |

### Deliberately NOT in scope

**Not factory code (2).** `T139` (`tf-epic-3` closed `done` with a retrospective and no deliverable) is a records-and-status problem; `T147` (a ruled canonical agent layout no tool produces) is cross-cutting beyond this module.

**Already ruled, not a defect (1).** `T127` — the factory emits v5 because it delegates to BMB and BMB has no v6.3 path. Ruled 2026-09-11: accept, make the per-team conversion cost explicit, track upstream under `I113`.

**Guards a path nobody has walked (8) — `T132`, `T134`, `T163`(b), `T165`, `T137`, `T138`, `T166`, `T141`, `T151`.** Each is real and confirmed by execution. None of them stops a team being generated. They harden malformed input, an abort path, a CLI entry point, an add-agent workflow that **does not exist**, and validator edges reachable only by inputs the parser now rejects.

**The gate on those eight, stated so it is a decision and not neglect:** revisit when the factory has generated a team that survives — i.e. when someone has actually walked the path the machinery guards. Fixing them first is the over-build clause's warning in action: fifteen rows of repair on a module that has never built anything real.

## Stories

- **`tfr-1-1`** — make the factory able to generate one real team end to end without hand-patching. Covers `T136`, `T164`, `T163`(a), `T128`.

**Definition of done for this epic:** a contributor follows `add-team` start to finish, with no hand-corrected `run:` block, and the terminal gate returns true on the result.

**Amended 2026-09-14, and the reason is worth keeping.** This read *"the result is a team that is kept rather than deleted"*, which made one phrase do two jobs and was unsatisfiable for the epic's first three hours: keeping a generated team is *adding a team that does not exist*, which `project-context.md`'s `team-expansion-freeze` forbade until 4.0.2 shipped. `tfr-1-1`'s AC#8 had already routed around it by deleting its throwaway — so the story could ship under the freeze while being unable to close the epic above it. 4.0.2 published 2026-09-14 and the freeze has lifted, so the conflict is gone; the conflation is not, and that is what this amendment fixes.

The two questions the old sentence merged, now separated:

- **Is the repair done?** The factory runs clean end to end and its own terminal gate passes. That is what `tfr-1-1` delivers and what closes this epic.
- **When do the eight parked rows get triaged?** Unchanged, and still stated in §"The gate on those eight": when the factory has generated a team that **survives** — the first time their paths get walked.

**A surviving team is deliberately NOT this epic's exit criterion.** It is the ratified job of a different piece of work: [`project_baseline_before_expansion`](../../project-context.md) sequences the first real team as **Forge alone, as a measured one-team test**, and Forge carries its own gates (the meta-model baseline, `P60`'s open questions, and Victor's condition that Gyre's build cost be written down first). Keeping an arbitrary probe team to satisfy a DoD would front-run that decision, permanently modify `agent-registry.js` for a team with no consumer, and block this epic on gates that have nothing to do with repair.
