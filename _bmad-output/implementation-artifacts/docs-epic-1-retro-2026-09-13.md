# Retrospective — Convoke 4.0.2: Documentation Accuracy (`docs-epic-1`)

**Date:** 2026-09-13 · **Facilitator:** Amelia (Developer) · **Project Lead:** Amalik
**Participants:** Amelia (Developer), Paige (Technical Writer), Murat (Test Architect),
Winston (Architect), Mary (Business Analyst)

---

## 1. Delivery

| | |
|---|---|
| Stories | **7 / 7 done** |
| Findings recorded | **48** distinct (`D1`–`D62`, retractions struck not deleted) |
| Files brought into coverage | **15**, all `Examined: yes` |
| Commits touching `docs-1-*` | **37** |
| New tooling | `derived-assertions.js`, `coverage-denominator.js` + tests — ~1,450 lines |
| Gate | `✓ 15 in-scope files`, wired into `publish.needs` |

Every figure above is re-derivable; none is transcribed from an earlier artifact. Re-run:
`node scripts/audit/coverage-denominator.js` · `git log --oneline | grep -cE "docs-1-[0-9]"`

## 2. What the epic was for

**Ruled by the Project Lead: the transferable output is the METHOD**, not the corrected files and not
the gate. The files decay; the gate is an instance of the method; the derivation discipline is what
moves to the next epic.

That ruling matters because the method is also the thing this epic *measured* — see §4.

## 3. What went well

- **`FR3a` held for seven stories and overturned its own epic.** Keep a claim if an object can
  contradict it; delete it if nothing can. `docs-1-3` applied it and found the epic's premise wrong —
  it assumed nobody owned the `(v1.1.0)` marker; someone did.
- **Independent review at roughly 10:1 over self-review.** Self-review found ~2 findings per artifact;
  independent layers found 27, 22 and 19. A different instrument, not a better effort.
- **The instrument was changed twice instead of patched a third time.** `docs-1-3` deleted its
  exhaustive instance lists; `docs-1-6` deleted its round history, tallies and post-pass figures.
- **Live defects removed.** A Code of Conduct with **no enforcement contact at all** since February. A
  compatibility matrix asserting BMAD `1.x`, a line that existed for one day in June 2025 — before
  Convoke's first release. A documented command that throws. A `npm run check` that can never pass.
- **Reviewed set equalled committed set, every round** — `dist-epic-2`'s action item 6, held.

## 4. What did not — the epic's central finding

**Every remediation in this epic introduced defects.**

| Story | What the fixes did |
|---|---|
| `docs-1-1` | Its own corrections created two intra-file contradictions |
| `docs-1-2` | The generator built to fix the diagram **regenerated the original defect** into two shipped files, gate green |
| `docs-1-3` | Round 2 found **9 of 10** of Round 1's corrections defective |
| `docs-1-5` | All three Round 2 HIGHs were created by Round 1's fixes |
| `docs-1-6` | All three Round 3 HIGHs were created by Round 2's fixes |
| `docs-1-7` | A route reported "closed" was only **narrowed**; the replacement test was tautological in a new way |

Plus **five incomplete fixes** — a value appearing twice, corrected once (`~20` left in a Change Log;
`cell()` fixed for `_`, left broken for `*` and backticks).

**Diagnosis.** Applying a fix *feels* like closing work rather than opening it, so the verification step
is the one that gets skipped. This is a systems property of remediation, not a lapse of attention.

**Secondary.** Half of `docs-1-6`'s final-round findings were about the **record** rather than the
documents — tallies that moved when a finding was retracted, basis figures already stale at the commit
shipping them. Effort spent generating findings about our own prose.

## 5. On `dist-epic-2`'s "blocks all new epic work"

**Ruled: correctly superseded.** This epic *was* 4.0.2 work — titled for that release, sprint block
citing the `dist` precedent, every story targeting files that ship in it. It was the same release, not
new epic work, so the block did not bind. **Recorded here so the next retro does not re-litigate it.**

⚠ **The caveat stands and is sharper than before:** 4.0.2 is unpublished (`npm latest` = 4.0.1,
`package.json` = 4.0.2) and now carries more than when that commitment was written. Publishing matters
more than it did, not less.

## 6. Action taken during this retrospective (applied, not aspirational)

**`project-context.md` gained `a-remediation-is-an-unreviewed-change`** — a fix is new work; re-derive
rather than reason, and fix the class rather than the instance. It carries the measured evidence and a
falsification condition, and the companion stopping rule (`docs-1-6` stopped correctly after three
rounds; `docs-1-7` correctly continued because its remediation rewrote parsing logic, not prose).

Placed there rather than left in this document per `feedback_process_uniformity`: retro constraints must
live where dev agents read them.

## 7. Open action items

| # | Action | Owner | Status |
|---|---|---|---|
| 1 | **Publish 4.0.2.** Carried from `dist-epic-2` unchanged. Larger now than when first written | Amalik | open |
| 2 | Five deferred gate items — `.MD`/`.markdown` escaping the denominator, the gate shipping in `files[]`, unbalanced fences, HTML-comment tables, the seven user guides excluded by accident | dev agent | open |
| 3 | `npm run check` can never pass (`npx jest` with jest undeclared, over `node:test` files) — filed in `deferred-work.md` | dev agent | open |
| 4 | `npm run refs:audit` exits non-zero on a clean tree for ~657 pre-existing reasons — needs a baseline or a scoping change | dev agent | open |
| 5 | `T161` / `T162` — the epic's two deliberate non-fixes, filed at sorted positions | dev agent | open |
| 6 | `T45`, `T47` carried from `dist-epic-2`, still open | dev agent | open |

## 8. Readiness

| | |
|---|---|
| Stories | 7/7 done |
| Gates | lint · test · backlog-integrity · docs:audit · coverage-denominator — all 0 |
| Enforcement | Gate in `publish.needs`; a dropped documentation story now blocks the tag |
| Deployment | **Not released.** 4.0.2 unpublished — the epic's output ships when it does |
| Known gaps | 5 deferred gate items, 2 broken repo scripts, all filed with reproductions |

**Not a blocker for further work; a blocker for claiming 4.0.2 is done.**

## 9. Key takeaways

1. **A remediation is an unreviewed change.** Measured, not theorised: every remediation here introduced
   defects. Now a rule in `project-context.md`.
2. **"Closed" often means "narrowed".** Fix the input class, not the shape the reviewer sent.
3. **Self-review finds arithmetic; independent review finds judgement.** ~2 vs ~20 per artifact, and the
   split was clean — mechanical errors mine, design holes theirs.
4. **Stop when findings about the record approach findings about the artifact** — and delete the
   narration rather than rewriting it.
5. **A gate not in `publish.needs` is documentation.** Got wrong twice in one story.
6. **Coverage is checkable; truth is not.** The gate asserts a pass was *recorded* and says so out loud.
