---
initiative: convoke
artifact_type: note
qualifier: channel-integrity-handoff
created: '2026-09-27'
status: active
schema_version: 1
qualifier_role: operator-authored
---

# Channel Integrity — handoff

**Start here.** The work spans a dozen artifacts and this is the index. It **points** rather than
restates: a figure copied into this file would rot, so every number lives with the command that derives
it, in the artifact that owns it.

**Head at handoff:** `5106e35b`, CI green, tree clean.

---

## 1. What this was

A `skills.sh` page listed one Convoke agent although nothing had been published there. The cause was not
a crawl: **`.claude-plugin/marketplace.json`, shipped in `files[]`, is an active publication surface** —
the `npx skills` CLI searches manifest-declared paths outside its own bounded walk, and the Claude Code
marketplace reads the same file. Convoke had been publishing 7 of its 11 agents, and none of its
workflows or contracts, to a channel it did not treat as one.

## 2. Read in this order

| # | Artifact | What it is |
|---|---|---|
| 1 | [`convoke-note-channel-integrity-findings-2026-09-26.md`](convoke-note-channel-integrity-findings-2026-09-26.md) | **The diagnosis.** Every figure carries its command. Start here. |
| 2 | [`adr/channel-integrity/adr-001-the-distribution-unit.md`](adr/channel-integrity/adr-001-the-distribution-unit.md) | **The decisions.** C1–C14 plus **Amendment 1**, which is the one that reframes everything. |
| 3 | [`convoke-epic-s4-channel-hub.md`](convoke-epic-s4-channel-hub.md) · [`convoke-epic-channel-integrity-remediation.md`](convoke-epic-channel-integrity-remediation.md) | The two epics. |
| 4 | [`convoke-note-pieces-of-knowledge-to-review.md`](convoke-note-pieces-of-knowledge-to-review.md) | Stale sentences found in passing. **No range stated here — it grew twice on 2026-09-27 alone.** Derive it with `grep -n '^### ~*K[0-9]' _bmad-output/planning-artifacts/convoke-note-pieces-of-knowledge-to-review.md`; struck headings are resolved and recorded in the Resolved table at the foot. |

**There is no live PRD.** `prds/prd-BMAD-Enhanced-2026-09-26/prd.md` was superseded the day it was
written and does **not** govern — but the five reviews beside it are the most useful artifacts of that
day. Anyone reading the PRD for authority is reading a struck document.

## 3. The ruling that reframes it — ADR-001 Amendment 1

**Both `skills.sh` and the Claude Code plugin marketplace are non-reference, disclaimed channels.
Reference distribution is GitHub + npm.** Purpose of channel presence is *visibility* — "reference all of
our agents/skills as a quick win without degrading our core reference product". Binding condition is
**non-degradation**, made testable as: *a channel listing never claims more than the ledger's status for
that capability.*

**S2 is no longer the destination**, and **S4 is not a step toward it.** S2 would sell the differentiator:
the handoff contracts have no software enforcement, so the coupling exists only as prose and the sole
mechanism holding it together is that the pieces arrive together.

## 4. Story state

| Story | Status |
|---|---|
| `cir-1-1` | **done.** Residue `IN-240` (8 holes, 2 rulings). |
| `cir-1-2` | **closed unimplemented** — a duplicate of `T183`. Its fix was also wrong; do not copy it. Kept for the review inside it. |
| `cir-1-3` | **authored 2026-09-28, `ready-for-dev`, and re-scoped first.** It is now Amendment 1 **A1.3's disclaimer** — a pre-install notice in the frontmatter `description` plus a post-install pointer to the maturity ledger — and it absorbs the original defect-1 runtime detection. Folds in **A1.5**. Scope is the 7 declared manifest paths. |
| `s4-1-1` | authored, **deferred 2026-09-28 by operator ruling — not cancelled.** Four rulings closed; **C10 and C11 stand** and nothing retires C11. Its *Why* is a distribution argument that A1.1's visibility-only ruling weakened, so it is reconsidered with evidence about what breaks for a real operator — which keeps the ratified ship-then-one-measured-test order rather than inverting it. |
| `s4-1-2` | not authored. Blocked on `validate-marketplace.js`'s `AGENT_IDS` identity check. |

## 5. Next action

