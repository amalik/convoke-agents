# Retrospective — Team Factory Unship (`tfu-epic-1`)

**Date:** 2026-10-01 · **Scope:** one story, `tfu-1-1` (stop shipping the Team Factory), nine tasks, epic
closed 2026-09-30. **Participants:** Amalik (Project Lead), Amelia (Developer, facilitating), John (Product
Manager), Winston (Architect), Murat (Test Architect), Paige (Technical Writer).

## What the epic delivered

- **The Team Factory no longer ships.** Out of `package.json` `files[]`, out of `skill-manifest.csv` and
  `agent-manifest.csv`, and the `EXTRA_BME_AGENTS` roster deleted with every consumer. Source stays tracked
  in git — `agent-surface-parity` exits 2 on a removed agent and carries no waiver.
- **Rows closed:** `T179` and `T150`, both moved to §2.5 with closing notes in the completed-work archive.
- **Rows filed rather than fixed:** `T222` (the orphan), `T227` (the guard covers a module that no longer
  ships), `T228` (`T152`'s class on a shrinking roster), `T229` (the Covenant's stale anomaly example),
  **`T230`** (the lever — no `path:NNN` citation in this repository is checkable).
- **Nothing is published.** `npm view convoke-agents dist-tags` reads `latest: 4.0.3`, which still ships it.

## What went well, and why precisely

**The derivation discipline held wherever it ran before the writing.** Every prediction this epic made came
true exactly: the three `docs:audit` findings, the remedy string `one of 4, 7, 11 agents`,
`skill-manifest.csv` row 106 being literally line 106, `install-scope-check` moving 14 → 13 for the predicted
reason. None was recalled; each was derived first.

**The tarball gate caught nothing, which is the good outcome.** AC#3 relocated `csv-utils` to `scripts/lib/`
*before* dropping `files[]`, because `try-fresh-install.sh` would otherwise have caught a bin that parses
cleanly and throws `MODULE_NOT_FOUND` on a user's first run. The trap was avoided rather than survived.

**Anchoring citations by symbol paid off within hours.** A concurrent session inserted 27 lines into
`refresh-installation.js` mid-authoring; every symbol anchor still resolved to exactly one match.

## What did not

| Failure | Cost | Encoded as |
|---|---|---|
| AC#15 named three failing tests; there were **47 assertions across 7 files**, plus 4 under `tests/integration` that `npm test` does not run | a spec a dev agent would have believed | — (scope estimation; no rule proposed) |
| AC#14 prescribed "commit then amend"; the operator commits and pushes together | `main` red behind a `publish.needs` gate | `commit-plans-assume-no-amend-window` |
| "All gates green" reported from a **dirty tree**, having run 6 of ~15 CI steps | the operator found the red, not me | `all-green-means-every-step-from-the-committed-state` |
| An audit agent was told the tree was clean while 14 files were edited under it | the audit flagged it; a less careful one would have reported against a moving target | `freeze-the-tree-before-an-audit` |
| A check written that **cannot fail** — a count derived from the same source the artifact is generated from | the literal it replaced would have reddened | **refused** — see below |
| One copy of a duplicated sentence fixed, the other shipped | three shipped prose files never opened | `search-the-shipped-set-not-the-tree` |
| The predecessor retro's own action item wrote a forward-dated claim naming the row that would falsify it | false for two weeks, surviving an edit four lines above it | `closing-a-row-greps-for-its-own-citations` |

## The decision this retrospective produced

**Murat's objection, which was sustained.** The worst defect in the epic — a derived count absorbed by its
own generator — is covered by a rule that **already exists** in `project-context.md`, and was cited in the
comment sitting directly above the violation. A sharper prose rule was proposed and **refused** on that
evidence: a seventh paragraph does not bind where the sixth was quoted while being broken. The answer is
`T230`, a gate.

Five rules were encoded, chosen because each is mechanically checkable or procedurally concrete rather than
exhortative. All five carry a command, and **every command was run in the form written** — one of them was a
syntax error on first draft and was caught exactly that way, inside the rule about running commands as
written.

## Follow-through on the predecessor (`tfr-epic-1` + `tfr-epic-2`, 2026-09-16)

| Its action | Status |
|---|---|
| 1 — record the internal-scaffolding ruling | ✅ |
| 2 — freeze `loom`, restate the parked-rows gate | ✅ |
| 3 — file the unshipping as ONE row | ✅ became `T179`, closed by this epic |
| 4 — correct `docs/development.md` to describe the factory as internal | ❌ **incomplete in a new way.** It wrote *"It still installs… withdrawing that is filed as `T179`"* — true then, false the moment action 3's row closed. `git log --oneline -S "withdrawing that is filed as \`T179\`" -- docs/development.md` returns the commit that wrote it (`0e1f2ed2`, the retro itself) and the one that removed it (`d3d581e5`, two weeks later, via a blind auditor) |
| 5 — put framing questions to the operator as their own decision | ✅ AC#0 was left blank and ruled separately |
| 6 — carry-forward: negative-case tests for validators | ⏳ still recurring; `T230` is the mechanical answer |

Action 4 is the instructive one, and it is why `closing-a-row-greps-for-its-own-citations` exists. It was not
carelessness — it was a correctly-written forward-dated claim with no link back from the row that expires it.

## Readiness

No `tfu-epic-2` exists and none is planned; the follow-on work is rows, not an epic. Before any release:
**`T227`** should close — an operator carrying an orphaned, damaged `_team-factory/config.yaml` has every
install and update refused, unactionably. **`T222`** retires the orphan itself. **`T230`** is the highest-value
row this epic produced and is the only one that changes behaviour rather than describing it.

**One caveat on this document.** Twelve gates were green before this epic's consumer audit and after it. The
audit found a vacuous assertion, three rotted citations and a denominator wrong in six places. A green sweep
bounds regression, not correctness — which is itself now a clause in
`all-green-means-every-step-from-the-committed-state`.
