---
initiative: convoke
artifact_type: epic
qualifier: release-truth-4-0-3
created: '2026-09-17'
status: done
schema_version: 1
related_initiative: '4.0.3 fresh-install config'
qualifier_role: operator-authored
---

# Epic: make 4.0.3's refusal claims true (`fic-epic-2`)

**Created 2026-09-17**, a one-story mini-epic following the `tfr-epic-2` precedent. `fic-epic-1` closed on
2026-09-16 and is not reopened; this project records forward.

## Why it exists

`fic-1-1` fixed a real defect — a fresh install left 8 of 12 agents unable to start (the row said 7 of 11; corrected 2026-09-17) (`BUG-22`) — and its
story-close consumer audit was run. A **second, independent** consumer audit then found that the production
fix is sound but **what the story published about it is false on the path most existing users take**:

- `INSTALLATION.md` and `UPDATE-GUIDE.md` say an update "stops rather than replace a `config.yaml` it cannot
  read". For a damaged **Vortex** config under `convoke-update`, it does not. `version-detector.js::getCurrentVersion`
  catches the parse error and `guessVersionFromFileStructure` returns `1.1.0` whenever `workflows/_deprecated/`
  exists — which every real install has — so the operator is offered a 1.1.0 → 4.0.2 **breaking-change
  migration plan** instead of the documented refusal.
- Nine shipped agent activation blocks advise "Please reinstall or contact support"; reinstalling is what now
  refuses.
- Seven Vortex user guides tell the operator to reinstall if the config is *missing*, with no branch for the
  present-but-unreadable case this fix creates.
- A published 4.0.3 would carry **no changelog entry**, and no checklist step or CI job would catch that.

The release is held by operator ruling (2026-09-16). This epic is what the hold is for.

## Scope

One story, `fic-2-1`: make every published sentence true of the path it names, repair the advice in the
shipped surfaces, and give the release its changelog entry and a step that catches a missing one.

**Explicitly NOT in scope:** changing `version-detector.js`. The fallback that produces `1.1.0` is filed as
`T180`. Correcting behaviour there is a bigger change on the update path and is not what a held release needs;
this epic makes the words match the code, not the other way round.

**Definition of done:** every refusal claim names the path it holds for and is backed by an executed command;
no shipped surface advises an action that refuses; `CHANGELOG.md` has a 4.0.3 entry and the pre-tag checklist
would fail without one; `T180` filed.

## Closed 2026-09-17

**Definition of done, clause by clause.**

- *Every refusal claim names the path it holds for and is backed by an executed command.* Held, after three
  review rounds. The claims now distinguish `convoke-install` and `convoke-install-vortex` (five steps,
  refusal at `[4/5]`, archive and legacy delete already done at `[2/5]`) from `convoke-install-gyre` (four
  steps, refusal at `[3/4]`, neither), and `convoke-update` by which config is damaged and whether a refresh
  is due. A file planted under `_bmad/bme/_designos` was destroyed by a run that then refused; the documents
  say so.
- *No shipped surface advises an action that refuses.* Held: nine activation blocks name their own installer,
  and seven user guides carry config advice that is true for the agent whose guide it is. The Team Factory
  block says the opposite of the other eight, because its config is unguarded and reinstalling really would
  lose the operator's settings.
- *`CHANGELOG.md` has a 4.0.3 entry and the pre-tag checklist would fail without one.* Held, and stronger
  than written: the check is `scripts/audit/check-changelog-entry.js`, 28 tests, all 23 of its guards
  mutation-proven. It fails on a missing entry, an undated or placeholder heading, an impossible date, an
  entry that exists only inside a code fence or an HTML comment, duplicates, a malformed neighbour, and an
  empty body.
- *`T180` filed.* Held, with three more the work surfaced: `T181` (four module configs unchecked **and**
  rewritten from template on every install), `T182` (`changelog-reader.js` mis-parses fenced and
  bracket-less headings, so operators are shown examples as releases), `T183` (Emma, Mila and Wade route
  config loading through `bmad-init`, deleted upstream in June and shipped by nothing).

**What the rounds cost, and what they bought.** R1: 2 HIGH. R2: 7 HIGH across three independent layers.
R3: 5 HIGH on the gate R2 built. Every HIGH in R2 and R3 came from the previous round's own remediation —
the fourth consecutive arc in this project where that held. Two findings were refuted rather than fixed,
and one of my own claims was retracted rather than quietly corrected.

**Not in scope, unchanged:** `version-detector.js`. The `1.1.0` fallback — `1.0.0` on a Gyre-only install —
is still `T180`.