~~**`T183`**~~ — **done 2026-09-27**, see the
[closing note](convoke-note-backlog-completed-archive.md#t183). It took considerably more than the hour
estimated here, for a reason worth carrying: **the row's own "corrected fix spec" was wrong**, and so was
the first implementation of it. This section told the next reader *"do not re-derive it"* — that
instruction is what the spec's error was hiding behind, and `verification-claims-must-name-their-evidence`
already forbids it (*"Never instruct a reviewer not to verify something"*). Round 1 returned ~36 findings
across three independent layers, ~10 HIGH. The re-scope that was owed here **is now done** — see immediately below. Also relevant: the rows `T183` filed — derive them with `grep -n 'T183' _bmad-output/planning-artifacts/convoke-note-initiative-lifecycle-backlog.md` rather than listing them here, since an earlier draft of this line already under-counted them.

**The re-scope is done (2026-09-28).** Both epics had framing that predated their own governing ruling:
the `s4` epic's Ruling line read *"S4 now, S2 the destination"* against A1.2, and the `cir` epic's defect-4
row claimed Gyre was *"resolved by the ruling's design"* while reasoning about whether Gyre can **run**
rather than whether it can be **referenced**. Both corrected — though the `s4` line was corrected first and the `cir` one only after R1 caught that this
sentence already claimed both, the sweep having been run against the sentence in one file rather than
against the claim. **Next action is `cir-1-3`**, then the hub
only with operator evidence. **`IN-248`** carries what *"reference all of our agents"* would actually cost:
7 of 11 are declarable, and Gyre's four have no in-repo `SKILL.md` at all.

## 6. Open decisions — all small, none blocking `cir-1-3`

- **`IN-240(f2)`** — keep the baseline↔references assertion symmetric, or assert only the direction the
  guard exists for?
- **`IN-240`** — may a reference file name *additional* paths (exact set equality currently reddens a
  legitimate `hc*` contract pointer)? And keep hard-coding the sibling-`steps/` convention?
- **The hub's name is ruled (`convoke`); its shape is not** beyond C10/C11.
- ~~**`sprint-status.yaml` vocabulary**~~ — **RULED 2026-09-28. `deferred` and `duplicate` added.**
  `s4-1-1` is now `deferred` and `cir-1-2` is `duplicate`, correcting a mislabel that had stood since
  2026-09-27. **The ruling was forced by a demonstrated destructive path, not by tidiness:** neither
  pre-existing value was safe for a deferred story — `ready-for-dev` is what `bmad-dev-story` selects on
  (`SKILL.md:103-107`), flipping the status before it reads the file, and `backlog` is what
  `bmad-create-story` selects on (`SKILL.md:140-144`), whose `:399` *"Save story document unconditionally"*
  would have **overwritten `s4-1-1`'s file**, four closed operator rulings and its deferral banner with it.
  A comment is not data to either skill. Both new values are selected by neither, so the hold is mechanical.
  Consumer audit run: no consumer enumerates an allowed set, `backlog-integrity.js` parses both as
  `[a-z-]+` and classifies `deferred` as live, and its three status-divergence warnings are unchanged.
- **Is `cir-1-1` in the right epic?** It fixes source-repo path hygiene, not the channel problem the
  epic's Why invokes. See §7.

## 7. Traps — each one cost real time

- **Do not use `resolve_config.py`** for module config. Central TOML only; its `modules` keys have no
  `bme`; it drops `document_output_language` and `project_name`; and it would take `_bmad/bme/` Python
  usage 0 → 3 against an invariant the absorption architecture credits with making upstream's churn inert.
  Read a config **Convoke actually writes** instead — which is **not** `_bmad/bme/config.yaml`.
  **Corrected 2026-09-27 by `T183`:** that file is BMAD's installer's to write, `files[]` carries no
  `_bmad/bme/config.*`, and a real fresh install (`bash scripts/audit/try-fresh-install.sh`) produces only
  the six *submodule* configs. Reading it alone resolves to nothing for any operator without upstream
  BMAD. The shipped read is `{project-root}/_bmad/bme/_vortex/config.yaml`. Before rebuilding this in
  prose, read `scripts/update/lib/config-loader.js` — `:21` already replaces the `bmad-init` load path and
  `:35` already assigns `{user}` resolution to the agent.
- **`agent-surface-parity.js` does not cover activation-block defects.** Its check is a presence regex
  (`:110`) that passes the defect and the fix identically. **Three stories cited it as coverage.**
- **`refs:audit` sees nothing in the agent reference files** — it space-fills inline code spans, and every
  path there is backticked. It reports *0 references checked* over them.
- **`grep -rc` is never a falsifier.** It exits 0 whether or not the string is present.
- **Bare `eslint --max-warnings 0` exits 1** (it lints `eslint.config.mjs`). Use `npm run lint`. **Bare
  `agent-surface-parity.js` exits 1** — it needs two git refs.
- **C8 still binds.** There is no self-serve retraction from `skills.sh`; a published name is permanent.
  Nothing new is published until the discovery surface is declared and checkable — and **C12 declined to
  build the gate**, so that is an accepted risk, not compliance.
- **Grep the backlog before authoring a story.** `cir-1-2` duplicated `T183` by ten days.
- **Closing a story silently drops its unmet ACs.** Nothing walks them; the status flips and the
  obligations go with it. `cir-1-2` was closed as a duplicate of `T183` carrying **9** ACs
  (`grep -c '^\*\*AC[0-9a-z]*' _bmad-output/implementation-artifacts/cir-1-2-*.md`). **AC7** — file the v7
  watch item — was unmet, and survived only because that pass happened to re-read the ACs; it is now
  `IN-241`. Whichever of them the successor does *not* inherit dies unrecorded, and the row shows nothing.
  **Before closing a story for any reason — duplicate, superseded, descoped — walk its ACs and dispose of
  each one explicitly: inherited by <successor>, already satisfied, or re-filed as <ID>.** §8's *carry the
  obligations forward* is this same class one artifact up, at the superseded PRD; this is the story-level
  instance, and it has now happened at both levels.

## 8. The two lessons that outlived the work

Both are now rules in `project-context.md`, which is the durable form:

- **`derive-before-you-write`**, and specifically its **mechanism clause** — six rescued drafts were one
  mistake: a mechanism prescribed without reading the mechanism.
- **`file-stale-knowledge-when-you-find-it`** — findings about someone else's sentence go to the queue
  (§2 row 4), not into a drive-by edit and not into a chat message.

And one that is not a rule because it needs a person: **when an artifact is superseded, carry its
obligations forward, not just its decisions and defects.** The PRD was the only place the per-segment
obligations lived. Its diagnosis, decisions and defects were all inherited; the obligations were not — and
that is why `cir-1-1` could drift from the channel to the source repo with no gate noticing.
